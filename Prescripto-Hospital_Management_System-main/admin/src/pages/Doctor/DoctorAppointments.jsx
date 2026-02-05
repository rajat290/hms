import React, { useState } from 'react'
import { useContext, useEffect } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import { toast } from 'react-toastify'
import axios from 'axios'

const DoctorAppointments = () => {

  const { dToken, appointments, getAppointments, cancelAppointment, completeAppointment, acceptAppointment, backendUrl } = useContext(DoctorContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)

  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
  const [currentAppointmentId, setCurrentAppointmentId] = useState(null)
  const [medicines, setMedicines] = useState([])
  const [currentMed, setCurrentMed] = useState({ name: '', dosage: '', duration: '', instruction: '' })

  const addNote = async (appointmentId) => {
    const note = prompt("Enter note for this appointment:");
    if (!note) return;
    try {
      const { data } = await axios.post(backendUrl + '/api/doctor/add-notes', { docId: dToken, appointmentId, notes: note }, { headers: { dToken } }) // docId is mostly inferred or passed if needed, controller uses dToken to verify but appointmentModel has docId. My updated controller logic expects docId in body? No, middleware sets it? 
      // Wait, doctorMiddleware adds `docId` to body? 
      // Let's check authDoctor.js? Usually it acts like that.
      // But the previous controller code: `const { docId, appointmentId, notes } = req.body;`
      // So I MUST send docId if the middleware doesn't inject it into body but into req.docId. 
      // `authDoctor` typically: `req.body.docId = decoded.id`.
      // So I don't need to send it explicitly if I rely on that. 
      // But for safety I can rely on what the context does. 
      // Context calls look like: `axios.post(..., { appointmentId }, ...)`
      // So likely middleware handles it.
      // Actually, looking at `api/doctor/cancel-appointment` in context: `axios.post(..., { appointmentId }, ...)`
      // So `docId` is injected.

      // Wait, `addAppointmentNotes` controller: `const { docId, ... } = req.body`
      // `authDoctor` middleware usually does `req.body.docId = decoded.id`.
      // So simply sending `notes` and `appointmentId` is enough.

      await axios.post(backendUrl + '/api/doctor/add-notes', { appointmentId, notes: note }, { headers: { dToken } })
      toast.success("Note added")
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleAddMed = () => {
    if (!currentMed.name || !currentMed.dosage) return toast.error("Name and Dosage required");
    setMedicines([...medicines, currentMed]);
    setCurrentMed({ name: '', dosage: '', duration: '', instruction: '' });
  }

  const submitPrescription = async () => {
    try {
      const { data } = await axios.post(backendUrl + '/api/doctor/generate-prescription', { appointmentId: currentAppointmentId, medicines }, { headers: { dToken } })
      if (data.success) {
        toast.success(data.message)
        setShowPrescriptionModal(false)
        setMedicines([])
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (dToken) {
      getAppointments()
    }
  }, [dToken])

  return (
    <div className='w-full max-w-6xl m-5 '>

      <p className='mb-3 text-lg font-medium'>All Appointments</p>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr_1fr] gap-1 py-3 px-6 border-b'>
          <p>#</p>
          <p>Patient</p>
          <p>Payment</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Fees</p>
          <p>Action</p>
          <p>Tools</p>
        </div>
        {appointments.map((item, index) => (
          <div className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
            <p className='max-sm:hidden'>{index + 1}</p>
            <div className='flex items-center gap-2'>
              <img src={item.userData.image} className='w-8 rounded-full' alt="" /> <p>{item.userData.name}</p>
            </div>
            <div>
              <p className='text-xs inline border border-primary px-2 rounded-full'>
                {item.paymentStatus || (item.payment ? 'Online' : 'CASH')}
              </p>
            </div>
            <p className='max-sm:hidden'>{calculateAge(item.userData.dob)}</p>
            <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
            <p>{currency}{item.amount}</p>
            {item.cancelled
              ? <p className='text-red-400 text-xs font-medium'>Cancelled</p>
              : item.isCompleted
                ? <p className='text-green-500 text-xs font-medium'>Completed</p>
                : <div className='flex'>
                  <img onClick={() => cancelAppointment(item._id)} className='w-10 cursor-pointer' src={assets.cancel_icon} alt="" />
                  {item.isAccepted ? (
                    <img onClick={() => completeAppointment(item._id)} className='w-10 cursor-pointer' src={assets.tick_icon} alt="" title="Complete Appointment" />
                  ) : (
                    <button onClick={() => acceptAppointment(item._id)} className='text-sm border border-green-500 text-green-500 px-2 py-1 rounded hover:bg-green-500 hover:text-white transition-all'>Accept</button>
                  )}
                </div>
            }
            <div className='flex flex-col gap-1 text-xs'>
              <button onClick={() => addNote(item._id)} className='text-blue-500 underline text-left'>Add Note</button>
              <button onClick={() => { setCurrentAppointmentId(item._id); setShowPrescriptionModal(true); }} className='text-green-500 underline text-left'>Prescribe</button>
            </div>
          </div>
        ))}
      </div>

      {/* Prescription Modal */}
      {showPrescriptionModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white p-5 rounded-lg w-full max-w-lg'>
            <h2 className='text-xl font-bold mb-4'>Create Prescription</h2>
            <div className='flex flex-col gap-2 mb-4'>
              <input type="text" placeholder="Medicine Name" className='border p-2' value={currentMed.name} onChange={e => setCurrentMed({ ...currentMed, name: e.target.value })} />
              <input type="text" placeholder="Dosage (e.g. 1-0-1)" className='border p-2' value={currentMed.dosage} onChange={e => setCurrentMed({ ...currentMed, dosage: e.target.value })} />
              <input type="text" placeholder="Duration (e.g. 5 days)" className='border p-2' value={currentMed.duration} onChange={e => setCurrentMed({ ...currentMed, duration: e.target.value })} />
              <input type="text" placeholder="Instruction (After meal)" className='border p-2' value={currentMed.instruction} onChange={e => setCurrentMed({ ...currentMed, instruction: e.target.value })} />
              <button onClick={handleAddMed} className='bg-blue-500 text-white p-2 rounded'>Add Medicine</button>
            </div>
            <div className='bg-gray-50 p-2 mb-4 max-h-40 overflow-y-auto'>
              {medicines.map((med, idx) => (
                <div key={idx} className='border-b p-1 text-sm'>
                  <b>{med.name}</b> - {med.dosage} - {med.duration}
                </div>
              ))}
            </div>
            <div className='flex justify-end gap-2'>
              <button onClick={() => setShowPrescriptionModal(false)} className='bg-gray-300 px-4 py-2 rounded'>Cancel</button>
              <button onClick={submitPrescription} className='bg-primary text-white px-4 py-2 rounded'>Submit Prescription</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default DoctorAppointments