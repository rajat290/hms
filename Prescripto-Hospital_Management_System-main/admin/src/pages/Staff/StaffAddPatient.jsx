import React, { useContext, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { StaffContext } from '../../context/StaffContext'
import { AppContext } from '../../context/AppContext'

const StaffAddPatient = () => {
    const { sToken } = useContext(StaffContext)
    const { backendUrl } = useContext(AppContext)

    const [form, setForm] = useState({
        name: '', email: '', phone: '', dob: '', gender: 'Not Selected',
        address1: '', address2: '' // Removed MRN, Aadhaar, Insurance
    })

    const [profileImg, setProfileImg] = useState(null)
    const [creating, setCreating] = useState(false)
    const [createdCredentials, setCreatedCredentials] = useState(null)

    const onInput = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    const validate = () => {
        if (!form.name || !form.email || !form.phone || !form.dob || !form.gender) {
            toast.error('Please fill required fields (Name, Email, Phone, DOB, Gender)')
            return false
        }
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
            // Simplified Address
            const address = { line1: form.address1, line2: form.address2 }
            fd.append('address', JSON.stringify(address))

            if (profileImg) fd.append('image', profileImg)

            const { data } = await axios.post(backendUrl + '/api/staff/create-patient', fd, { headers: { sToken } })
            if (data.success) {
                toast.success(data.message)
                setCreatedCredentials(data.credentials)
                setForm({ name: '', email: '', phone: '', dob: '', gender: 'Not Selected', address1: '', address2: '' })
                setProfileImg(null)
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

    return (
        <div className='w-full px-4 sm:px-10 m-5'>
            <div className='max-w-2xl bg-white p-8 rounded-xl border shadow-sm'>
                <p className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2'>
                    <img src={assets.add_icon} className='w-6 invert bg-black rounded-full p-1' alt="" />
                    New Patient Registration
                </p>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4'>
                    <div className='md:col-span-2 flex items-center gap-4 mb-2'>
                        <label htmlFor="doc-img" className='cursor-pointer flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-lg border border-dashed border-gray-300 hover:bg-gray-100 transition-colors w-full'>
                            <img className='w-12 h-12 rounded-full object-cover bg-gray-200' src={profileImg ? URL.createObjectURL(profileImg) : assets.upload_area} alt="" />
                            <div>
                                <p className='text-sm font-medium text-gray-700'>Upload Photo</p>
                                <p className='text-xs text-gray-400'>Allowed: JPG, PNG</p>
                            </div>
                        </label>
                        <input onChange={(e) => setProfileImg(e.target.files[0])} type="file" id="doc-img" hidden />
                    </div>

                    <div>
                        <label className='block text-xs font-bold text-gray-700 uppercase mb-1'>Full Name *</label>
                        <input name='name' value={form.name} onChange={onInput} className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none' placeholder='e.g. John Doe' />
                    </div>
                    <div>
                        <label className='block text-xs font-bold text-gray-700 uppercase mb-1'>Phone Number *</label>
                        <input name='phone' value={form.phone} onChange={onInput} className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none' placeholder='e.g. 9876543210' />
                    </div>
                    <div>
                        <label className='block text-xs font-bold text-gray-700 uppercase mb-1'>Email (Optional)</label>
                        <input name='email' value={form.email} onChange={onInput} className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none' placeholder='john@example.com' />
                    </div>
                    <div>
                        <label className='block text-xs font-bold text-gray-700 uppercase mb-1'>Date of Birth *</label>
                        <input type='date' name='dob' value={form.dob} onChange={onInput} className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none' />
                    </div>
                    <div>
                        <label className='block text-xs font-bold text-gray-700 uppercase mb-1'>Gender *</label>
                        <select name='gender' value={form.gender} onChange={onInput} className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white'>
                            <option>Not Selected</option>
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label className='block text-xs font-bold text-gray-700 uppercase mb-1'>Location / Address</label>
                        <input name='address1' value={form.address1} onChange={onInput} className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none' placeholder='Area / City' />
                    </div>
                </div>

                <div className='mt-8 pt-4 border-t'>
                    <button
                        onClick={handleSubmit}
                        disabled={creating}
                        className={`w-full py-3 rounded-lg font-bold text-white shadow-md transition-all ${creating ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'}`}
                    >
                        {creating ? 'Registering...' : 'Register Patient'}
                    </button>
                </div>
            </div>

            {createdCredentials && (
                <div className='bg-white p-6 rounded border mt-6'>
                    <p className='text-lg font-semibold text-gray-700 mb-2'>Patient Created</p>
                    <div className='mt-4 bg-gray-50 border rounded p-4'>
                        <p className='font-medium text-gray-800 mb-2'>Login Credentials</p>
                        <p className='text-sm text-gray-700'>Email: {createdCredentials.email}</p>
                        <p className='text-sm text-gray-700'>Temporary Password: {createdCredentials.password}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default StaffAddPatient
