import React, { useContext, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AdminContext } from '../context/AdminContext'
import { DoctorContext } from '../context/DoctorContext'
import { StaffContext } from '../context/StaffContext'
import { useNavigate } from 'react-router-dom'

const ForgotPassword = ({ setView }) => {
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('Doctor') // Default to Doctor as Admin is hardcoded
    const [loading, setLoading] = useState(false)
    const { backendUrl } = useContext(AdminContext)
    const navigate = useNavigate()

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            let endpoint = ''
            if (role === 'Doctor') endpoint = '/api/doctor/forgot-password'
            else if (role === 'Staff') endpoint = '/api/staff/forgot-password'
            else {
                toast.error("Admin password reset is not supported via this flow (Hardcoded credentials).")
                setLoading(false)
                return
            }

            const { data } = await axios.post(backendUrl + endpoint, { email })
            if (data.success) {
                toast.success(data.message || 'Reset link sent to your email')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center justify-center p-4'>
            <div className='flex flex-col gap-6 m-auto items-start p-10 min-w-96 glass-effect border border-gray-100 rounded-3xl text-gray-600 shadow-2xl relative overflow-hidden'>
                <div className='absolute top-0 left-0 w-2 h-full bg-primary'></div>

                <div className='w-full'>
                    <p className='text-3xl font-bold text-secondary text-center'>Forgot Password</p>
                    <p className='text-sm text-gray-500 mt-2 text-center'>Enter your email to receive a password reset link</p>
                </div>

                <div className='w-full'>
                    <p className='text-sm font-medium mb-1'>I am a</p>
                    <select
                        onChange={(e) => setRole(e.target.value)}
                        value={role}
                        className='border border-gray-200 rounded-xl w-full p-3 mt-1 bg-gray-50/50 focus:bg-white focus:border-primary outline-none transition-all'
                    >
                        <option value="Doctor">Doctor</option>
                        <option value="Staff">Staff</option>
                        <option value="Admin">Admin (Note: Reset not supported)</option>
                    </select>
                </div>

                <div className='w-full'>
                    <p className='text-sm font-medium mb-1'>Email Address</p>
                    <input
                        className='border border-gray-200 rounded-xl w-full p-3 mt-1 bg-gray-50/50 focus:bg-white focus:border-primary outline-none transition-all'
                        type="email"
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                        required
                        placeholder='yourname@mediflow.com'
                    />
                </div>

                <button disabled={loading} type='submit' className='bg-gradient-primary text-white w-full py-4 rounded-xl font-bold text-base hover:shadow-lg hover:scale-[1.02] transition-all duration-300 mt-2 flex items-center justify-center gap-3'>
                    {loading && <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>}
                    {loading ? 'Sending link...' : 'Send Reset Link'}
                </button>

                <p onClick={() => setView('login')} className='text-primary underline cursor-pointer w-full text-center text-sm font-medium'>Back to Login</p>
            </div>
        </form>
    )
}

export default ForgotPassword
