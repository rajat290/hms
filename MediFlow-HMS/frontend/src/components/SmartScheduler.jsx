import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useContext } from 'react'
import { AppContext } from '../context/AppContext'

const SmartScheduler = () => {
  const [doctorId, setDoctorId] = useState('')
  const [date, setDate] = useState('')
  const [suggestedTime, setSuggestedTime] = useState('')
  const { backendUrl } = useContext(AppContext)

  const getSuggestion = async () => {
    try {
      const { data } = await axios.post(backendUrl + '/api/ai/smart-schedule', { doctorId, date })
      if (data.success) {
        setSuggestedTime(data.suggestedTime)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Smart scheduling failed')
    }
  }

  return (
    <div className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
        <p className='text-2xl font-semibold'>AI Smart Scheduler</p>
        <p>Get optimal appointment time</p>
        <div className='w-full'>
          <p>Doctor ID</p>
          <input onChange={(e) => setDoctorId(e.target.value)} value={doctorId} className='border border-[#DADADA] rounded w-full p-2 mt-1' type="text" required />
        </div>
        <div className='w-full'>
          <p>Date</p>
          <input onChange={(e) => setDate(e.target.value)} value={date} className='border border-[#DADADA] rounded w-full p-2 mt-1' type="date" required />
        </div>
        <button onClick={getSuggestion} className='bg-primary text-white w-full py-2 my-2 rounded-md text-base'>Get Suggestion</button>
        {suggestedTime && <p className='text-lg font-medium'>Suggested Time: {suggestedTime}</p>}
      </div>
    </div>
  )
}

export default SmartScheduler
