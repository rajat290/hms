import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
  return (
    <div className='md:mx-10'>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>

        <div>
          <img className='mb-5 w-40' src={assets.logo} alt="" />
          <p className='w-full md:w-2/3 text-gray-600 leading-6'>
            Mediflow is committed to excellence in healthcare. We bring together the best medical professionals to provide you with seamless appointment booking and top-tier medical care.
          </p>
        </div>

        <div>
          <p className='text-xl font-semibold mb-5 text-secondary'>COMPANY</p>
          <ul className='flex flex-col gap-2 text-gray-600'>
            <li className='hover:text-primary cursor-pointer transition-colors'>Home</li>
            <li className='hover:text-primary cursor-pointer transition-colors'>About us</li>
            <li className='hover:text-primary cursor-pointer transition-colors'>Delivery</li>
            <li className='hover:text-primary cursor-pointer transition-colors'>Privacy policy</li>
          </ul>
        </div>

        <div>
          <p className='text-xl font-semibold mb-5 text-secondary'>GET IN TOUCH</p>
          <ul className='flex flex-col gap-2 text-gray-600'>
            <li className='hover:text-primary cursor-pointer transition-colors'>+1-212-456-7890</li>
            <li className='hover:text-primary cursor-pointer transition-colors'>contact@mediflow.com</li>
          </ul>
        </div>

      </div>

      <div>
        <hr className='border-gray-200' />
        <p className='py-5 text-sm text-center text-gray-500'>Copyright 2024 @ Mediflow.com - All Right Reserved.</p>
      </div>
    </div>
  )
}

export default Footer
