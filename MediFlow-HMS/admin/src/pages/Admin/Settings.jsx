import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const Settings = () => {

    const { aToken, backendUrl } = useContext(AdminContext)
    const [cancellationWindow, setCancellationWindow] = useState(2)

    const getSettings = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/get-settings', { headers: { aToken } })
            if (data.success) {
                setCancellationWindow(data.settings.cancellationWindow)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const updateSettings = async () => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/update-settings', { cancellationWindow }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => {
        if (aToken) {
            getSettings()
        }
    }, [aToken])

    return (
        <div className='m-5'>
            <p className='mb-3 text-lg font-medium'>System Settings</p>
            <div className='bg-white px-8 py-8 border rounded w-full max-w-4xl'>
                <div className='flex flex-col gap-4 mb-8'>
                    <p className='text-xl font-medium'>Cancellation Policy</p>
                    <div className='flex flex-col gap-2'>
                        <label className='text-gray-600'>Cancellation Window (Hours)</label>
                        <p className='text-sm text-gray-500'>Users cannot cancel appointments within this time frame before the appointment.</p>
                        <input
                            type="number"
                            className='border rounded px-3 py-2 w-full max-w-xs'
                            value={cancellationWindow}
                            onChange={(e) => setCancellationWindow(Number(e.target.value))}
                        />
                    </div>
                    <button onClick={updateSettings} className='bg-primary text-white px-4 py-2 rounded max-w-xs mt-2'>Update Settings</button>
                </div>
            </div>
        </div>
    )
}

export default Settings
