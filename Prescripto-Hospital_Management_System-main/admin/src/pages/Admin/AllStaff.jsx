import React, { useContext, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'

const AllStaff = () => {

    const { staff, getAllStaff, aToken } = useContext(AdminContext)

    useEffect(() => {
        if (aToken) {
            getAllStaff()
        }
    }, [aToken])

    return (
        <div className='m-5 max-h-[90vh] overflow-y-scroll'>
            <h1 className='text-lg font-medium'>All Staff</h1>
            <div className='w-full flex flex-wrap gap-4 pt-5 gap-y-6'>
                {staff.map((item, index) => (
                    <div className='border border-indigo-200 rounded-xl max-w-56 overflow-hidden cursor-pointer group' key={index}>
                        <img className='bg-indigo-50 group-hover:bg-primary transition-all duration-500' src={item.image} alt="" />
                        <div className='p-4'>
                            <p className='text-neutral-800 text-lg font-medium'>{item.name}</p>
                            <p className='text-zinc-600 text-sm'>{item.email}</p>
                            <div className='mt-2 flex items-center gap-1 text-sm'>
                                <p className='text-neutral-800 font-medium'>Phone:</p>
                                <p className='text-zinc-600'>{item.phone}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default AllStaff
