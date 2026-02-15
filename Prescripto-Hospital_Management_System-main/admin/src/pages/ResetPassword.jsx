import React, { useContext, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AdminContext } from '../context/AdminContext'
import { useNavigate, useSearchParams } from 'react-router-dom'

const ResetPassword = ({ setView }) => {
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const { backendUrl } = useContext(AdminContext)
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const token = searchParams.get('token')
    const role = searchParams.get('role')

    const onSubmitHandler = async (e) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            return toast.error("Passwords do not match")
        }

        if (newPassword.length < 8) {
            return toast.error("Password must be at least 8 characters")
        }

        setLoading(true)

        try {
            let endpoint = ''
            if (role === 'doctor') endpoint = '/api/doctor/reset-password'
            else if (role === 'staff') endpoint = '/api/staff/reset-password'
            else {
                toast.error("Invalid role in reset link")
                setLoading(false)
                return
            }

            const { data } = await axios.post(backendUrl + endpoint, { token, newPassword })
            if (data.success) {
                toast.success(data.message || 'Password reset successful!')
                setTimeout(() => {
                    if (setView) setView('login')
                    else navigate('/')
                }, 2000)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!token) {
        return (
            <div className='min-h-[80vh] flex items-center justify-center p-4'>
                <div className='p-10 glass-effect border border-red-100 rounded-3xl text-center shadow-2xl'>
                    <p className='text-xl font-bold text-red-500'>Invalid Reset Link</p>
                    <p className='text-gray-500 mt-2'>The reset token is missing or invalid.</p>
                    <button onClick={() => setView ? setView('login') : navigate('/')} className='mt-6 text-primary underline font-medium'>Go back to login</button>
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center justify-center p-4'>
            <div className='flex flex-col gap-6 m-auto items-start p-10 min-w-96 glass-effect border border-gray-100 rounded-3xl text-gray-600 shadow-2xl relative overflow-hidden'>
                <div className='absolute top-0 left-0 w-2 h-full bg-primary'></div>

                <div className='w-full text-center'>
                    <p className='text-3xl font-bold text-secondary'>Reset Password</p>
                    <p className='text-sm text-gray-500 mt-2 capitalize'>Account Type: {role}</p>
                </div>

                <div className='w-full'>
                    <p className='text-sm font-medium mb-1'>New Password</p>
                    <input
                        className='border border-gray-200 rounded-xl w-full p-3 mt-1 bg-gray-50/50 focus:bg-white focus:border-primary outline-none transition-all'
                        type="password"
                        onChange={(e) => setNewPassword(e.target.value)}
                        value={newPassword}
                        required
                        placeholder='Min 8 characters'
                    />
                </div>

                <div className='w-full'>
                    <p className='text-sm font-medium mb-1'>Confirm Password</p>
                    <input
                        className='border border-gray-200 rounded-xl w-full p-3 mt-1 bg-gray-50/50 focus:bg-white focus:border-primary outline-none transition-all'
                        type="password"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        value={confirmPassword}
                        required
                    />
                </div>

                <button disabled={loading} type='submit' className='bg-gradient-primary text-white w-full py-4 rounded-xl font-bold text-base hover:shadow-lg hover:scale-[1.02] transition-all duration-300 mt-2 flex items-center justify-center gap-3'>
                    {loading && <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>}
                    {loading ? 'Updating password...' : 'Update Password'}
                </button>
            </div>
        </form>
    )
}

export default ResetPassword
