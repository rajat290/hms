import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const Notifications = () => {
    const { backendUrl, token } = useContext(AppContext)
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchNotifications = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/user/notifications', { headers: { token } })
            if (data.success) {
                setNotifications(data.notifications)
            }
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    const markRead = async () => {
        try {
            await axios.post(backendUrl + '/api/user/mark-notifications-read', {}, { headers: { token } })
            fetchNotifications()
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        if (token) {
            fetchNotifications()
            // Mark as read when page is opened
            setTimeout(markRead, 3000)
        }
    }, [token])

    if (loading) return <div className='min-h-[60vh] flex items-center justify-center'><p>Loading notifications...</p></div>

    return (
        <div className='min-h-[60vh] mt-10'>
            <div className='flex justify-between items-center border-b pb-4 mb-6'>
                <h2 className='text-2xl font-medium text-gray-800'>Notifications</h2>
                <button onClick={markRead} className='text-sm text-primary hover:underline'>Mark all as read</button>
            </div>

            <div className='flex flex-col gap-4'>
                {notifications.length > 0 ? notifications.map((item, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${item.read ? 'bg-white border-gray-100' : 'bg-blue-50 border-blue-100'}`}>
                        <div className='flex justify-between items-start mb-1'>
                            <h3 className='font-semibold text-gray-800'>{item.title}</h3>
                            <p className='text-xs text-gray-400'>{new Date(item.date).toLocaleString()}</p>
                        </div>
                        <p className='text-sm text-gray-600'>{item.message}</p>
                        {!item.read && <span className='inline-block w-2 h-2 bg-primary rounded-full mt-2'></span>}
                    </div>
                )) : (
                    <div className='text-center py-20 text-gray-500'>
                        <p>No notifications yet.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Notifications
