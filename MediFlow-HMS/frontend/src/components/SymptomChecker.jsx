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
        toast.success('Analysis completed.');
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
        eyebrow="AI symptom checker"
        title="Help patients understand the next best step faster."
        description="This tool now looks and feels like part of the main platform, with clearer result surfaces and calmer guidance around what the AI can and cannot do."
        stats={[
          { label: 'Input style', value: 'Free text + chips' },
          { label: 'Designed for', value: 'Early direction' },
          { label: 'Not a replacement', value: 'For real medical advice' },
        ]}
      />

      <section className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
        <form onSubmit={handleSubmit} className="glass-panel space-y-6 px-6 py-8 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Describe symptoms</p>
            <h2 className="mt-3 text-3xl font-bold text-secondary">Tell us what feels off.</h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">You can type your symptoms, then tap common ones to add or remove them quickly.</p>
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
            {loading ? 'Analyzing...' : 'Check symptoms'}
          </button>
        </form>

        <div className="space-y-4">
          {results ? (
            <>
              <article className="app-card p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Possible conditions</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {results.conditions?.length ? (
                    results.conditions.map((condition) => <span key={condition} className="app-chip">{condition}</span>)
                  ) : (
                    <span className="text-sm text-slate-500">No conditions identified.</span>
                  )}
                </div>
              </article>

              <article className="app-card p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Recommendations</p>
                <div className="mt-4 grid gap-3">
                  {results.recommendations?.length ? (
                    results.recommendations.map((recommendation) => (
                      <div key={recommendation} className="rounded-[22px] bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
                        {recommendation}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No specific recommendations available.</p>
                  )}
                </div>
              </article>
            </>
          ) : (
            <article className="app-card p-6 text-sm leading-7 text-slate-500">
              Results will appear here after the analysis completes.
            </article>
          )}

          <article className="rounded-[28px] border border-amber-200 bg-amber-50 px-6 py-5 text-sm leading-7 text-amber-800">
            This tool is not a substitute for professional medical advice. Patients should still consult a licensed healthcare provider for proper diagnosis and treatment.
          </article>
        </div>
      </section>
    </div>
  );
};

export default SymptomChecker;
