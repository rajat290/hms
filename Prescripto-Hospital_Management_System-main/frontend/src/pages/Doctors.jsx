import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { useNavigate, useParams } from 'react-router-dom'

const Doctors = () => {

  const { speciality } = useParams()

  const [filterDoc, setFilterDoc] = useState([])
  const [showFilters, setShowFilters] = useState(false)
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
      <p className='text-gray-600 mb-6'>Browse through the specialists by category.</p>
      <div className='flex flex-col sm:flex-row items-start gap-8 mt-5'>
        <button className={`py-2 px-4 border rounded text-sm transition-all sm:hidden ${showFilters ? 'bg-primary text-white' : ''}`} onClick={() => setShowFilters(prev => !prev)}>Filters</button>
        <div className={`flex-col gap-3 text-sm text-gray-600 ${showFilters ? 'flex' : 'hidden sm:flex'} min-w-[200px]`}>
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
          {['General physician', 'Gynecologist', 'Dermatologist', 'Pediatricians', 'Neurologist', 'Gastroenterologist'].map((spec) => (
            <p
              key={spec}
              onClick={() => speciality === spec ? navigate('/doctors') : navigate(`/doctors/${spec}`)}
              className={`pl-4 py-2.5 pr-16 border border-gray-200 rounded-xl cursor-pointer transition-all hover:bg-blue-50 hover:border-primary ${speciality === spec ? "bg-blue-50 border-primary text-black font-semibold" : ""}`}
            >
              {spec}
            </p>
          ))}

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
            <div onClick={() => { navigate(`/appointment/${item._id}`); window.scrollTo(0, 0); }} className='border border-gray-100 rounded-3xl overflow-hidden cursor-pointer bg-white card-hover group shadow-sm'>
              <div className='relative overflow-hidden'>
                <img className='bg-blue-50 group-hover:scale-105 transition-transform duration-700' src={item.image} alt="" />
                <div className='absolute top-3 right-3 glass-effect py-1 px-3 rounded-full text-[10px] font-bold text-primary uppercase'>
                  {item.experience || '10+ Yrs Exp'}
                </div>
              </div>
              <div className='p-6'>
                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase ${item.available ? 'text-green-500' : "text-gray-400"} mb-3`}>
                  <p className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : "bg-gray-300"} ${item.available ? 'animate-pulse' : ''}`}></p>
                  <p>{item.available ? 'Accepting Patients' : "Fully Booked"}</p>
                </div>
                <p className='text-secondary text-xl font-bold group-hover:text-primary transition-colors'>{item.name}</p>
                <p className='text-gray-500 text-sm mb-1'>{item.speciality}</p>
                <p className='text-[10px] text-gray-400 mb-4 font-medium italic'>Speaks: {item.languages || 'Hindi, English, Punjabi'}</p>

                <button className='w-full py-3 bg-gray-50 text-primary text-xs font-bold rounded-xl group-hover:bg-primary group-hover:text-white group-hover:shadow-lg transition-all'>
                  Book Consultation
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Doctors