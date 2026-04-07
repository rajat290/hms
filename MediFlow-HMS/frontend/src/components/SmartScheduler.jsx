import React, { useContext, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import PageHero from './ui/PageHero';
import { AppContext } from '../context/AppContext';

const SmartScheduler = () => {
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [suggestedTime, setSuggestedTime] = useState('');
  const [loading, setLoading] = useState(false);
  const { backendUrl, doctors = [] } = useContext(AppContext);

  const getSuggestion = async () => {
    try {
      setLoading(true);
      const { data } = await axios.post(`${backendUrl}/api/ai/smart-schedule`, { doctorId, date });
      if (data.success) {
        setSuggestedTime(data.suggestedTime);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Smart scheduling failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-space space-y-8">
      <PageHero
        eyebrow="AI scheduling assistant"
        title="AI Smart Scheduler"
        description="Get optimal appointment time with a more polished workflow that feels native to the rest of the patient experience."
        stats={[
          { label: 'Best for', value: 'Busy schedules' },
          { label: 'Input', value: 'Doctor + date' },
          { label: 'Outcome', value: 'Suggested slot' },
        ]}
      />

      <section className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
        <div className="glass-panel px-6 py-8 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Scheduling support</p>
          <h2 className="mt-3 text-3xl font-bold text-secondary">Get optimal appointment time</h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">Select a doctor, choose a day, and let the assistant suggest a better consultation window.</p>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">Doctor ID</label>
              <input
                aria-label="Doctor ID"
                value={doctorId}
                onChange={(event) => setDoctorId(event.target.value)}
                className="app-input"
                type="text"
                list="doctor-options"
                required
              />
              <datalist id="doctor-options">
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.name}
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-secondary">Date</label>
              <input
                aria-label="Date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="app-input"
                type="date"
                required
              />
            </div>

            <button onClick={getSuggestion} className="app-button">
              {loading ? 'Getting suggestion...' : 'Get Suggestion'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <article className="app-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">How it helps</p>
            <div className="mt-4 grid gap-3">
              {[
                'Reduce trial-and-error while booking.',
                'Give patients a better sense of availability earlier.',
                'Keep the AI tools aligned with the product visual language.',
              ].map((item) => (
                <div key={item} className="rounded-[22px] bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
                  {item}
                </div>
              ))}
            </div>
          </article>

          <article className="app-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Suggested result</p>
            <p className="mt-4 text-3xl font-bold text-secondary">{suggestedTime ? `Suggested Time: ${suggestedTime}` : 'Suggested Time: --'}</p>
            <p className="mt-3 text-sm leading-7 text-slate-500">A suggested time appears here after the AI evaluates the date and doctor combination.</p>
          </article>
        </div>
      </section>
    </div>
  );
};

export default SmartScheduler;
