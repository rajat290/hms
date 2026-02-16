import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const DoctorAvailability = () => {
    const { dToken, backendUrl, docId } = useContext(DoctorContext)
    const [availability, setAvailability] = useState({
        enabled: true,
        timezone: 'Asia/Kolkata',
        schedule: {
            monday: [{ start: '09:00', end: '17:00' }],
            tuesday: [{ start: '09:00', end: '17:00' }],
            wednesday: [{ start: '09:00', end: '17:00' }],
            thursday: [{ start: '09:00', end: '17:00' }],
            friday: [{ start: '09:00', end: '17:00' }],
            saturday: [],
            sunday: []
        },
        slotDuration: 30,
        customDates: {},
        blockedDates: []
    })

    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const daysDisplay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    const getAvailability = async () => {
        try {
            const { data } = await axios.post(backendUrl + '/api/doctor/get-availability', { docId }, { headers: { dToken } })
            if (data.success && data.availability) {
                setAvailability(data.availability)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const updateAvailability = async () => {
        try {
            const { data } = await axios.post(backendUrl + '/api/doctor/update-availability', { docId, availability }, { headers: { dToken } })
            if (data.success) {
                toast.success(data.message)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const handleScheduleChange = (day, index, field, value) => {
        const newSchedule = { ...availability.schedule }
        if (newSchedule[day][index]) {
            newSchedule[day][index][field] = value
        }
        setAvailability({ ...availability, schedule: newSchedule })
    }

    const addTimeSlot = (day) => {
        const newSchedule = { ...availability.schedule }
        newSchedule[day].push({ start: '09:00', end: '17:00' })
        setAvailability({ ...availability, schedule: newSchedule })
    }

    const removeTimeSlot = (day, index) => {
        const newSchedule = { ...availability.schedule }
        newSchedule[day].splice(index, 1)
        setAvailability({ ...availability, schedule: newSchedule })
    }

    const toggleDayOff = (day) => {
        const newSchedule = { ...availability.schedule }
        if (newSchedule[day].length === 0) {
            newSchedule[day] = [{ start: '09:00', end: '17:00' }]
        } else {
            newSchedule[day] = []
        }
        setAvailability({ ...availability, schedule: newSchedule })
    }

    useEffect(() => {
        if (dToken && docId) {
            getAvailability()
        }
    }, [dToken, docId])

    return (
        <div className='m-5 max-w-5xl'>
            <p className='mb-3 text-lg font-medium'>Manage Availability</p>

            <div className='bg-white px-8 py-8 border rounded'>
                {/* Slot Duration */}
                <div className='mb-8'>
                    <p className='text-xl font-medium mb-4'>Slot Duration</p>
                    <div className='flex gap-4 items-center'>
                        <label>Duration (minutes):</label>
                        <select
                            className='border rounded px-3 py-2'
                            value={availability.slotDuration}
                            onChange={(e) => setAvailability({ ...availability, slotDuration: Number(e.target.value) })}
                        >
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={60}>60 minutes</option>
                        </select>
                    </div>
                </div>

                {/* Weekly Schedule */}
                <div className='mb-8'>
                    <p className='text-xl font-medium mb-4'>Weekly Schedule</p>
                    {daysOfWeek.map((day, idx) => (
                        <div key={day} className='mb-4 pb-4 border-b'>
                            <div className='flex items-center justify-between mb-2'>
                                <div className='flex items-center gap-3'>
                                    <input
                                        type="checkbox"
                                        checked={availability.schedule[day].length > 0}
                                        onChange={() => toggleDayOff(day)}
                                        className='w-4 h-4'
                                    />
                                    <p className='font-medium text-gray-700 w-28'>{daysDisplay[idx]}</p>
                                </div>
                                {availability.schedule[day].length > 0 && (
                                    <button
                                        onClick={() => addTimeSlot(day)}
                                        className='text-sm text-primary border border-primary px-3 py-1 rounded'
                                    >
                                        + Add Time Range
                                    </button>
                                )}
                            </div>

                            {availability.schedule[day].length > 0 && (
                                <div className='ml-10 space-y-2'>
                                    {availability.schedule[day].map((slot, slotIdx) => (
                                        <div key={slotIdx} className='flex items-center gap-3'>
                                            <input
                                                type="time"
                                                value={slot.start}
                                                onChange={(e) => handleScheduleChange(day, slotIdx, 'start', e.target.value)}
                                                className='border rounded px-3 py-2'
                                            />
                                            <span>to</span>
                                            <input
                                                type="time"
                                                value={slot.end}
                                                onChange={(e) => handleScheduleChange(day, slotIdx, 'end', e.target.value)}
                                                className='border rounded px-3 py-2'
                                            />
                                            {availability.schedule[day].length > 1 && (
                                                <button
                                                    onClick={() => removeTimeSlot(day, slotIdx)}
                                                    className='text-red-500 text-sm'
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Save Button */}
                <button
                    onClick={updateAvailability}
                    className='bg-primary text-white px-8 py-3 rounded mt-4'
                >
                    Save Availability
                </button>
            </div>
        </div>
    )
}

export default DoctorAvailability
