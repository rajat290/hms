import React, { useContext, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import PageHero from './ui/PageHero';
import { AppContext } from '../context/AppContext';

const SmartScheduler = () => {
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Choose a doctor and date to get a suggestion from live availability.');
  const [loading, setLoading] = useState(false);
  const { backendUrl, doctors = [], doctorsLoading = false } = useContext(AppContext);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor._id === doctorId) || null,
    [doctorId, doctors],
  );

  const getSuggestion = async () => {
    if (!doctorId || !date) {
      toast.error('Please choose both a doctor and a date.');
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post(`${backendUrl}/api/ai/smart-schedule`, { doctorId, date });

      if (data.success) {
        setSuggestion(data.suggestion || null);
        setStatusMessage(data.message || 'No schedule guidance is available right now.');
      } else {
        toast.error(data.message || 'Smart scheduling failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Smart scheduling failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-space space-y-8">
      <PageHero
        eyebrow="AI scheduling assistant"
        title="Find a balanced slot from live doctor availability."
        description="This assistant reads the doctor schedule first, then suggests a time or the next open clinic day instead of inventing a placeholder slot."
        stats={[
          { label: 'Uses', value: 'Real availability' },
          { label: 'Best for', value: 'Faster booking' },
          { label: 'Reminder', value: 'Availability can change' },
        ]}
      />

      <section className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
        <div className="glass-panel px-6 py-8 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Scheduling support</p>
          <h2 className="mt-3 text-3xl font-bold text-secondary">Choose a doctor and review the best opening</h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            Suggestions are based on the doctor schedule already stored in MediFlow. They help you start booking faster, but the slot is only confirmed after the appointment is booked.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">Doctor</label>
              <select
                aria-label="Doctor"
                value={doctorId}
                onChange={(event) => setDoctorId(event.target.value)}
                className="app-select"
                disabled={doctorsLoading}
              >
                <option value="">{doctorsLoading ? 'Loading doctors...' : 'Select a doctor'}</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.name} {doctor.speciality ? `- ${doctor.speciality}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">Date</label>
              <input
                aria-label="Date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="app-input"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                required
              />
            </div>

            <button onClick={getSuggestion} className="app-button" disabled={loading || doctorsLoading}>
              {loading ? 'Checking schedule...' : 'Get suggestion'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <article className="app-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Suggested result</p>
            <p className="mt-4 text-3xl font-bold text-secondary">
              {suggestion ? `Suggested Time: ${suggestion.suggestedTime}` : 'Suggested Time: --'}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-500">{statusMessage}</p>

            {suggestion ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-[22px] bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
                  <p><span className="font-semibold text-secondary">Doctor:</span> {suggestion.doctorName}</p>
                  <p><span className="font-semibold text-secondary">Suggested Date:</span> {suggestion.displayDate}</p>
                  <p><span className="font-semibold text-secondary">Why this slot:</span> {suggestion.rationale}</p>
                </div>

                {suggestion.alternativeTimes?.length ? (
                  <div>
                    <p className="mb-3 text-sm font-semibold text-secondary">Other nearby times</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestion.alternativeTimes.map((time) => (
                        <span key={time} className="app-chip">
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </article>

          <article className="app-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">What this assistant does</p>
            <div className="mt-4 grid gap-3">
              {[
                'Looks at actual doctor availability before suggesting a time.',
                'Falls forward to the next open clinic day if the requested date is full.',
                'Helps you start booking faster, but does not reserve the slot on its own.',
              ].map((item) => (
                <div key={item} className="rounded-[22px] bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
                  {item}
                </div>
              ))}
            </div>
          </article>

          {selectedDoctor ? (
            <article className="rounded-[28px] border border-sky-200 bg-sky-50 px-6 py-5 text-sm leading-7 text-sky-900">
              Reviewing schedule guidance for <span className="font-semibold">{selectedDoctor.name}</span>.
              {selectedDoctor.speciality ? ` Current speciality: ${selectedDoctor.speciality}.` : ''}
            </article>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default SmartScheduler;
