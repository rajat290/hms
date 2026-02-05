import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { useNavigate, useParams } from 'react-router-dom'

const Doctors = () => {

  const { speciality } = useParams()

  const [filterDoc, setFilterDoc] = useState([])
  const [showFilter, setShowFilter] = useState(false)
  const navigate = useNavigate();

  const { doctors, currencySymbol } = useContext(AppContext)

  const [search, setSearch] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [maxFees, setMaxFees] = useState(500) // Default max

  const applyFilter = () => {
    let filtered = doctors;

    if (speciality) {
      filtered = filtered.filter(doc => doc.speciality === speciality)
    }

    if (search) {
      filtered = filtered.filter(doc => doc.name.toLowerCase().includes(search.toLowerCase()))
    }

    if (filterGender) {
      filtered = filtered.filter(doc => doc.gender === filterGender)
    }

    filtered = filtered.filter(doc => doc.fees <= maxFees)

    setFilterDoc(filtered)
  }

  useEffect(() => {
    applyFilter()
  }, [doctors, speciality, search, filterGender, maxFees])

  return (
    <div>
      <p className='text-gray-600'>Browse through the doctors specialist.</p>
      <div className='flex flex-col sm:flex-row items-start gap-5 mt-5'>
        <button onClick={() => setShowFilter(!showFilter)} className={`py-1 px-3 border rounded text-sm  transition-all sm:hidden ${showFilter ? 'bg-primary text-white' : ''}`}>Filters</button>
        <div className={`flex-col gap-4 text-sm text-gray-600 ${showFilter ? 'flex' : 'hidden sm:flex'}`}>
          <div className='flex flex-col gap-2 mb-4'>
            <p className='font-medium text-gray-800'>Search</p>
            <input
              type="text"
              placeholder='Doctor name...'
              className='border border-gray-300 rounded p-2 outline-none focus:border-primary'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <p className='font-medium text-gray-800'>Speciality</p>
          <p onClick={() => speciality === 'General physician' ? navigate('/doctors') : navigate('/doctors/General physician')} className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'General physician' ? 'bg-[#E2E5FF] text-black ' : ''}`}>General physician</p>
          <p onClick={() => speciality === 'Gynecologist' ? navigate('/doctors') : navigate('/doctors/Gynecologist')} className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'Gynecologist' ? 'bg-[#E2E5FF] text-black ' : ''}`}>Gynecologist</p>
          <p onClick={() => speciality === 'Dermatologist' ? navigate('/doctors') : navigate('/doctors/Dermatologist')} className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'Dermatologist' ? 'bg-[#E2E5FF] text-black ' : ''}`}>Dermatologist</p>
          <p onClick={() => speciality === 'Pediatricians' ? navigate('/doctors') : navigate('/doctors/Pediatricians')} className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'Pediatricians' ? 'bg-[#E2E5FF] text-black ' : ''}`}>Pediatricians</p>
          <p onClick={() => speciality === 'Neurologist' ? navigate('/doctors') : navigate('/doctors/Neurologist')} className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'Neurologist' ? 'bg-[#E2E5FF] text-black ' : ''}`}>Neurologist</p>
          <p onClick={() => speciality === 'Gastroenterologist' ? navigate('/doctors') : navigate('/doctors/Gastroenterologist')} className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'Gastroenterologist' ? 'bg-[#E2E5FF] text-black ' : ''}`}>Gastroenterologist</p>

          <div className='flex flex-col gap-2 mt-4'>
            <p className='font-medium text-gray-800'>Gender</p>
            <select
              className='border border-gray-300 rounded p-2 outline-none focus:border-primary'
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div className='flex flex-col gap-2 mt-4'>
            <p className='font-medium text-gray-800'>Max Fees: {currencySymbol}{maxFees}</p>
            <input
              type="range"
              min="0"
              max="1000"
              step="10"
              className='w-full accent-primary'
              value={maxFees}
              onChange={(e) => setMaxFees(e.target.value)}
            />
          </div>

          <button
            onClick={() => { setSearch(''); setFilterGender(''); setMaxFees(500); navigate('/doctors') }}
            className='mt-4 text-xs text-primary underline'
          >
            Reset Filters
          </button>
        </div>
        <div className='w-full grid grid-cols-auto gap-4 gap-y-6'>
          {filterDoc.map((item, index) => (
            <div onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0) }} className='border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500' key={index}>
              <img className='bg-[#EAEFFF]' src={item.image} alt="" />
              <div className='p-4'>
                <div className={`flex items-center gap-2 text-sm text-center ${item.available ? 'text-green-500' : "text-gray-500"}`}>
                  <p className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-500' : "bg-gray-500"}`}></p><p>{item.available ? 'Available' : "Not Available"}</p>
                </div>
                <p className='text-[#262626] text-lg font-medium'>{item.name}</p>
                <p className='text-[#5C5C5C] text-sm'>{item.speciality}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Doctors