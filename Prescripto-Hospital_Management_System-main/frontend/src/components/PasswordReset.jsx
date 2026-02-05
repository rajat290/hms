import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useContext } from 'react'
import { AppContext } from '../context/AppContext'

const PasswordReset = () => {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [step, setStep] = useState(1) // 1: request reset, 2: enter token and new password
  const { backendUrl } = useContext(AppContext)

  const requestReset = async (event) => {
    event.preventDefault()
    try {
      const { data } = await axios.post(backendUrl + '/api/user/forgot-password', { email })
      if (data.success) {
        toast.success('Reset link sent to your email')
        setStep(2)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Failed to send reset email')
    }
  }

  const resetPassword = async (event) => {
    event.preventDefault()
    try {
      const { data } = await axios.post(backendUrl + '/api/user/reset-password', { token, newPassword })
      if (data.success) {
        toast.success('Password reset successfully!')
        // Redirect to login
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Password reset failed')
    }
  }

  return (
    <form onSubmit={step === 1 ? requestReset : resetPassword} className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
        <p className='text-2xl font-semibold'>Reset Password</p>
        {step === 1 ? (
          <>
            <p>Enter your email to receive reset instructions</p>
            <div className='w-full'>
              <p>Email</p>
              <input onChange={(e) => setEmail(e.target.value)} value={email} className='border border-[#DADADA] rounded w-full p-2 mt-1' type="email" required />
            </div>
            <button className='bg-primary text-white w-full py-2 my-2 rounded-md text-base'>Send Reset Email</button>
          </>
        ) : (
          <>
            <p>Enter the reset token and new password</p>
            <div className='w-full'>
              <p>Reset Token</p>
              <input onChange={(e) => setToken(e.target.value)} value={token} className='border border-[#DADADA] rounded w-full p-2 mt-1' type="text" required />
            </div>
            <div className='w-full'>
              <p>New Password</p>
              <input onChange={(e) => setNewPassword(e.target.value)} value={newPassword} className='border border-[#DADADA] rounded w-full p-2 mt-1' type="password" required />
            </div>
            <button className='bg-primary text-white w-full py-2 my-2 rounded-md text-base'>Reset Password</button>
          </>
        )}
      </div>
    </form>
  )
}

export default PasswordReset
