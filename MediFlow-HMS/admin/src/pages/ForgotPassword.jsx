import React, { useContext, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AdminContext } from '../context/AdminContext'

const ForgotPassword = ({ setView }) => {
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('Doctor')
    const [code, setCode] = useState('')
    const [resetToken, setResetToken] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const { backendUrl } = useContext(AdminContext)

    const endpointBase = useMemo(() => (role === 'Doctor' ? '/api/doctor' : '/api/staff'), [role])

    const requestCode = async () => {
        const { data } = await axios.post(backendUrl + `${endpointBase}/forgot-password`, { email })
        if (data.success) {
            toast.success(data.message || 'If the account exists, a reset code has been sent.')
            setStep(2)
            return
        }

        toast.error(data.message)
    }

    const verifyCode = async () => {
        const { data } = await axios.post(backendUrl + `${endpointBase}/verify-reset-otp`, { email, code })
        if (data.success) {
            setResetToken(data.resetToken)
            toast.success(data.message || 'Code verified.')
            setStep(3)
            return
        }

        toast.error(data.message)
    }

    const savePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match.')
            return
        }

        const { data } = await axios.post(backendUrl + `${endpointBase}/reset-password`, { token: resetToken, newPassword })
        if (data.success) {
            toast.success(data.message || 'Password updated successfully.')
            setTimeout(() => setView('login'), 1200)
            return
        }

        toast.error(data.message)
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (step === 1) {
                await requestCode()
            } else if (step === 2) {
                await verifyCode()
            } else {
                await savePassword()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
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
                    <p className='text-sm text-gray-500 mt-2 text-center'>
                        {step === 1 ? 'Enter your email to receive a 6-digit reset code.' : step === 2 ? 'Paste the code from your email to continue.' : 'Create a new password and return to login.'}
                    </p>
                </div>

                {step === 1 ? (
                    <>
                        <div className='w-full'>
                            <p className='text-sm font-medium mb-1'>I am a</p>
                            <select
                                onChange={(e) => setRole(e.target.value)}
                                value={role}
                                className='border border-gray-200 rounded-xl w-full p-3 mt-1 bg-gray-50/50 focus:bg-white focus:border-primary outline-none transition-all'
                            >
                                <option value="Doctor">Doctor</option>
                                <option value="Staff">Staff</option>
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
                    </>
                ) : null}

                {step === 2 ? (
                    <>
                        <div className='w-full'>
                            <p className='text-sm font-medium mb-1'>Email Address</p>
                            <input
                                className='border border-gray-200 rounded-xl w-full p-3 mt-1 bg-gray-50/50 focus:bg-white focus:border-primary outline-none transition-all'
                                type="email"
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                                required
                            />
                        </div>

                        <div className='w-full'>
                            <p className='text-sm font-medium mb-1'>6-digit code</p>
                            <input
                                className='border border-gray-200 rounded-xl w-full p-3 mt-1 bg-gray-50/50 text-center tracking-[0.38em] focus:bg-white focus:border-primary outline-none transition-all'
                                type="text"
                                onChange={(e) => setCode(e.target.value)}
                                value={code}
                                maxLength={6}
                                required
                                placeholder='123456'
                            />
                        </div>
                    </>
                ) : null}

                {step === 3 ? (
                    <>
                        <div className='w-full'>
                            <p className='text-sm font-medium mb-1'>New Password</p>
                            <input
                                className='border border-gray-200 rounded-xl w-full p-3 mt-1 bg-gray-50/50 focus:bg-white focus:border-primary outline-none transition-all'
                                type="password"
                                onChange={(e) => setNewPassword(e.target.value)}
                                value={newPassword}
                                required
                                placeholder='Minimum 8 characters'
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
                    </>
                ) : null}

                <button disabled={loading} type='submit' className='bg-gradient-primary text-white w-full py-4 rounded-xl font-bold text-base hover:shadow-lg hover:scale-[1.02] transition-all duration-300 mt-2 flex items-center justify-center gap-3'>
                    {loading && <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>}
                    {loading ? (step === 1 ? 'Sending code...' : step === 2 ? 'Verifying code...' : 'Updating password...') : step === 1 ? 'Send Reset Code' : step === 2 ? 'Verify Code' : 'Save New Password'}
                </button>

                <p onClick={() => setView('login')} className='text-primary underline cursor-pointer w-full text-center text-sm font-medium'>Back to Login</p>
            </div>
        </form>
    )
}

export default ForgotPassword
