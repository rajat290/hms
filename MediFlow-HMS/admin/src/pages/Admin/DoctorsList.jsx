import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import EditDoctorModal from "./EditDoctorModal"

const DoctorsList = () => {
  const { doctors, changeAvailability , aToken , getAllDoctors } = useContext(AdminContext)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("")
  const [specialityFilter, setSpecialityFilter] = useState("")
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editDoctorData, setEditDoctorData] = useState(null)
  
  useEffect(() => {
    if (aToken) {
        getAllDoctors()
    }
  }, [aToken])

  // Filter and sort logic
  const filteredDoctors = doctors
    .filter(doc =>
      (doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       doc.speciality.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (specialityFilter === "" || doc.speciality === specialityFilter)
    )
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "speciality") return a.speciality.localeCompare(b.speciality)
      return 0
    })

  // Get unique specialities for filter
  const specialities = Array.from(new Set(doctors.map(doc => doc.speciality)))

  // Move these handlers inside the component so they have access to state
  const handleEditDoctor = (doctor) => {
    setEditDoctorData(doctor)
    setEditModalOpen(true)
  }

  const handleDeleteDoctor = async (doctorId) => {
    if(window.confirm('Are you sure you want to delete this doctor?')){
      try {
        const { data } = await axios.delete(
          `${process.env.REACT_APP_BACKEND_URL || doctors[0]?.backendUrl || ''}/api/admin/delete-doctor/${doctorId}`,
          { headers: { aToken } }
        )
        if(data.success){
          toast.success('Doctor deleted successfully')
          getAllDoctors()
        } else {
          toast.error(data.message)
        }
      } catch (error) {
        toast.error(error.message)
      }
    }
  }

  return (
    <div className='m-5 max-h-[90vh] overflow-y-scroll'>
      <h1 className='text-lg font-medium'>All Doctors</h1>
      <div className='flex flex-col sm:flex-row gap-4 my-4'>
        <input
          type='text'
          placeholder='Search by name or speciality...'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className='border px-3 py-2 rounded w-full sm:w-64'
        />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className='border px-3 py-2 rounded w-full sm:w-auto'>
          <option value=''>Sort By</option>
          <option value='name'>Name</option>
          <option value='speciality'>Speciality</option>
        </select>
        <select value={specialityFilter} onChange={e => setSpecialityFilter(e.target.value)} className='border px-3 py-2 rounded w-full sm:w-auto'>
          <option value=''>All Specialities</option>
          {specialities.map((spec, idx) => (
            <option key={idx} value={spec}>{spec}</option>
          ))}
        </select>
      </div>
      <div className='w-full flex flex-wrap gap-4 pt-5 gap-y-6'>
        {filteredDoctors.map((item, index) => (
          <div className='border border-[#C9D8FF] rounded-xl max-w-56 overflow-hidden cursor-pointer group' key={index}>
            <img className='bg-[#EAEFFF] group-hover:bg-primary transition-all duration-500' src={item.image} alt='' />
            <div className='p-4'>
              <p className='text-[#262626] text-lg font-medium'>{item.name}</p>
              <p className='text-[#5C5C5C] text-sm'>{item.speciality}</p>
              <div className='mt-2 flex items-center gap-1 text-sm'>
                <input onChange={()=>changeAvailability(item._id)} type='checkbox' checked={item.available} />
                <p>Available</p>
              </div>
              <div className='mt-4 flex gap-2'>
                <button className='bg-blue-500 text-white px-3 py-1 rounded text-xs' onClick={()=>handleEditDoctor(item)}>Edit</button>
                <button className='bg-red-500 text-white px-3 py-1 rounded text-xs' onClick={()=>handleDeleteDoctor(item._id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {editModalOpen && editDoctorData && (
        <EditDoctorModal
          doctor={editDoctorData}
          onClose={() => setEditModalOpen(false)}
          onUpdated={() => {
            setEditModalOpen(false);
            getAllDoctors();
          }}
        />
      )}
    </div>
  )
}

export default DoctorsList