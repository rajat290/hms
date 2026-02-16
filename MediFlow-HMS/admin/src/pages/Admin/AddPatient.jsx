import React, { useContext, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const AddPatient = () => {
  const { aToken } = useContext(AdminContext)
  const { backendUrl } = useContext(AppContext)

  const [form, setForm] = useState({
    name: '', email: '', phone: '', dob: '', gender: 'Not Selected',
    medicalRecordNumber: '', aadharNumber: '',
    insuranceProvider: '', insuranceId: '',
    emergencyName: '', emergencyPhone: '', emergencyRelation: '',
    address1: '', address2: ''
  })

  const [profileImg, setProfileImg] = useState(null)
  const [aadharImg, setAadharImg] = useState(null)
  const [creating, setCreating] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState(null)
  const [createdPatient, setCreatedPatient] = useState(null)

  const onInput = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    if (!form.name || !form.email || !form.phone || !form.dob || !form.gender || !form.medicalRecordNumber || !form.aadharNumber || !form.address1) {
      toast.error('Please fill all required fields')
      return false
    }
    // basic patterns
    const emailPattern = /.+@.+\..+/
    if (!emailPattern.test(form.email)) { toast.error('Invalid email'); return false }
    const phoneDigits = form.phone.replace(/\D/g, '')
    if (phoneDigits.length < 10) { toast.error('Invalid phone'); return false }
    return true
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setCreating(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('email', form.email)
      fd.append('phone', form.phone)
      fd.append('dob', form.dob)
      fd.append('gender', form.gender)
      fd.append('medicalRecordNumber', form.medicalRecordNumber)
      fd.append('aadharNumber', form.aadharNumber)
      fd.append('insuranceProvider', form.insuranceProvider)
      fd.append('insuranceId', form.insuranceId)
      const address = { line1: form.address1, line2: form.address2 }
      fd.append('address', JSON.stringify(address))
      const emergencyContact = { name: form.emergencyName, phone: form.emergencyPhone, relation: form.emergencyRelation }
      fd.append('emergencyContact', JSON.stringify(emergencyContact))
      if (profileImg) fd.append('image', profileImg)
      if (aadharImg) fd.append('aadharImage', aadharImg)

      const { data } = await axios.post(backendUrl + '/api/admin/create-patient', fd, { headers: { aToken } })
      if (data.success) {
        toast.success(data.message)
        setCreatedCredentials(data.loginCredentials)
        setCreatedPatient(data.patient)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setCreating(false)
    }
  }

  const printCredentials = () => {
    window.print()
  }

  return (
    <div className='w-full px-4 sm:px-10'>
      <div className='bg-white p-6 rounded border'>
        <p className='text-xl font-semibold text-gray-700 mb-4'>Add Patient</p>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm mb-1'>Full Name *</label>
            <input name='name' value={form.name} onChange={onInput} className='w-full border rounded p-2' placeholder='John Doe' />
          </div>
          <div>
            <label className='block text-sm mb-1'>Email *</label>
            <input name='email' value={form.email} onChange={onInput} className='w-full border rounded p-2' placeholder='john@example.com' />
          </div>
          <div>
            <label className='block text-sm mb-1'>Phone *</label>
            <input name='phone' value={form.phone} onChange={onInput} className='w-full border rounded p-2' placeholder='9999999999' />
          </div>
          <div>
            <label className='block text-sm mb-1'>Date of Birth *</label>
            <input type='date' name='dob' value={form.dob} onChange={onInput} className='w-full border rounded p-2' />
          </div>
          <div>
            <label className='block text-sm mb-1'>Gender *</label>
            <select name='gender' value={form.gender} onChange={onInput} className='w-full border rounded p-2'>
              <option>Not Selected</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className='block text-sm mb-1'>Medical Record Number (MRN) *</label>
            <input name='medicalRecordNumber' value={form.medicalRecordNumber} onChange={onInput} className='w-full border rounded p-2' placeholder='MRN-00123' />
          </div>
          <div>
            <label className='block text-sm mb-1'>Insurance Provider</label>
            <input name='insuranceProvider' value={form.insuranceProvider} onChange={onInput} className='w-full border rounded p-2' />
          </div>
          <div>
            <label className='block text-sm mb-1'>Insurance ID</label>
            <input name='insuranceId' value={form.insuranceId} onChange={onInput} className='w-full border rounded p-2' />
          </div>
          <div>
            <label className='block text-sm mb-1'>Aadhaar Number *</label>
            <input name='aadharNumber' value={form.aadharNumber} onChange={onInput} className='w-full border rounded p-2' placeholder='XXXX-XXXX-XXXX' />
          </div>
          <div>
            <label className='block text-sm mb-1'>Emergency Contact Name</label>
            <input name='emergencyName' value={form.emergencyName} onChange={onInput} className='w-full border rounded p-2' />
          </div>
          <div>
            <label className='block text-sm mb-1'>Emergency Contact Phone</label>
            <input name='emergencyPhone' value={form.emergencyPhone} onChange={onInput} className='w-full border rounded p-2' />
          </div>
          <div>
            <label className='block text-sm mb-1'>Emergency Relation</label>
            <input name='emergencyRelation' value={form.emergencyRelation} onChange={onInput} className='w-full border rounded p-2' />
          </div>
          <div className='md:col-span-2'>
            <label className='block text-sm mb-1'>Address Line 1 *</label>
            <input name='address1' value={form.address1} onChange={onInput} className='w-full border rounded p-2' />
          </div>
          <div className='md:col-span-2'>
            <label className='block text-sm mb-1'>Address Line 2</label>
            <input name='address2' value={form.address2} onChange={onInput} className='w-full border rounded p-2' />
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
          <div>
            <label className='block text-sm mb-1'>Profile Image</label>
            <input type='file' accept='image/*' onChange={(e) => setProfileImg(e.target.files[0])} />
          </div>
          <div>
            <label className='block text-sm mb-1'>Aadhaar Image</label>
            <input type='file' accept='image/*' onChange={(e) => setAadharImg(e.target.files[0])} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={creating} className='mt-6 bg-primary text-white px-6 py-2 rounded'>
          {creating ? 'Creating...' : 'Create Patient'}
        </button>
      </div>

      {createdCredentials && createdPatient && (
        <div className='bg-white p-6 rounded border mt-6'>
          <p className='text-lg font-semibold text-gray-700 mb-2'>Patient Created</p>
          <p className='text-sm text-gray-700'>Name: {createdPatient.name}</p>
          <p className='text-sm text-gray-700'>Email: {createdPatient.email}</p>
          <p className='text-sm text-gray-700'>Phone: {createdPatient.phone}</p>
          <p className='text-sm text-gray-700'>MRN: {createdPatient.medicalRecordNumber}</p>
          <p className='text-sm text-gray-700'>Aadhaar: {createdPatient.aadharNumber}</p>

          <div className='mt-4 bg-gray-50 border rounded p-4'>
            <p className='font-medium text-gray-800 mb-2'>Login Credentials</p>
            <p className='text-sm text-gray-700'>Email: {createdCredentials.email}</p>
            <p className='text-sm text-gray-700'>Temporary Password: {createdCredentials.password}</p>
            <button onClick={printCredentials} className='mt-3 border border-primary text-primary px-4 py-1 rounded'>Print</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AddPatient

