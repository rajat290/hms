import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const MyProfile = () => {

    const [isEdit, setIsEdit] = useState(false)
    const [image, setImage] = useState(false)

    const { token, backendUrl, userData, setUserData, loadUserProfileData, currency } = useContext(AppContext)
    const [financials, setFinancials] = useState({ totalPaid: 0, pendingDues: 0 })

    useEffect(() => {
        if (token) {
            axios.get(backendUrl + '/api/user/financial-summary', { headers: { token } })
                .then(res => {
                    if (res.data.success) {
                        setFinancials({ totalPaid: res.data.totalPaid, pendingDues: res.data.pendingDues })
                    }
                })
                .catch(err => console.log(err))
        }
    }, [token, backendUrl])

    const updateUserProfileData = async () => {
        try {
            const formData = new FormData();
            formData.append('name', userData.name)
            formData.append('phone', userData.phone)
            formData.append('address', JSON.stringify(userData.address))
            formData.append('gender', userData.gender)
            formData.append('dob', userData.dob)
            formData.append('bloodGroup', userData.bloodGroup || '')
            formData.append('knownAllergies', userData.knownAllergies || '')
            formData.append('currentMedications', userData.currentMedications || '')
            formData.append('insuranceProvider', userData.insuranceProvider || '')
            formData.append('insuranceId', userData.insuranceId || '')
            formData.append('emergencyContact', JSON.stringify(userData.emergencyContact))

            image && formData.append('image', image)

            const { data } = await axios.post(backendUrl + '/api/user/update-profile', formData, { headers: { token } })

            if (data.success) {
                toast.success(data.message)
                await loadUserProfileData()
                setIsEdit(false)
                setImage(false)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    return userData && (
        <div className='max-w-4xl mx-auto py-10 px-4'>
            <div className='glass-effect rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden'>

                {/* Profile Header */}
                <div className='flex flex-col sm:flex-row items-center gap-8 mb-10'>
                    <div className='relative group'>
                        <img className='w-40 h-40 rounded-3xl object-cover border-4 border-white shadow-lg group-hover:opacity-90 transition-opacity' src={image ? URL.createObjectURL(image) : userData.image} alt="" />
                        {isEdit && (
                            <label htmlFor="image" className='absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity'>
                                <img className='w-12 text-white' src={assets.upload_icon} alt="" />
                                <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden />
                            </label>
                        )}
                    </div>
                    <div className='flex-1 text-center sm:text-left'>
                        {isEdit ? (
                            <input className='bg-gray-50 text-3xl font-bold rounded-xl px-4 py-2 w-full outline-none focus:bg-white focus:ring-2 focus:ring-primary/20' type="text" value={userData.name} onChange={e => setUserData(prev => ({ ...prev, name: e.target.value }))} />
                        ) : (
                            <h1 className='text-4xl font-bold text-secondary mb-2'>{userData.name}</h1>
                        )}
                        <p className='text-primary font-medium'>Verified Patient Account</p>
                    </div>
                </div>

                <hr className='border-gray-100 mb-10' />

                <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
                    {/* Contact Info */}
                    <div className='bg-blue-50/50 p-6 rounded-2xl'>
                        <p className='text-secondary font-bold text-lg mb-4 uppercase tracking-wider'>Contact Information</p>
                        <div className='flex flex-col gap-4'>
                            <div className='flex flex-col'>
                                <p className='text-xs text-gray-400 font-semibold mb-1 uppercase'>Email ID</p>
                                <p className='text-primary font-medium'>{userData.email}</p>
                            </div>
                            <div className='flex flex-col'>
                                <p className='text-xs text-gray-400 font-semibold mb-1 uppercase'>Phone</p>
                                {isEdit ? (
                                    <input className='bg-white border border-gray-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20' type="text" value={userData.phone} onChange={e => setUserData(prev => ({ ...prev, phone: e.target.value }))} />
                                ) : (
                                    <p className='text-secondary font-medium'>{userData.phone}</p>
                                )}
                            </div>
                            <div className='flex flex-col'>
                                <p className='text-xs text-gray-400 font-semibold mb-1 uppercase'>Address</p>
                                {isEdit ? (
                                    <div className='flex flex-col gap-2'>
                                        <input className='bg-white border border-gray-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20' type="text" value={userData.address.line1} onChange={(e) => setUserData(prev => ({ ...prev, address: { ...prev.address, line1: e.target.value } }))} />
                                        <input className='bg-white border border-gray-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20' type="text" value={userData.address.line2} onChange={(e) => setUserData(prev => ({ ...prev, address: { ...prev.address, line2: e.target.value } }))} />
                                    </div>
                                ) : (
                                    <p className='text-secondary font-medium leading-relaxed'>
                                        {userData.address.line1}<br />
                                        {userData.address.line2}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className='bg-gray-50 p-6 rounded-2xl'>
                        <p className='text-secondary font-bold text-lg mb-4 uppercase tracking-wider'>Basic Information</p>
                        <div className='flex flex-col gap-4'>
                            <div className='flex flex-col'>
                                <p className='text-xs text-gray-400 font-semibold mb-1 uppercase'>Gender</p>
                                {isEdit ? (
                                    <select className='bg-white border border-gray-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20' onChange={(e) => setUserData(prev => ({ ...prev, gender: e.target.value }))} value={userData.gender}>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                ) : (
                                    <p className='text-secondary font-medium'>{userData.gender}</p>
                                )}
                            </div>
                            <div className='flex flex-col'>
                                <p className='text-xs text-gray-400 font-semibold mb-1 uppercase'>Birthday</p>
                                {isEdit ? (
                                    <input className='bg-white border border-gray-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 w-full' type="date" onChange={(e) => setUserData(prev => ({ ...prev, dob: e.target.value }))} value={userData.dob} />
                                ) : (
                                    <p className='text-secondary font-medium'>{userData.dob}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className='mt-8 bg-green-50/30 p-6 rounded-2xl border border-green-100/50'>
                    <p className='text-secondary font-bold text-lg mb-4 uppercase tracking-wider'>Financial Summary</p>
                    <div className='grid grid-cols-2 gap-4'>
                        <div>
                            <p className='text-xs text-gray-400 font-semibold mb-1 uppercase'>Total Paid</p>
                            <p className='text-2xl font-bold text-success'>{currency || '$'}{financials.totalPaid}</p>
                        </div>
                        <div>
                            <p className='text-xs text-gray-400 font-semibold mb-1 uppercase'>Pending Dues</p>
                            <p className='text-2xl font-bold text-error'>{currency || '$'}{financials.pendingDues}</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className='mt-12 flex justify-center'>
                    {isEdit ? (
                        <div className='flex gap-4'>
                            <button onClick={updateUserProfileData} className='bg-gradient-primary text-white px-12 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-all'>Save Changes</button>
                            <button onClick={() => setIsEdit(false)} className='bg-white border border-gray-200 text-gray-500 px-12 py-3 rounded-full font-bold hover:bg-gray-50 transition-all'>Cancel</button>
                        </div>
                    ) : (
                        <button onClick={() => setIsEdit(true)} className='bg-white border border-primary text-primary px-12 py-3 rounded-full font-bold hover:bg-primary hover:text-white transition-all shadow-sm'>Edit Profile</button>
                    )}
                </div>

            </div>
        </div>
    )
}

export default MyProfile