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
    }, [token])

    // Function to update user profile data using API
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

    return userData ? (
        <div className='max-w-lg flex flex-col gap-2 text-sm pt-5'>

            {isEdit
                ? <label htmlFor='image' >
                    <div className='inline-block relative cursor-pointer'>
                        <img className='w-36 rounded opacity-75' src={image ? URL.createObjectURL(image) : userData.image} alt="" />
                        <img className='w-10 absolute bottom-12 right-12' src={image ? '' : assets.upload_icon} alt="" />
                    </div>
                    <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden />
                </label>
                : <img className='w-36 rounded' src={userData.image} alt="" />
            }

            {isEdit
                ? <input className='bg-gray-50 text-3xl font-medium max-w-60' type="text" onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))} value={userData.name} />
                : <p className='font-medium text-3xl text-[#262626] mt-4'>{userData.name}</p>
            }

            <hr className='bg-[#ADADAD] h-[1px] border-none' />

            <div className='mt-4'>
                <p className='text-gray-600 underline mt-3'>FINANCIAL SUMMARY</p>
                <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-[#363636]'>
                    <p className='font-medium'>Total Paid:</p>
                    <p className='text-green-600'>{currency || '$'}{financials.totalPaid}</p>
                    <p className='font-medium'>Pending Dues:</p>
                    <p className='text-red-500 font-bold'>{currency || '$'}{financials.pendingDues}</p>
                </div>
            </div>

            <hr className='bg-[#ADADAD] h-[1px] border-none mt-4' />

            <div>
                <p className='text-gray-600 underline mt-3'>CONTACT INFORMATION</p>
                <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-[#363636]'>
                    <p className='font-medium'>Email id:</p>
                    <p className='text-blue-500'>{userData.email}</p>
                    <p className='font-medium'>Phone:</p>

                    {isEdit
                        ? <input className='bg-gray-50 max-w-52' type="text" onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))} value={userData.phone} />
                        : <p className='text-blue-500'>{userData.phone}</p>
                    }

                    <p className='font-medium'>Address:</p>

                    {isEdit
                        ? <p>
                            <input className='bg-gray-50' type="text" onChange={(e) => setUserData(prev => ({ ...prev, address: { ...prev.address, line1: e.target.value } }))} value={userData.address.line1} />
                            <br />
                            <input className='bg-gray-50' type="text" onChange={(e) => setUserData(prev => ({ ...prev, address: { ...prev.address, line2: e.target.value } }))} value={userData.address.line2} /></p>
                        : <p className='text-gray-500'>{userData.address.line1} <br /> {userData.address.line2}</p>
                    }

                </div>
            </div>
            <div>
                <p className='text-[#797979] underline mt-3'>BASIC INFORMATION</p>
                <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-gray-600'>
                    <p className='font-medium'>Gender:</p>

                    {isEdit
                        ? <select className='max-w-20 bg-gray-50' onChange={(e) => setUserData(prev => ({ ...prev, gender: e.target.value }))} value={userData.gender} >
                            <option value="Not Selected">Not Selected</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                        : <p className='text-gray-500'>{userData.gender}</p>
                    }

                    <p className='font-medium'>Birthday:</p>

                    {isEdit
                        ? <input className='max-w-28 bg-gray-50' type='date' onChange={(e) => setUserData(prev => ({ ...prev, dob: e.target.value }))} value={userData.dob} />
                        : <p className='text-gray-500'>{userData.dob}</p>
                    }

                </div>
            </div>

            <hr className='bg-[#ADADAD] h-[1px] border-none mt-4' />

            <div>
                <p className='text-gray-600 underline mt-3'>MEDICAL HISTORY</p>
                <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-gray-600'>
                    <p className='font-medium'>Blood Group:</p>
                    {isEdit
                        ? <input className='bg-gray-50 max-w-20' type="text" onChange={(e) => setUserData(prev => ({ ...prev, bloodGroup: e.target.value }))} value={userData.bloodGroup} />
                        : <p className='text-gray-500'>{userData.bloodGroup || 'N/A'}</p>
                    }

                    <p className='font-medium'>Known Allergies:</p>
                    {isEdit
                        ? <textarea className='bg-gray-50' onChange={(e) => setUserData(prev => ({ ...prev, knownAllergies: e.target.value }))} value={userData.knownAllergies} />
                        : <p className='text-gray-500 whitespace-pre-wrap'>{userData.knownAllergies || 'None'}</p>
                    }

                    <p className='font-medium'>Current Medications:</p>
                    {isEdit
                        ? <textarea className='bg-gray-50' onChange={(e) => setUserData(prev => ({ ...prev, currentMedications: e.target.value }))} value={userData.currentMedications} />
                        : <p className='text-gray-500 whitespace-pre-wrap'>{userData.currentMedications || 'None'}</p>
                    }
                </div>
            </div>

            <hr className='bg-[#ADADAD] h-[1px] border-none mt-4' />

            <div>
                <p className='text-gray-600 underline mt-3'>INSURANCE & EMERGENCY</p>
                <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-gray-600'>
                    <p className='font-medium'>Provider:</p>
                    {isEdit
                        ? <input className='bg-gray-50' type="text" onChange={(e) => setUserData(prev => ({ ...prev, insuranceProvider: e.target.value }))} value={userData.insuranceProvider} />
                        : <p className='text-gray-500'>{userData.insuranceProvider || 'N/A'}</p>
                    }

                    <p className='font-medium'>Insurance ID:</p>
                    {isEdit
                        ? <input className='bg-gray-50' type="text" onChange={(e) => setUserData(prev => ({ ...prev, insuranceId: e.target.value }))} value={userData.insuranceId} />
                        : <p className='text-gray-500'>{userData.insuranceId || 'N/A'}</p>
                    }

                    <p className='font-medium'>Emergency Contact:</p>
                    {isEdit
                        ? <div className='flex flex-col gap-1'>
                            <input className='bg-gray-50' placeholder='Name' type="text" onChange={(e) => setUserData(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, name: e.target.value } }))} value={userData.emergencyContact?.name} />
                            <input className='bg-gray-50' placeholder='Phone' type="text" onChange={(e) => setUserData(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, phone: e.target.value } }))} value={userData.emergencyContact?.phone} />
                        </div>
                        : <p className='text-gray-500'>{userData.emergencyContact?.name || 'N/A'} - {userData.emergencyContact?.phone || ''}</p>
                    }
                </div>
            </div>

            <hr className='bg-[#ADADAD] h-[1px] border-none mt-4' />

            <div className='mt-4 flex items-center gap-4'>
                <p className='text-gray-600 font-medium'>Two-Factor Authentication (2FA)</p>
                <button
                    onClick={() => setUserData(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))}
                    disabled={!isEdit}
                    className={`px-4 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${userData.twoFactorEnabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                    {userData.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </button>
            </div>
            <div className='mt-10'>

                {isEdit
                    ? <button onClick={updateUserProfileData} className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all'>Save information</button>
                    : <button onClick={() => setIsEdit(true)} className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all'>Edit</button>
                }

            </div>
        </div>
    ) : null
}

export default MyProfile