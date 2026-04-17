import React, { useContext, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import PageHero from './ui/PageHero';
import { AppContext } from '../context/AppContext';

const commonSymptoms = [
  'Fever',
  'Headache',
  'Cough',
  'Fatigue',
  'Nausea',
  'Dizziness',
  'Chest pain',
  'Shortness of breath',
  'Abdominal pain',
  'Joint pain',
  'Skin rash',
  'Sore throat',
  'Runny nose',
  'Muscle pain',
];

const urgencyTone = {
  emergency: 'border-rose-200 bg-rose-50 text-rose-900',
  'same-day': 'border-amber-200 bg-amber-50 text-amber-900',
  routine: 'border-sky-200 bg-sky-50 text-sky-900',
};

const SymptomChecker = () => {
  const { backendUrl } = useContext(AppContext);
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleSymptomClick = (symptom) => {
    if (symptoms.includes(symptom)) {
      setSymptoms(symptoms.replace(`${symptom}, `, '').replace(`, ${symptom}`, '').replace(symptom, ''));
      return;
    }

    setSymptoms((current) => (current ? `${current}, ${symptom}` : symptom));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!symptoms.trim()) {
      toast.error('Please enter or select at least one symptom.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post(`${backendUrl}/api/ai/check-symptoms`, {
        symptoms: symptoms.trim(),
      });

      if (data.success) {
        setResults(data.results);
      } else {
        toast.error(data.message || 'Analysis failed.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-space space-y-8">
      <PageHero
        eyebrow="AI symptom guide"
        title="Use AI for next-step guidance, not diagnosis."
        description="This tool now focuses on urgency, care area, and safer follow-up guidance instead of guessing a disease label."
        stats={[
          { label: 'Output', value: 'Triage-style guidance' },
          { label: 'Designed for', value: 'Early direction' },
          { label: 'Not for', value: 'Diagnosis or treatment' },
        ]}
      />

      <section className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
        <form onSubmit={handleSubmit} className="glass-panel space-y-6 px-6 py-8 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Describe symptoms</p>
            <h2 className="mt-3 text-3xl font-bold text-secondary">Tell us what feels off.</h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              Type symptoms in plain language, then tap common ones to add or remove them quickly. If someone has trouble breathing, chest pain, severe bleeding, or feels unsafe, seek urgent care right away instead of relying on this tool.
            </p>
          </div>

          <textarea
            rows={5}
            className="app-textarea"
            placeholder="Describe your symptoms in detail..."
            value={symptoms}
            onChange={(event) => setSymptoms(event.target.value)}
          />

          <div>
            <p className="mb-3 text-sm font-semibold text-secondary">Common symptoms</p>
            <div className="flex flex-wrap gap-2">
              {commonSymptoms.map((symptom) => (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => handleSymptomClick(symptom)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    symptoms.includes(symptom) ? 'bg-secondary text-white' : 'border border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {symptom}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="app-button">
            {loading ? 'Reviewing symptoms...' : 'Check symptoms'}
          </button>
        </form>

        <div className="space-y-4">
          {results ? (
            <>
              <article className={`rounded-[28px] border px-6 py-5 ${urgencyTone[results.urgency?.level || 'routine']}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">Urgency</p>
                <h3 className="mt-2 text-2xl font-bold">{results.urgency?.title || 'Guidance ready'}</h3>
                <p className="mt-3 text-sm leading-7">{results.summary}</p>
              </article>

              <article className="app-card p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Suggested care area</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {results.careAreas?.length ? (
                    results.careAreas.map((area) => (
                      <span key={area} className="app-chip">
                        {area}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No care area identified.</span>
                  )}
                </div>
              </article>

              <article className="app-card p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">What to do now</p>
                <div className="mt-4 grid gap-3">
                  {results.nextSteps?.length ? (
                    results.nextSteps.map((step) => (
                      <div key={step} className="rounded-[22px] bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
                        {step}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No specific next steps available.</p>
                  )}
                </div>
              </article>

              <article className="app-card p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Self-care while arranging care</p>
                <div className="mt-4 grid gap-3">
                  {results.selfCare?.length ? (
                    results.selfCare.map((tip) => (
                      <div key={tip} className="rounded-[22px] bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
                        {tip}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No self-care guidance available.</p>
                  )}
                </div>
              </article>

              {results.urgentSignals?.length ? (
                <article className="rounded-[28px] border border-amber-200 bg-amber-50 px-6 py-5 text-sm leading-7 text-amber-900">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Signals to mention when you book</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {results.urgentSignals.map((signal) => (
                      <span key={signal} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-amber-900">
                        {signal}
                      </span>
                    ))}
                  </div>
                </article>
              ) : null}
            </>
          ) : (
            <article className="app-card p-6 text-sm leading-7 text-slate-500">
              Results will appear here after the analysis completes.
            </article>
          )}

          <article className="rounded-[28px] border border-amber-200 bg-amber-50 px-6 py-5 text-sm leading-7 text-amber-800">
            This tool does not diagnose illness or replace licensed medical care. For emergency symptoms, go to urgent or emergency care immediately.
          </article>
        </div>
      </section>
    </div>
  );
};

export default SymptomChecker;
