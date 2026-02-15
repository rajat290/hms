import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'

const Login = () => {

  const [state, setState] = useState('Sign Up')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [is2fa, setIs2fa] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [userId, setUserId] = useState('')
  const [errors, setErrors] = useState({ email: '', password: '' })

  const navigate = useNavigate()
  const { backendUrl, token, setToken } = useContext(AppContext)

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
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (state === 'Sign Up' && value.length > 0 && value.length < 8) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters long' }));
    } else {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true)

    try {
      if (state === 'Sign Up') {

        const { data } = await axios.post(backendUrl + '/api/user/register', { name, email, password })

        if (data.success) {
          toast.success('Registration successful! Please check your email to verify your account.')
          setState('Login') // Switch to login after signup
        } else {
          toast.error(data.message)
        }

      } else {

        const { data } = await axios.post(backendUrl + '/api/user/login', { email, password })

        if (data.success) {
          if (data.twoFactorRequired) {
            setIs2fa(true)
            setUserId(data.userId)
            toast.info(data.message)
          } else {
            localStorage.setItem('token', data.token)
            setToken(data.token)
          }
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

  const onVerify2fa = async (e) => {
    e.preventDefault();
    setLoading(true)
    try {
      const { data } = await axios.post(backendUrl + '/api/user/verify-2fa', { userId, code: twoFactorCode })
      if (data.success) {
        localStorage.setItem('token', data.token)
        setToken(data.token)
        toast.success("Login Successful")
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      navigate('/')
    }
  }, [token])

  return (
    <div className='min-h-[80vh] flex items-center'>
      {is2fa ? (
        <form onSubmit={onVerify2fa} className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
          <p className='text-2xl font-semibold'>Two-Factor Authentication</p>
          <p>Please enter the 6-digit code sent to your email.</p>
          <div className='w-full'>
            <p>Verification Code</p>
            <input onChange={(e) => setTwoFactorCode(e.target.value)} value={twoFactorCode} className='border border-[#DADADA] rounded w-full p-2 mt-1 text-center text-xl tracking-widest' type="text" maxLength="6" required />
          </div>
          <button disabled={loading} className='bg-primary text-white w-full py-2 my-2 rounded-md text-base flex items-center justify-center gap-2'>
            {loading && <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>}
            {loading ? 'Verifying...' : 'Verify & Login'}
          </button>
          <p onClick={() => setIs2fa(false)} className='text-primary underline cursor-pointer w-full text-center'>Back to Login</p>
        </form>
      ) : (
        <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center justify-center p-4'>
          <div className='flex flex-col gap-6 m-auto items-start p-10 min-w-96 glass-effect border border-gray-100 rounded-3xl text-gray-600 shadow-2xl relative overflow-hidden'>

            {/* Background accent */}
            <div className='absolute top-0 left-0 w-2 h-full bg-primary'></div>

            <div className='w-full'>
              <p className='text-3xl font-bold text-secondary'>{state === 'Sign Up' ? 'Create Account' : 'Login'}</p>
              <p className='text-sm text-gray-500 mt-1'>Please {state === 'Sign Up' ? 'sign up' : 'login'} to book your appointment</p>
            </div>

            {state === 'Sign Up' && (
              <div className='w-full'>
                <p className='text-sm font-medium mb-1'>Full Name</p>
                <input className='border border-gray-200 rounded-xl w-full p-3 mt-1 bg-gray-50/50 focus:bg-white focus:border-primary outline-none transition-all' type="text" onChange={(e) => setName(e.target.value)} value={name} required aria-label="Full Name" />
              </div>
            )}

            <div className='w-full'>
              <p className='text-sm font-medium mb-1'>Email</p>
              <input
                className={`border rounded-xl w-full p-3 mt-1 bg-gray-50/50 focus:bg-white focus:border-primary outline-none transition-all ${errors.email ? 'border-red-400 focus:border-red-500' : 'border-gray-200'}`}
                type="email"
                onChange={handleEmailChange}
                value={email}
                required
                aria-label="Email Address"
              />
              {errors.email && <p className='text-[10px] text-red-500 mt-1 ml-1 animate-fadeIn'>{errors.email}</p>}
            </div>

            <div className='w-full'>
              <p className='text-sm font-medium mb-1'>Password</p>
              <div className='relative w-full'>
                <input
                  className={`border rounded-xl w-full p-3 mt-1 bg-gray-50/50 focus:bg-white focus:border-primary outline-none transition-all pr-12 ${errors.password ? 'border-red-400 focus:border-red-500' : 'border-gray-200'}`}
                  type={showPassword ? "text" : "password"}
                  onChange={handlePasswordChange}
                  value={password}
                  required
                  aria-label="Password"
                />
                <div
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-4 top-1/2 -translate-y-1/2 mt-0.5 cursor-pointer text-gray-400 hover:text-primary transition-colors'
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
              {errors.password && <p className='text-[10px] text-red-500 mt-1 ml-1 animate-fadeIn'>{errors.password}</p>}
            </div>

            <button disabled={loading} type='submit' className='bg-gradient-primary text-white w-full py-4 rounded-xl font-bold text-base hover:shadow-lg hover:scale-[1.02] transition-all duration-300 mt-2 flex items-center justify-center gap-3'>
              {loading && <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>}
              {loading ? (state === 'Sign Up' ? 'Creating Account...' : 'Logging in...') : (state === 'Sign Up' ? 'Create Account' : 'Login')}
            </button>

            <div className='w-full text-center flex flex-col gap-2'>
              {state === 'Sign Up'
                ? <p className='text-sm'>Already have an account? <span onClick={() => setState('Login')} className='text-primary underline cursor-pointer font-semibold'>Login here</span></p>
                : <>
                  <p className='text-sm'>Don't have an account? <span onClick={() => setState('Sign Up')} className='text-primary underline cursor-pointer font-semibold'>Click here</span></p>
                  <p onClick={() => navigate('/reset-password')} className='text-xs text-primary underline cursor-pointer hover:text-secondary transition-colors'>Forgot Password?</p>
                </>
              }
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

export default Login