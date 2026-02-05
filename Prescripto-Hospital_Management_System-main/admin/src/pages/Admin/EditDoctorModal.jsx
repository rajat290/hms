import React, { useState, useContext } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { AdminContext } from '../../context/AdminContext';

const EditDoctorModal = ({ doctor, onClose, onUpdated }) => {
  const [docImg, setDocImg] = useState(doctor.image || false);
  const [name, setName] = useState(doctor.name || '');
  const [email, setEmail] = useState(doctor.email || '');
  const [experience, setExperience] = useState(doctor.experience || '1 Year');
  const [fees, setFees] = useState(doctor.fees || '');
  const [about, setAbout] = useState(doctor.about || '');
  const [speciality, setSpeciality] = useState(doctor.speciality || 'General physician');
  const [degree, setDegree] = useState(doctor.degree || '');
  const [address1, setAddress1] = useState(doctor.address?.line1 || '');
  const [address2, setAddress2] = useState(doctor.address?.line2 || '');
  const [loading, setLoading] = useState(false);
  const { aToken, backendUrl } = useContext(AdminContext);

  const handleUpdate = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      if (docImg && typeof docImg !== 'string') {
        formData.append('image', docImg);
      }
      formData.append('name', name);
      formData.append('email', email);
      formData.append('experience', experience);
      formData.append('fees', Number(fees));
      formData.append('about', about);
      formData.append('speciality', speciality);
      formData.append('degree', degree);
      formData.append('address', JSON.stringify({ line1: address1, line2: address2 }));
      formData.append('docId', doctor._id);

      const { data } = await axios.put(`${backendUrl}/api/admin/update-doctor`, formData, { headers: { aToken } });
      if (data.success) {
        toast.success('Doctor updated successfully');
        onUpdated();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 transition-opacity duration-300'>
      <form onSubmit={handleUpdate} className='bg-white p-8 rounded shadow-lg w-full max-w-2xl relative transform transition-all duration-300 scale-100'>
        <button type='button' className='absolute top-2 right-2 text-gray-500' onClick={onClose}>✕</button>
        <h2 className='mb-4 text-lg font-medium'>Edit Doctor Profile</h2>
        <div className='flex items-center gap-4 mb-8 text-gray-500'>
          <label htmlFor='edit-doc-img'>
            <img className='w-16 bg-gray-100 rounded-full cursor-pointer' src={docImg ? (typeof docImg === 'string' ? docImg : URL.createObjectURL(docImg)) : ''} alt='' />
          </label>
          <input onChange={e => setDocImg(e.target.files[0])} type='file' id='edit-doc-img' hidden />
          <p>Update doctor picture</p>
        </div>
        <div className='flex flex-col lg:flex-row gap-10'>
          <div className='flex-1 flex flex-col gap-4'>
            <div className='flex flex-col gap-1'>
              <p>Name</p>
              <input onChange={e => setName(e.target.value)} value={name} className='border rounded px-3 py-2' type='text' required />
            </div>
            <div className='flex flex-col gap-1'>
              <p>Email</p>
              <input onChange={e => setEmail(e.target.value)} value={email} className='border rounded px-3 py-2' type='email' required />
            </div>
            <div className='flex flex-col gap-1'>
              <p>Experience</p>
              <select onChange={e => setExperience(e.target.value)} value={experience} className='border rounded px-2 py-2'>
                <option value='1 Year'>1 Year</option>
                <option value='2 Year'>2 Years</option>
                <option value='3 Year'>3 Years</option>
                <option value='4 Year'>4 Years</option>
                <option value='5 Year'>5 Years</option>
                <option value='6 Year'>6 Years</option>
                <option value='8 Year'>8 Years</option>
                <option value='9 Year'>9 Years</option>
                <option value='10 Year'>10 Years</option>
              </select>
            </div>
            <div className='flex flex-col gap-1'>
              <p>Fees</p>
              <input onChange={e => setFees(e.target.value)} value={fees} className='border rounded px-3 py-2' type='number' required />
            </div>
          </div>
          <div className='flex-1 flex flex-col gap-4'>
            <div className='flex flex-col gap-1'>
              <p>Speciality</p>
              <select onChange={e => setSpeciality(e.target.value)} value={speciality} className='border rounded px-2 py-2'>
                <option value='General physician'>General physician</option>
                <option value='Gynecologist'>Gynecologist</option>
                <option value='Dermatologist'>Dermatologist</option>
                <option value='Pediatricians'>Pediatricians</option>
                <option value='Neurologist'>Neurologist</option>
                <option value='Gastroenterologist'>Gastroenterologist</option>
              </select>
            </div>
            <div className='flex flex-col gap-1'>
              <p>Degree</p>
              <input onChange={e => setDegree(e.target.value)} value={degree} className='border rounded px-3 py-2' type='text' required />
            </div>
            <div className='flex flex-col gap-1'>
              <p>Address</p>
              <input onChange={e => setAddress1(e.target.value)} value={address1} className='border rounded px-3 py-2' type='text' required />
              <input onChange={e => setAddress2(e.target.value)} value={address2} className='border rounded px-3 py-2' type='text' required />
            </div>
          </div>
        </div>
        <div className='flex flex-col gap-1 mt-4'>
          <p>About</p>
          <textarea onChange={e => setAbout(e.target.value)} value={about} className='w-full px-4 pt-2 border rounded' rows={4} required></textarea>
        </div>
        <button type='submit' disabled={loading} className='bg-primary px-10 py-3 mt-6 text-white rounded-full'>
          {loading ? 'Updating...' : 'Update Doctor'}
        </button>
      </form>
    </div>
  );
};

export default EditDoctorModal;
