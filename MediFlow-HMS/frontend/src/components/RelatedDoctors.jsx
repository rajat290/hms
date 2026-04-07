import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import DoctorCard from './ui/DoctorCard';
import SectionHeading from './ui/SectionHeading';

const RelatedDoctors = ({ speciality, docId }) => {
  const { doctors, currencySymbol } = useContext(AppContext);
  const [relatedDoctors, setRelatedDoctors] = useState([]);

  useEffect(() => {
    if (doctors.length > 0 && speciality) {
      setRelatedDoctors(doctors.filter((doctor) => doctor.speciality === speciality && doctor._id !== docId).slice(0, 3));
    }
  }, [docId, doctors, speciality]);

  if (!relatedDoctors.length) {
    return null;
  }

  return (
    <section className="section-space">
      <div className="space-y-6">
        <SectionHeading
          eyebrow="You may also like"
          title="More specialists in the same area of care."
          description="Keeping related discovery nearby makes the booking flow feel smarter and less linear."
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {relatedDoctors.map((doctor) => (
            <DoctorCard key={doctor._id} doctor={doctor} currencySymbol={currencySymbol} compact />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RelatedDoctors;
