import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../context/DoctorContext'
import { AdminContext } from '../context/AdminContext'
import { StaffContext } from '../context/StaffContext'
import { toast } from 'react-toastify'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ForgotPassword from './ForgotPassword'
import ResetPassword from './ResetPassword'

const Login = () => {

  const [view, setView] = useState('login') // 'login', 'forgot', 'reset'
  const [state, setState] = useState('Admin')
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      setView('reset')
    }

    const role = searchParams.get('role')
    if (role) {
      const roleState = role.charAt(0).toUpperCase() + role.slice(1)
      if (['Admin', 'Doctor', 'Staff'].includes(roleState)) {
        setState(roleState)
      }
    }
  }, [searchParams])

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({ email: '', password: '' })

  const backendUrl = import.meta.env.VITE_BACKEND_URL

  const { setDToken } = useContext(DoctorContext)
  const { setAToken } = useContext(AdminContext)
  const { setSToken } = useContext(StaffContext)

  const navigate = useNavigate()

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (value && !validateEmail(value)) {
      setErrors(prev => ({ ...prev, email: 'Invalid email address' }));
    } else {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (value.length > 0 && value.length < 4) {
      setErrors(prev => ({ ...prev, password: 'Minimum 4 characters required' }));
    } else {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true)

    try {
      if (state === 'Admin') {
        const { data } = await axios.post(backendUrl + '/api/admin/login', { email, password })
        if (data.success) {
          setAToken(data.token)
          localStorage.setItem('aToken', data.token)
        } else {
          toast.error(data.message)
        }
      } else if (state === 'Doctor') {
        const { data } = await axios.post(backendUrl + '/api/doctor/login', { email, password })
        if (data.success) {
          setDToken(data.token)
          localStorage.setItem('dToken', data.token)
        } else {
          toast.error(data.message)
        }
      } else {
        const { data } = await axios.post(backendUrl + '/api/staff/login', { email, password })
        if (data.success) {
          setSToken(data.token)
          localStorage.setItem('sToken', data.token)
          navigate('/staff-dashboard')
        } else {
          toast.error(data.message)
        }
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (view === 'forgot') return <ForgotPassword setView={setView} />
  if (view === 'reset') return <ResetPassword setView={setView} />

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
        <p className='text-2xl font-semibold m-auto'><span className='text-primary'>{state}</span> Login</p>
        <div className='w-full '>
          <p>Email</p>
          <input
            onChange={handleEmailChange}
            value={email}
            className={`border rounded w-full p-2 mt-1 outline-none transition-all ${errors.email ? 'border-red-400 focus:border-red-500' : 'border-[#DADADA]'}`}
            type="email"
            required
            aria-label="Email Address"
          />
          {errors.email && <p className='text-[10px] text-red-500 mt-1'>{errors.email}</p>}
        </div>
        <div className='w-full '>
          <p>Password</p>
          <div className='relative w-full'>
            <input
              onChange={handlePasswordChange}
              value={password}
              className={`border rounded w-full p-2 mt-1 pr-10 outline-none transition-all ${errors.password ? 'border-red-400 focus:border-red-500' : 'border-[#DADADA]'}`}
              type={showPassword ? "text" : "password"}
              required
              aria-label="Password"
            />
            <div
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 cursor-pointer text-gray-400 hover:text-primary transition-colors'
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
          {errors.password && <p className='text-[10px] text-red-500 mt-1'>{errors.password}</p>}
        </div>
        <button disabled={loading} className='bg-primary text-white w-full py-2 rounded-md text-base flex items-center justify-center gap-2'>
          {loading && <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>}
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {
          state === 'Admin'
            ? <>
              <p>Doctor Login? <span onClick={() => setState('Doctor')} className='text-primary underline cursor-pointer'>Click here</span> <br /> Staff Login? <span onClick={() => setState('Staff')} className='text-primary underline cursor-pointer'>Click here</span></p>
            </>
            : state === 'Doctor'
              ? <>
                <p>Admin Login? <span onClick={() => setState('Admin')} className='text-primary underline cursor-pointer'>Click here</span> <br /> Staff Login? <span onClick={() => setState('Staff')} className='text-primary underline cursor-pointer'>Click here</span></p>
                <p onClick={() => setView('forgot')} className='text-primary underline cursor-pointer mt-1'>Forgot Password?</p>
              </>
              : <>
                <p>Admin Login? <span onClick={() => setState('Admin')} className='text-primary underline cursor-pointer'>Click here</span> <br /> Doctor Login? <span onClick={() => setState('Doctor')} className='text-primary underline cursor-pointer'>Click here</span></p>
                <p onClick={() => setView('forgot')} className='text-primary underline cursor-pointer mt-1'>Forgot Password?</p>
              </>
        }
      </div>
    </form>
  )
}

export default Login