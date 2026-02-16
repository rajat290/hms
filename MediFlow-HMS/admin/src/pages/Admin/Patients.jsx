import React, { useEffect, useContext, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'

const Patients = () => {

    const { aToken, backendUrl } = useContext(AdminContext)
    const navigate = useNavigate()
    const [patients, setPatients] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState("")
    const [paymentFilter, setPaymentFilter] = useState("")

    const getAllPatients = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/all-patients', { headers: { aToken } })
            if (data.success) {
                setPatients(data.patients)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (aToken) {
            getAllPatients()
        }
    }, [aToken])

    // Filter and sort logic
    const filteredPatients = patients
        .filter(pat =>
            (pat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             pat.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (paymentFilter === "" || (paymentFilter === "paid" ? pat.pendingDues === 0 : pat.pendingDues > 0))
        )
        .sort((a, b) => {
            if (sortBy === "name") return a.name.localeCompare(b.name)
            if (sortBy === "email") return a.email.localeCompare(b.email)
            if (sortBy === "paid") return a.totalPaid - b.totalPaid
            if (sortBy === "pending") return a.pendingDues - b.pendingDues
            return 0
        })

    return (
        <div className='m-5 max-h-[90vh] overflow-y-scroll'>
            <h1 className='text-lg font-medium'>All Patients</h1>
            <div className='flex flex-col sm:flex-row gap-4 my-4'>
                <input
                    type='text'
                    placeholder='Search by name or email...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='border px-3 py-2 rounded w-full sm:w-64'
                />
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className='border px-3 py-2 rounded w-full sm:w-auto'>
                    <option value=''>Sort By</option>
                    <option value='name'>Name</option>
                    <option value='email'>Email</option>
                    <option value='paid'>Total Paid</option>
                    <option value='pending'>Pending Dues</option>
                </select>
                <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className='border px-3 py-2 rounded w-full sm:w-auto'>
                    <option value=''>All Payment Status</option>
                    <option value='paid'>Paid</option>
                    <option value='pending'>Pending</option>
                </select>
            </div>
            {loading ? (
                <p className='text-gray-500 mt-4 text-center'>Loading patients...</p>
            ) : filteredPatients.length === 0 ? (
                <p className='text-gray-500 mt-4 text-center'>No patients found.</p>
            ) : (
                <>
                    <div className='w-full grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] gap-4 py-3 px-6 border-b hidden sm:grid'>
                        <p>#</p>
                        <p>Name</p>
                        <p>Email</p>
                        <p>Total Paid</p>
                        <p>Pending Dues</p>
                        <p>Actions</p>
                    </div>
                    {filteredPatients.map((item, index) => (
                        <div className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[auto_1fr_1fr_1fr_1fr_auto] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
                            <p className='max-sm:hidden'>{index + 1}</p>
                            <div className='flex items-center gap-2'>
                                <img className='w-8 rounded-full' src={item.image} alt='' />
                                <p>{item.name}</p>
                            </div>
                            <p className='max-sm:hidden'>{item.email}</p>
                            <p>{item.currency}{item.totalPaid}</p>
                            <p className='text-red-500 font-medium'>{item.currency}{item.pendingDues}</p>
                            <button
                                onClick={() => navigate(`/patient-details/${item._id}`)}
                                className='text-sm text-primary border border-primary px-3 py-1 rounded hover:bg-primary hover:text-white transition-all'
                            >
                                View Details
                            </button>
                        </div>
                    ))}
                </>
            )}
        </div>
    )
}

export default Patients
