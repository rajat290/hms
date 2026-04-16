import React, { useContext, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../../assets/assets';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import PageHeader from '../../components/backoffice/PageHeader';
import SurfaceCard from '../../components/backoffice/SurfaceCard';

const AddDoctor = () => {
  const [docImg, setDocImg] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [experience, setExperience] = useState('1 Year');
  const [fees, setFees] = useState('');
  const [about, setAbout] = useState('');
  const [speciality, setSpeciality] = useState('General physician');
  const [degree, setDegree] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { backendUrl } = useContext(AppContext);
  const { aToken } = useContext(AdminContext);

  const resetForm = () => {
    setDocImg(false);
    setName('');
    setEmail('');
    setPassword('');
    setExperience('1 Year');
    setFees('');
    setAbout('');
    setSpeciality('General physician');
    setDegree('');
    setAddress1('');
    setAddress2('');
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (!docImg) {
        toast.error('Please select a doctor image.');
        return;
      }

      const formData = new FormData();
      formData.append('image', docImg);
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('experience', experience);
      formData.append('fees', Number(fees));
      formData.append('about', about);
      formData.append('speciality', speciality);
      formData.append('degree', degree);
      formData.append('address', JSON.stringify({ line1: address1, line2: address2 }));

      const { data } = await axios.post(`${backendUrl}/api/admin/add-doctor`, formData, {
        headers: { aToken },
      });

      if (data.success) {
        toast.success(data.message);
        resetForm();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-soft-in">
      <PageHeader
        eyebrow="Doctor onboarding"
        title="Create a doctor profile that feels complete before the first patient ever sees it."
        description="Keep admin onboarding structured and forgiving so the team can add specialists without missing the basics that matter."
      />

      <form onSubmit={onSubmitHandler} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <SurfaceCard className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Profile image</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Identity snapshot</h2>
              <p className="mt-1 text-sm text-slate-500">Upload a clear photo to make roster and patient views feel trustworthy.</p>
            </div>

            <label htmlFor="doc-img" className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50/80 text-center transition hover:border-teal-200 hover:bg-teal-50/50">
              <img src={docImg ? URL.createObjectURL(docImg) : assets.upload_area} alt="" className="mb-4 h-28 w-28 rounded-[28px] object-cover" />
              <p className="text-sm font-semibold text-slate-900">Click to upload doctor photo</p>
              <p className="mt-1 text-sm text-slate-500">PNG or JPG works well for cards, lists, and schedule views.</p>
            </label>
            <input id="doc-img" type="file" hidden onChange={(event) => setDocImg(event.target.files[0])} />
          </SurfaceCard>

          <SurfaceCard className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Doctor name</label>
                <input className="soft-input" type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Dr. name" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Doctor email</label>
                <input className="soft-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="doctor@hospital.com" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <input className="soft-input pr-14" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Set initial password" required />
                  <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute inset-y-0 right-3 text-sm font-medium text-slate-400 transition hover:text-slate-700">
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Experience</label>
                <select className="soft-select" value={experience} onChange={(event) => setExperience(event.target.value)}>
                  <option value="1 Year">1 Year</option>
                  <option value="2 Year">2 Years</option>
                  <option value="3 Year">3 Years</option>
                  <option value="4 Year">4 Years</option>
                  <option value="5 Year">5 Years</option>
                  <option value="6 Year">6 Years</option>
                  <option value="8 Year">8 Years</option>
                  <option value="9 Year">9 Years</option>
                  <option value="10 Year">10 Years</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Speciality</label>
                <select className="soft-select" value={speciality} onChange={(event) => setSpeciality(event.target.value)}>
                  <option value="General physician">General physician</option>
                  <option value="Gynecologist">Gynecologist</option>
                  <option value="Dermatologist">Dermatologist</option>
                  <option value="Pediatricians">Pediatricians</option>
                  <option value="Neurologist">Neurologist</option>
                  <option value="Gastroenterologist">Gastroenterologist</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Consultation fee</label>
                <input className="soft-input" type="number" value={fees} onChange={(event) => setFees(event.target.value)} placeholder="0" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Degree</label>
                <input className="soft-input" type="text" value={degree} onChange={(event) => setDegree(event.target.value)} placeholder="Degree or qualification" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Address line 1</label>
                <input className="soft-input" type="text" value={address1} onChange={(event) => setAddress1(event.target.value)} placeholder="Clinic or hospital line 1" required />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-[1fr_1.2fr]">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Address line 2</label>
                <input className="soft-input" type="text" value={address2} onChange={(event) => setAddress2(event.target.value)} placeholder="Clinic or hospital line 2" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">About doctor</label>
                <textarea className="soft-textarea" value={about} onChange={(event) => setAbout(event.target.value)} rows={5} placeholder="Write a helpful summary for patient-facing doctor details." />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button type="button" className="soft-button-secondary" onClick={resetForm}>
                Reset
              </button>
              <button type="submit" className="soft-button-primary">
                {loading ? 'Creating doctor...' : 'Add doctor'}
              </button>
            </div>
          </SurfaceCard>
        </div>
      </form>
    </div>
  );
};

export default AddDoctor;
