import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import DoctorCard from '../components/ui/DoctorCard';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import PageHero from '../components/ui/PageHero';

const specialities = [
  'General physician',
  'Gynecologist',
  'Dermatologist',
  'Pediatricians',
  'Neurologist',
  'Gastroenterologist',
];

const Doctors = () => {
  const { speciality } = useParams();
  const navigate = useNavigate();
  const { doctors, currencySymbol, doctorsLoading } = useContext(AppContext);

  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [maxFees, setMaxFees] = useState(5000);
  const [availability, setAvailability] = useState('all');

  useEffect(() => {
    setSearch('');
    setGender('');
    setAvailability('all');
    setMaxFees(5000);
  }, [speciality]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const matchesSpeciality = speciality ? doctor.speciality === speciality : true;
      const matchesSearch = search ? doctor.name.toLowerCase().includes(search.toLowerCase()) : true;
      const matchesGender = gender ? doctor.gender === gender : true;
      const matchesFees = Number(doctor.fees) <= Number(maxFees);
      const matchesAvailability =
        availability === 'all' ? true : availability === 'available' ? doctor.available !== false : doctor.available === false;

      return matchesSpeciality && matchesSearch && matchesGender && matchesFees && matchesAvailability;
    });
  }, [availability, doctors, gender, maxFees, search, speciality]);

  if (doctorsLoading) {
    return <LoadingState title="Building the doctor directory" message="Loading specialists, availability, and consultation details." fullHeight />;
  }

  return (
    <div className="section-space space-y-8">
      <PageHero
        eyebrow="Doctor directory"
        title={speciality ? `${speciality} specialists` : 'Find the right doctor without fighting the interface.'}
        description="The directory now prioritizes readability, cleaner filters, and stronger card hierarchy so browsing actually supports decision-making."
        stats={[
          { label: 'Doctors listed', value: doctors.length || '0' },
          { label: 'Filtered results', value: filteredDoctors.length || '0' },
          { label: 'Fee ceiling', value: `${currencySymbol}${maxFees}` },
        ]}
        aside={
          <div className="app-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Quick filters</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-secondary">Doctor name</label>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="app-input"
                  placeholder="Search by doctor name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-secondary">Gender</label>
                <select value={gender} onChange={(event) => setGender(event.target.value)} className="app-select">
                  <option value="">All</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-secondary">Availability</label>
                <select value={availability} onChange={(event) => setAvailability(event.target.value)} className="app-select">
                  <option value="all">Any status</option>
                  <option value="available">Open for booking</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-secondary">Max consultation fee</label>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="50"
                  value={maxFees}
                  onChange={(event) => setMaxFees(event.target.value)}
                  className="w-full accent-primary"
                />
                <p className="mt-2 text-sm text-slate-500">
                  Up to {currencySymbol}
                  {maxFees}
                </p>
              </div>
            </div>
          </div>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[280px,minmax(0,1fr)]">
        <aside className="space-y-3 xl:sticky xl:top-28 xl:self-start">
          <div className="app-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Specialties</p>
            <div className="mt-4 grid gap-2">
              {specialities.map((item) => {
                const active = speciality === item;
                return (
                  <button
                    key={item}
                    onClick={() => navigate(active ? '/doctors' : `/doctors/${item}`)}
                    className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold ${
                      active ? 'bg-secondary text-white' : 'bg-slate-50 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => {
              setSearch('');
              setGender('');
              setAvailability('all');
              setMaxFees(5000);
              navigate('/doctors');
            }}
            className="app-button-secondary w-full justify-center"
          >
            Reset filters
          </button>
        </aside>

        <div className="space-y-6">
          {filteredDoctors.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredDoctors.map((doctor) => (
                <DoctorCard key={doctor._id} doctor={doctor} currencySymbol={currencySymbol} compact />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No doctors match these filters"
              description="Try broadening the fee range, clearing the search term, or switching to a different specialty."
              action={
                <button
                  onClick={() => {
                    setSearch('');
                    setGender('');
                    setAvailability('all');
                    setMaxFees(5000);
                    navigate('/doctors');
                  }}
                  className="app-button"
                >
                  Clear filters
                </button>
              }
            />
          )}
        </div>
      </section>
    </div>
  );
};

export default Doctors;
