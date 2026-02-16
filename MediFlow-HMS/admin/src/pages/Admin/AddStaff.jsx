import React, { useContext, useState } from 'react'
import { assets } from '../../assets/assets'
import { toast } from 'react-toastify'
import axios from 'axios'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const AddStaff = () => {

    const [docImg, setDocImg] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [dob, setDob] = useState('')
    const [phone, setPhone] = useState('')

    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const { backendUrl } = useContext(AppContext)
    const { aToken } = useContext(AdminContext)

    const onSubmitHandler = async (event) => {
        event.preventDefault()
        setLoading(true)

        try {

            // if (!docImg) {
            //     return toast.error('Image Not Selected')
            // }

            const formData = new FormData();

            if (docImg) {
                formData.append('image', docImg)
            }
            formData.append('name', name)
            formData.append('email', email)
            formData.append('password', password)
            formData.append('dob', dob)
            formData.append('phone', phone)

            const { data } = await axios.post(backendUrl + '/api/admin/add-staff', formData, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                setDocImg(false)
                setName('')
                setPassword('')
                setEmail('')
                setDob('')
                setPhone('')
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        } finally {
            setLoading(false)
        }

    }

    return (
        <form onSubmit={onSubmitHandler} className='m-5 w-full'>

            <p className='mb-3 text-lg font-medium'>Add Staff</p>

            <div className='bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll'>
                <div className='flex items-center gap-4 mb-8 text-gray-500'>
                    <label htmlFor="doc-img">
                        <img className='w-16 bg-gray-100 rounded-full cursor-pointer' src={docImg ? URL.createObjectURL(docImg) : assets.upload_area} alt="" />
                    </label>
                    <input onChange={(e) => setDocImg(e.target.files[0])} type="file" name="" id="doc-img" hidden />
                    <p>Upload staff <br /> picture</p>
                </div>

                <div className='flex flex-col lg:flex-row items-start gap-10 text-gray-600'>

                    <div className='w-full lg:flex-1 flex flex-col gap-4'>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Staff Name</p>
                            <input onChange={e => setName(e.target.value)} value={name} className='border rounded px-3 py-2' type="text" placeholder='Name' required aria-label="Staff Name" />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Staff Email</p>
                            <input onChange={e => setEmail(e.target.value)} value={email} className='border rounded px-3 py-2' type="email" placeholder='Email' required aria-label="Staff Email" />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Set Password</p>
                            <div className='relative w-full'>
                                <input
                                    onChange={e => setPassword(e.target.value)}
                                    value={password}
                                    className='border rounded px-3 py-2 w-full pr-10'
                                    type={showPassword ? "text" : "password"}
                                    placeholder='Password'
                                    required
                                    aria-label="Set Password"
                                />
                                <div
                                    onClick={() => setShowPassword(!showPassword)}
                                    className='absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-primary transition-colors'
                                    aria-label={showPassword ? "Hide Password" : "Show Password"}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51a7.36 7.36 0 0114.074 0 1.012 1.012 0 010 .644C16.577 16.49 12.72 19.5 12 19.5c-1.272 0-5.123-3.01-6.564-6.844z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className='w-full lg:flex-1 flex flex-col gap-4'>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Phone</p>
                            <input onChange={e => setPhone(e.target.value)} value={phone} className='border rounded px-3 py-2' type="tel" placeholder='Phone Number' aria-label="Staff Phone" />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Date of Birth</p>
                            <input onChange={e => setDob(e.target.value)} value={dob} className='border rounded px-3 py-2' type="date" required aria-label="Staff Date of Birth" />
                        </div>

                    </div>

                </div>

                <button disabled={loading} type='submit' className='bg-primary px-10 py-3 mt-4 text-white rounded-full flex items-center justify-center gap-2'>
                    {loading && <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>}
                    {loading ? 'Adding Staff...' : 'Add Staff'}
                </button>

            </div>


        </form>
    )
}

export default AddStaff
