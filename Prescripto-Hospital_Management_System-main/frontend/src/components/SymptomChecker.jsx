import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const SymptomChecker = () => {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const commonSymptoms = [
    'Fever', 'Headache', 'Cough', 'Fatigue', 'Nausea', 'Dizziness',
    'Chest pain', 'Shortness of breath', 'Abdominal pain', 'Joint pain',
    'Skin rash', 'Sore throat', 'Runny nose', 'Muscle pain'
  ];

  const handleSymptomClick = (symptom) => {
    if (symptoms.includes(symptom)) {
      setSymptoms(symptoms.replace(symptom + ', ', '').replace(', ' + symptom, '').replace(symptom, ''));
    } else {
      setSymptoms(prev => prev ? prev + ', ' + symptom : symptom);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      toast.error('Please enter or select at least one symptom');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:4000/api/ai/check-symptoms', {
        symptoms: symptoms.trim()
      });

      if (data.success) {
        setResults(data.results);
        toast.success('Analysis completed');
      } else {
        toast.error(data.message || 'Analysis failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Symptom Checker</h1>
          <p className="text-gray-600">Describe your symptoms or select from common ones below</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-2">
                Your Symptoms
              </label>
              <textarea
                id="symptoms"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Describe your symptoms in detail..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              />
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Common Symptoms (click to add/remove):</p>
              <div className="flex flex-wrap gap-2">
                {commonSymptoms.map((symptom) => (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => handleSymptomClick(symptom)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      symptoms.includes(symptom)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Check Symptoms'}
            </button>
          </form>
        </div>

        {results && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Analysis Results</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Possible Conditions:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {results.conditions?.map((condition, index) => (
                    <li key={index} className="text-gray-700">{condition}</li>
                  )) || <li className="text-gray-500">No conditions identified</li>}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Recommendations:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {results.recommendations?.map((rec, index) => (
                    <li key={index} className="text-gray-700">{rec}</li>
                  )) || <li className="text-gray-500">No specific recommendations</li>}
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>This is not a substitute for professional medical advice. Please consult a healthcare provider for proper diagnosis and treatment.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SymptomChecker;
