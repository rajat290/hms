import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';
import { AppContext } from '../context/AppContext';
import SectionHeading from './ui/SectionHeading';
import StatusBadge from './ui/StatusBadge';

const ReviewSection = ({ docId }) => {
  const { backendUrl, token, userData } = useContext(AppContext);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentAppointment, setRecentAppointment] = useState(null);

  const fetchReviews = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/doctor/reviews/${docId}`);
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkEligibility = async () => {
    if (!token || !userData) {
      return;
    }

    try {
      const { data } = await axios.get(`${backendUrl}/api/user/appointments`, { headers: { token } });
      if (data.success) {
        const completed = data.appointments.find(
          (appointment) => appointment.docId === docId && appointment.isCompleted && !appointment.cancelled,
        );
        setRecentAppointment(completed || null);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!recentAppointment) {
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/doctor/add-review`,
        {
          userId: userData._id,
          docId,
          appointmentId: recentAppointment._id,
          rating,
          comment,
        },
        { headers: { token } },
      );

      if (data.success) {
        toast.success('Review submitted successfully.');
        setComment('');
        setRecentAppointment(null);
        fetchReviews();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    checkEligibility();
  }, [docId, token, userData]);

  return (
    <section className="section-space">
      <div className="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
        <div className="glass-panel px-6 py-8 sm:px-8">
          <SectionHeading
            eyebrow="Patient reviews"
            title="What recent patients said after their visit."
            description="This area now has much clearer hierarchy, stronger trust cues, and a more polished review submission state."
          />

          {recentAppointment ? (
            <form onSubmit={submitReview} className="mt-8 space-y-4 rounded-[26px] bg-white/80 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-bold text-secondary">Leave a review</p>
                  <p className="text-sm text-slate-500">Share what the consultation felt like for you.</p>
                </div>
                <StatusBadge tone="info">Eligible to review</StatusBadge>
              </div>

              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-bold ${
                      rating >= value ? 'bg-accent text-secondary' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>

              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                className="app-textarea"
                placeholder="Tell future patients how the visit went."
                required
              />

              <button disabled={loading} className="app-button">
                {loading ? 'Submitting...' : 'Submit review'}
              </button>
            </form>
          ) : (
            <div className="mt-8 rounded-[26px] bg-white/80 p-5 text-sm leading-7 text-slate-500">
              Reviews can be added after a completed appointment with this doctor.
            </div>
          )}
        </div>

        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <article key={review._id || `${review.userId?._id}-${review.date}`} className="app-card px-6 py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={review.userId?.image || assets.profile_pic}
                      alt={review.userId?.name || 'Patient'}
                      className="h-12 w-12 rounded-2xl bg-slate-100 object-cover"
                    />
                    <div>
                      <p className="text-lg font-bold text-secondary">{review.userId?.name || 'Patient'}</p>
                      <p className="text-sm text-slate-500">{new Date(review.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <StatusBadge tone="success">{review.rating}/5 rating</StatusBadge>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">{review.comment}</p>
              </article>
            ))
          ) : (
            <article className="app-card px-6 py-8 text-sm leading-7 text-slate-500">
              No reviews yet for this doctor. Once completed appointments are reviewed, they will show up here.
            </article>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReviewSection;
