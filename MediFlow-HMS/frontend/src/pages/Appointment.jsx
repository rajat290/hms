import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { assets } from '../assets/assets';
import { AppContext } from '../context/AppContext';
import LoadingState from '../components/ui/LoadingState';
import StatusBadge from '../components/ui/StatusBadge';
import RelatedDoctors from '../components/RelatedDoctors';
import ReviewSection from '../components/ReviewSection';
import { buildSlotDateKey, normalizeDoctorSlots } from '../utils/appointments';

const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const defaultPatientInfo = {
  name: '',
  phone: '',
  email: '',
  gender: '',
  dob: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  },
  emergencyContact: {
    name: '',
    phone: '',
  },
  bloodGroup: '',
  knownAllergies: '',
  currentMedications: '',
  insuranceProvider: '',
  insuranceId: '',
};

const Appointment = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { doctors, currencySymbol, backendUrl, token, doctorsLoading } = useContext(AppContext);

  const [docInfo, setDocInfo] = useState(null);
  const [docSlots, setDocSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [patientInfo, setPatientInfo] = useState(defaultPatientInfo);
  const patientFormRef = useRef(null);

  const availableDayIndexes = useMemo(
    () => docSlots.map((day, index) => ({ day, index })).filter(({ day }) => day.length > 0),
    [docSlots],
  );

  const fetchDocInfo = () => {
    const selectedDoctor = doctors.find((doctor) => doctor._id === docId);
    setDocInfo(selectedDoctor || null);
  };

  const getAvailableSlots = async () => {
    setSlotsLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/doctor-slots/${docId}`);
      if (data.success) {
        const slotsWithDates = normalizeDoctorSlots(data.slots);
        setDocSlots(slotsWithDates);
        const firstAvailable = slotsWithDates.findIndex((day) => day.length > 0);
        if (firstAvailable !== -1) {
          setSlotIndex(firstAvailable);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSlotsLoading(false);
    }
  };

  const initPay = (order) => {
    if (!window.Razorpay) {
      toast.error('Payment gateway is not available right now.');
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Appointment Payment',
      description: 'Appointment Payment',
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response) => {
        try {
          const { data } = await axios.post(`${backendUrl}/api/user/verifyRazorpay`, response, { headers: { token } });
          if (data.success) {
            toast.success('Payment successful. Appointment confirmed.');
            navigate('/my-appointments');
          }
        } catch (error) {
          toast.error(error.message);
        }
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const appointmentRazorpay = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/payment-razorpay`,
        { appointmentId },
        { headers: { token } },
      );

      if (data.success) {
        initPay(data.order);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const validateForm = () => {
    if (!patientInfo.name || !patientInfo.phone || !patientInfo.gender || !patientInfo.dob) {
      return 'Please complete the basic patient details.';
    }

    if (!patientInfo.address.line1 || !patientInfo.address.city || !patientInfo.address.state || !patientInfo.address.zipCode) {
      return 'Please complete the address section.';
    }

    if (!patientInfo.emergencyContact.name || !patientInfo.emergencyContact.phone) {
      return 'Please complete the emergency contact section.';
    }

    if (paymentMethod === 'online' && (!patientInfo.insuranceProvider || !patientInfo.insuranceId)) {
      return 'Please complete the insurance section for online booking.';
    }

    return null;
  };

  const syncProfileToForm = (profile) => {
    setPatientInfo({
      ...defaultPatientInfo,
      ...profile,
      email: profile.email || '',
      address: {
        ...defaultPatientInfo.address,
        ...(profile.address || {}),
      },
      emergencyContact: {
        ...defaultPatientInfo.emergencyContact,
        ...(profile.emergencyContact || {}),
      },
    });
  };

  const confirmBooking = async () => {
    const validationError = showPatientForm ? validateForm() : null;
    if (validationError) {
      toast.error(validationError);
      patientFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (!slotTime) {
      toast.error('Please select an appointment time.');
      return;
    }

    const selectedDate = docSlots[slotIndex]?.[0]?.datetime;
    if (!selectedDate) {
      toast.error('Please select an available day.');
      return;
    }

    try {
      if (showPatientForm) {
        await axios.post(
          `${backendUrl}/api/user/update-profile`,
          {
            ...patientInfo,
            address: JSON.stringify(patientInfo.address),
            emergencyContact: JSON.stringify(patientInfo.emergencyContact),
          },
          { headers: { token } },
        );
      }

      const bookingData = {
        docId,
        slotDate: buildSlotDateKey(selectedDate),
        slotTime,
        paymentMethod: paymentMethod === 'online' ? 'Online' : 'Cash',
        patientInfo: showPatientForm ? patientInfo : null,
      };

      const { data } = await axios.post(`${backendUrl}/api/user/book-appointment`, bookingData, { headers: { token } });

      if (data.success) {
        if (paymentMethod === 'cash') {
          toast.success('Appointment booked. Pay at the clinic.');
          navigate('/my-appointments');
        } else if (data.appointmentId) {
          appointmentRazorpay(data.appointmentId);
        } else {
          toast.error('Booking failed because the appointment could not be prepared for payment.');
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const bookAppointment = async () => {
    if (!token) {
      toast.warning('Please sign in to book an appointment.');
      navigate('/login');
      return;
    }

    try {
      const { data } = await axios.get(`${backendUrl}/api/user/get-profile`, { headers: { token } });

      if (data.success) {
        const profile = data.userData;
        const isProfileComplete =
          profile.name &&
          profile.phone &&
          profile.gender &&
          profile.dob &&
          profile.address?.line1 &&
          profile.address?.city &&
          profile.address?.state &&
          profile.address?.zipCode &&
          profile.emergencyContact?.name &&
          profile.emergencyContact?.phone &&
          (paymentMethod !== 'online' || profile.insuranceProvider);

        syncProfileToForm(profile);

        if (!isProfileComplete || paymentMethod === 'online') {
          setShowPatientForm(true);
          return;
        }
      }
    } catch (error) {
      console.log(error);
    }

    confirmBooking();
  };

  useEffect(() => {
    fetchDocInfo();
  }, [doctors, docId]);

  useEffect(() => {
    getAvailableSlots();
  }, [docId]);

  useEffect(() => {
    if (!docInfo) {
      return;
    }

    const supportsOnline = docInfo.paymentMethods?.online ?? true;
    const supportsCash = docInfo.paymentMethods?.cash ?? true;

    if (supportsOnline) {
      setPaymentMethod('online');
    } else if (supportsCash) {
      setPaymentMethod('cash');
    }
  }, [docInfo]);

  useEffect(() => {
    if (!showPatientForm || !patientFormRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      patientFormRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [showPatientForm]);

  if (doctorsLoading || !docInfo || slotsLoading) {
    return <LoadingState title="Preparing appointment flow" message="Loading doctor details, booking slots, and payment options." fullHeight />;
  }

  return (
    <div className="section-space space-y-8">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link to="/" className="hover:text-primary">Home</Link>
        <span>/</span>
        <Link to="/doctors" className="hover:text-primary">Doctors</Link>
        <span>/</span>
        <Link to={`/doctors/${docInfo.speciality}`} className="hover:text-primary">{docInfo.speciality}</Link>
        <span>/</span>
        <span className="font-semibold text-secondary">{docInfo.name}</span>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr),minmax(0,360px)]">
        <div className="min-w-0 space-y-6">
          <article className="glass-panel overflow-hidden">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,280px),minmax(0,1fr)]">
              <div className="bg-gradient-primary p-4">
                <img src={docInfo.image} alt={docInfo.name} className="h-full max-h-[340px] w-full rounded-[28px] object-cover lg:max-h-none" />
              </div>

              <div className="min-w-0 space-y-6 px-5 py-6 sm:px-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="break-words text-3xl font-bold text-secondary sm:text-4xl">{docInfo.name}</h1>
                      <img src={assets.verified_icon} alt="Verified" className="w-5" />
                    </div>
                    <p className="mt-2 text-sm font-semibold text-primary">
                      {docInfo.degree || 'MBBS'} / {docInfo.speciality}
                    </p>
                  </div>
                  <StatusBadge tone={docInfo.available !== false ? 'success' : 'neutral'}>
                    {docInfo.available !== false ? 'Open for booking' : 'Not taking new bookings'}
                  </StatusBadge>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-[22px] bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Experience</p>
                    <p className="mt-2 text-lg font-bold text-secondary">{docInfo.experience || 'Experienced specialist'}</p>
                  </div>
                  <div className="rounded-[22px] bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Consultation fee</p>
                    <p className="mt-2 text-lg font-bold text-secondary">
                      {currencySymbol}
                      {docInfo.fees}
                    </p>
                  </div>
                  <div className="rounded-[22px] bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Address</p>
                    <p className="mt-2 break-words text-sm font-semibold text-secondary">
                      {docInfo.address?.line1}
                      {docInfo.address?.line2 ? `, ${docInfo.address.line2}` : ''}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">About this doctor</p>
                  <p className="mt-3 max-w-3xl break-words text-sm leading-7 text-slate-600">{docInfo.about}</p>
                </div>
              </div>
            </div>
          </article>

          {showPatientForm ? (
            <article ref={patientFormRef} className="app-card p-5 sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Patient details</p>
                  <h2 className="mt-2 text-3xl font-bold text-secondary">Complete your booking profile</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-500">Online payments and first-time bookings need a fuller patient record before confirmation.</p>
                </div>
                <button onClick={() => setShowPatientForm(false)} className="app-button-ghost">
                  Close form
                </button>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <div className="space-y-5">
                  <div>
                    <p className="mb-3 text-sm font-semibold text-secondary">Personal information</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <input value={patientInfo.name} onChange={(event) => setPatientInfo({ ...patientInfo, name: event.target.value })} className="app-input" placeholder="Full name" />
                      <input value={patientInfo.phone} onChange={(event) => setPatientInfo({ ...patientInfo, phone: event.target.value })} className="app-input" placeholder="Phone" />
                      <input value={patientInfo.email} onChange={(event) => setPatientInfo({ ...patientInfo, email: event.target.value })} className="app-input md:col-span-2" placeholder="Email" />
                      <select value={patientInfo.gender} onChange={(event) => setPatientInfo({ ...patientInfo, gender: event.target.value })} className="app-select">
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <input value={patientInfo.dob} onChange={(event) => setPatientInfo({ ...patientInfo, dob: event.target.value })} className="app-input" type="date" />
                      <input value={patientInfo.bloodGroup} onChange={(event) => setPatientInfo({ ...patientInfo, bloodGroup: event.target.value })} className="app-input md:col-span-2" placeholder="Blood group" />
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-semibold text-secondary">Address</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <input value={patientInfo.address.line1} onChange={(event) => setPatientInfo({ ...patientInfo, address: { ...patientInfo.address, line1: event.target.value } })} className="app-input md:col-span-2" placeholder="Address line 1" />
                      <input value={patientInfo.address.line2} onChange={(event) => setPatientInfo({ ...patientInfo, address: { ...patientInfo.address, line2: event.target.value } })} className="app-input md:col-span-2" placeholder="Address line 2" />
                      <input value={patientInfo.address.city} onChange={(event) => setPatientInfo({ ...patientInfo, address: { ...patientInfo.address, city: event.target.value } })} className="app-input" placeholder="City" />
                      <input value={patientInfo.address.state} onChange={(event) => setPatientInfo({ ...patientInfo, address: { ...patientInfo.address, state: event.target.value } })} className="app-input" placeholder="State" />
                      <input value={patientInfo.address.zipCode} onChange={(event) => setPatientInfo({ ...patientInfo, address: { ...patientInfo.address, zipCode: event.target.value } })} className="app-input" placeholder="Zip code" />
                      <input value={patientInfo.address.country} onChange={(event) => setPatientInfo({ ...patientInfo, address: { ...patientInfo.address, country: event.target.value } })} className="app-input" placeholder="Country" />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="mb-3 text-sm font-semibold text-secondary">Emergency contact</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <input value={patientInfo.emergencyContact.name} onChange={(event) => setPatientInfo({ ...patientInfo, emergencyContact: { ...patientInfo.emergencyContact, name: event.target.value } })} className="app-input" placeholder="Contact name" />
                      <input value={patientInfo.emergencyContact.phone} onChange={(event) => setPatientInfo({ ...patientInfo, emergencyContact: { ...patientInfo.emergencyContact, phone: event.target.value } })} className="app-input" placeholder="Contact phone" />
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-semibold text-secondary">Health context</p>
                    <textarea value={patientInfo.knownAllergies} onChange={(event) => setPatientInfo({ ...patientInfo, knownAllergies: event.target.value })} className="app-textarea" placeholder="Known allergies" />
                    <textarea value={patientInfo.currentMedications} onChange={(event) => setPatientInfo({ ...patientInfo, currentMedications: event.target.value })} className="app-textarea mt-4" placeholder="Current medications" />
                  </div>

                  {paymentMethod === 'online' ? (
                    <div>
                      <p className="mb-3 text-sm font-semibold text-secondary">Insurance details</p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <input value={patientInfo.insuranceProvider} onChange={(event) => setPatientInfo({ ...patientInfo, insuranceProvider: event.target.value })} className="app-input" placeholder="Provider" />
                        <input value={patientInfo.insuranceId} onChange={(event) => setPatientInfo({ ...patientInfo, insuranceId: event.target.value })} className="app-input" placeholder="Policy number" />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button onClick={confirmBooking} className="app-button justify-center">
                  {paymentMethod === 'online' ? 'Save and pay online' : 'Confirm appointment'}
                </button>
                <button onClick={() => setShowPatientForm(false)} className="app-button-secondary justify-center">
                  Cancel
                </button>
              </div>
            </article>
          ) : null}
        </div>

        <aside className="min-w-0 space-y-6 xl:sticky xl:top-28 xl:self-start">
          <article className="app-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Step 1</p>
            <h2 className="mt-2 text-2xl font-bold text-secondary">Choose a day</h2>
            <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
              {availableDayIndexes.map(({ day, index }) => (
                <button
                  key={`${day[0].datetime.toISOString()}-${index}`}
                  onClick={() => {
                    setSlotIndex(index);
                    setSlotTime('');
                  }}
                  className={`min-w-[84px] rounded-[24px] px-4 py-4 text-center sm:min-w-[92px] ${
                    slotIndex === index ? 'bg-secondary text-white' : 'border border-slate-200 bg-white text-secondary'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]">{daysOfWeek[day[0].datetime.getDay()]}</p>
                  <p className="mt-2 text-2xl font-bold">{day[0].datetime.getDate()}</p>
                </button>
              ))}
            </div>
          </article>

          <article className="app-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Step 2</p>
            <h2 className="mt-2 text-2xl font-bold text-secondary">Choose a time</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {(docSlots[slotIndex] || []).map((slot) => (
                <button
                  key={`${slot.time}-${slot.datetime.toISOString()}`}
                  onClick={() => setSlotTime(slot.time)}
                  className={`rounded-full px-4 py-3 text-sm font-semibold ${
                    slot.time === slotTime ? 'bg-primary text-white' : 'border border-slate-200 bg-white text-slate-500'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          </article>

          <article className="app-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Step 3</p>
            <h2 className="mt-2 text-2xl font-bold text-secondary">Payment method</h2>

            <div className="mt-5 grid gap-3">
              {(docInfo.paymentMethods?.cash ?? true) ? (
                <label className={`rounded-[22px] border px-4 py-4 text-sm font-semibold ${paymentMethod === 'cash' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-600'}`}>
                  <input type="radio" name="paymentMethod" value="cash" checked={paymentMethod === 'cash'} onChange={(event) => setPaymentMethod(event.target.value)} className="mr-3" />
                  Pay at clinic
                </label>
              ) : null}

              {(docInfo.paymentMethods?.online ?? true) ? (
                <label className={`rounded-[22px] border px-4 py-4 text-sm font-semibold ${paymentMethod === 'online' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-600'}`}>
                  <input type="radio" name="paymentMethod" value="online" checked={paymentMethod === 'online'} onChange={(event) => setPaymentMethod(event.target.value)} className="mr-3" />
                  Pay online now
                </label>
              ) : null}
            </div>

            <div className="mt-6 rounded-[22px] bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Consultation summary</p>
              <p className="mt-3 text-2xl font-bold text-secondary">
                {currencySymbol}
                {docInfo.fees}
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                Select a slot, then continue. Online payments will ask for additional patient and insurance details before confirmation.
              </p>
            </div>

            <button onClick={bookAppointment} className="app-button mt-6 w-full justify-center">
              {paymentMethod === 'online' ? 'Continue to patient details' : 'Book appointment'}
            </button>
          </article>
        </aside>
      </section>

      <ReviewSection docId={docId} />
      <RelatedDoctors speciality={docInfo.speciality} docId={docId} />
    </div>
  );
};

export default Appointment;
