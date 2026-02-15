import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const Navbar = () => {

  const navigate = useNavigate()

  const [showMenu, setShowMenu] = useState(false)
  const { token, setToken, userData } = useContext(AppContext)

  const logout = () => {
    localStorage.removeItem('token')
    setToken(false)
    navigate('/login')
  }

  return (
    <div className='sticky top-0 z-50 glass-effect flex items-center justify-between text-sm py-4 mb-5 px-4 sm:px-[10%] -mx-4 sm:-mx-[10%]'>
      <img onClick={() => { navigate('/'); window.scrollTo(0, 0); }} className='w-44 cursor-pointer hover:opacity-80 transition-opacity' src={assets.logo} alt="" />
      <ul className='md:flex items-start gap-5 font-medium hidden'>
        <NavLink to='/' >
          <li className='py-1'>HOME</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/doctors' >
          <li className='py-1'>ALL DOCTORS</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/about' >
          <li className='py-1'>ABOUT</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/contact' >
          <li className='py-1'>CONTACT</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
      </ul>

      <div className='flex items-center gap-4 '>
        {
          token && userData
            ? <div className='flex items-center gap-2 cursor-pointer group relative'>
              <img className='w-8 rounded-full' src={userData.image} alt="" />
              <img className='w-2.5' src={assets.dropdown_icon} alt="" />
              <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block'>
                <div className='min-w-48 bg-gray-50 rounded flex flex-col gap-4 p-4'>
                  <p onClick={() => navigate('/my-profile')} className='hover:text-black cursor-pointer'>My Profile</p>
                  <p onClick={() => navigate('/my-appointments')} className='hover:text-black cursor-pointer'>My Appointments</p>
                  <p onClick={() => navigate('/notifications')} className='hover:text-black cursor-pointer'>Notifications</p>
                  <p onClick={() => navigate('/my-billing')} className='hover:text-black cursor-pointer'>My Billing</p>
                  <p onClick={logout} className='hover:text-black cursor-pointer'>Logout</p>
                </div>
              </div>
            </div>
            : <button onClick={() => navigate('/login')} className='bg-primary text-white px-8 py-3 rounded-full font-light hidden md:block'>Create account</button>
        }
        <img onClick={() => setShowMenu(true)} className='w-6 md:hidden' src={assets.menu_icon} alt="" />

        {/* ---- Mobile Menu ---- */}
        {/* ---- Mobile Menu ---- */}
        <div className={`md:hidden fixed inset-0 z-[100] transition-all duration-500 ${showMenu ? 'visible' : 'invisible'}`}>
          {/* Backdrop Overlay */}
          <div
            className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${showMenu ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setShowMenu(false)}
          ></div>

          {/* Menu Slider */}
          <div className={`absolute right-0 top-0 bottom-0 w-[80%] max-w-sm bg-white shadow-2xl transition-transform duration-500 ease-in-out flex flex-col ${showMenu ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className='flex items-center justify-between px-6 py-6 border-b border-gray-50'>
              <img onClick={() => { navigate('/'); setShowMenu(false); window.scrollTo(0, 0); }} src={assets.logo} className='w-36 cursor-pointer' alt="" />
              <img onClick={() => setShowMenu(false)} src={assets.cross_icon} className='w-7 cursor-pointer hover:rotate-90 transition-transform duration-300' alt="" />
            </div>

            <ul className='flex flex-col gap-1 mt-6 px-4'>
              <NavLink onClick={() => setShowMenu(false)} to='/' className='p-1'>
                <p className='px-5 py-3 rounded-xl font-semibold text-gray-700 hover:bg-blue-50 hover:text-primary transition-all'>HOME</p>
              </NavLink>
              <NavLink onClick={() => setShowMenu(false)} to='/doctors' className='p-1'>
                <p className='px-5 py-3 rounded-xl font-semibold text-gray-700 hover:bg-blue-50 hover:text-primary transition-all'>ALL DOCTORS</p>
              </NavLink>
              <NavLink onClick={() => setShowMenu(false)} to='/about' className='p-1'>
                <p className='px-5 py-3 rounded-xl font-semibold text-gray-700 hover:bg-blue-50 hover:text-primary transition-all'>ABOUT</p>
              </NavLink>
              <NavLink onClick={() => setShowMenu(false)} to='/contact' className='p-1'>
                <p className='px-5 py-3 rounded-xl font-semibold text-gray-700 hover:bg-blue-50 hover:text-primary transition-all'>CONTACT</p>
              </NavLink>

              <div className='my-4 px-5'>
                <hr className='border-gray-100' />
              </div>

              {token && userData ? (
                <>
                  <NavLink onClick={() => setShowMenu(false)} to='/my-profile' className='p-1'>
                    <p className='px-5 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-all'>My Profile</p>
                  </NavLink>
                  <NavLink onClick={() => setShowMenu(false)} to='/my-appointments' className='p-1'>
                    <p className='px-5 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-all'>My Appointments</p>
                  </NavLink>
                  <NavLink onClick={() => setShowMenu(false)} to='/notifications' className='p-1'>
                    <p className='px-5 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-all'>Notifications</p>
                  </NavLink>
                  <p onClick={() => { logout(); setShowMenu(false); }} className='px-6 py-3 font-bold text-red-500 cursor-pointer hover:bg-red-50 rounded-xl transition-all mt-4'>Logout</p>
                </>
              ) : (
                <div className='px-5 mt-4'>
                  <button onClick={() => { navigate('/login'); setShowMenu(false); }} className='w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-all'>
                    Create Account
                  </button>
                </div>
              )}
            </ul>

            <div className='mt-auto p-8 text-center'>
              <p className='text-xs text-gray-400'>© 2024 Mediflow Hospital</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar