import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import DoctorCard from './ui/DoctorCard';
import SectionHeading from './ui/SectionHeading';
import LoadingState from './ui/LoadingState';

const TopDoctors = () => {
  const { doctors, currencySymbol, doctorsLoading } = useContext(AppContext);

  if (doctorsLoading) {
    return <LoadingState title="Loading doctors" message="Pulling the latest available specialists for you." />;
  }

  return (
    <section className="section-space">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Trusted specialists"
            title="Doctors patients come back to."
            description="A focused shortlist with clearer information density, stronger imagery, and better action cues than the previous catalog view."
          />
          <Link to="/doctors" className="app-button-secondary w-fit">
            View full directory
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {doctors.slice(0, 6).map((doctor) => (
            <DoctorCard key={doctor._id} doctor={doctor} currencySymbol={currencySymbol} compact />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopDoctors;
