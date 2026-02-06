import React, { useContext } from 'react'
import { assets } from '../assets/assets'
import { DoctorContext } from '../context/DoctorContext'
import { AdminContext } from '../context/AdminContext'
import { StaffContext } from '../context/StaffContext'
import { useNavigate } from 'react-router-dom'

import { NotificationContext } from '../context/NotificationContext'
import { AppContext } from '../context/AppContext'

const Navbar = () => {

  const { dToken, setDToken } = useContext(DoctorContext)
  const { aToken, setAToken } = useContext(AdminContext)
  const { sToken, setSToken } = useContext(StaffContext)
  const { unreadCount, notifications, markAsRead } = useContext(NotificationContext)
  const [showNotifications, setShowNotifications] = React.useState(false)

  const { isEmergencyMode, setIsEmergencyMode, isDarkMode, setIsDarkMode } = useContext(AppContext)

  const navigate = useNavigate()

  const logout = () => {
    navigate('/')
    dToken && setDToken('')
    dToken && localStorage.removeItem('dToken')
    aToken && setAToken('')
    aToken && localStorage.removeItem('aToken')
    sToken && setSToken('')
    sToken && localStorage.removeItem('sToken')
  }

  return (
    <div className='flex justify-between items-center px-4 sm:px-10 py-3 border-b bg-white'>
      <div className='flex items-center gap-2 text-xs'>
        <img onClick={() => navigate('/')} className='w-36 sm:w-40 cursor-pointer' src={assets.admin_logo} alt="" />
        <p className='border px-2.5 py-0.5 rounded-full border-gray-500 text-gray-600'>{aToken ? 'Admin' : dToken ? 'Doctor' : 'Staff'}</p>
      </div>

      <div className='flex items-center gap-4'>
        {sToken && (
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className='p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all'
            title="Toggle Dark Mode"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        )}
        {sToken && (
          <button
            onClick={() => setIsEmergencyMode(!isEmergencyMode)}
            className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${isEmergencyMode ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600'}`}
          >
            {isEmergencyMode ? '🚨 EMERGENCY ACTIVE' : '⚠ NORMAL OPS'}
          </button>
        )}
        {sToken && (
          <div className='relative cursor-pointer' onClick={() => setShowNotifications(!showNotifications)}>
            <img className='w-7' src={assets.appointment_icon} alt="Notifications" />
            {unreadCount > 0 && (
              <span className='absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold'>
                {unreadCount}
              </span>
            )}

            {showNotifications && (
              <div className='absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden'>
                <div className='p-3 border-b bg-gray-50 flex justify-between items-center'>
                  <p className='font-bold text-gray-700'>Notifications</p>
                </div>
                <div className='max-h-96 overflow-y-auto'>
                  {notifications.length === 0 ? (
                    <p className='p-4 text-center text-gray-500 text-sm'>No notifications</p>
                  ) : notifications.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => markAsRead(item._id)}
                      className={`p-3 border-b hover:bg-gray-50 transition-colors ${!item.read ? 'bg-indigo-50/30' : ''}`}
                    >
                      <p className='text-sm font-bold text-gray-800'>{item.title}</p>
                      <p className='text-xs text-gray-600 mt-1'>{item.message}</p>
                      <p className='text-[10px] text-gray-400 mt-1'>{new Date(item.date).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <button onClick={() => logout()} className='bg-primary text-white text-sm px-10 py-2 rounded-full'>Logout</button>
      </div>
    </div>
  )
}

export default Navbar