import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const ReviewSection = ({ docId }) => {
    const { backendUrl, token, userData } = useContext(AppContext)
    const [reviews, setReviews] = useState([])
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [loading, setLoading] = useState(false)
    const [recentAppointment, setRecentAppointment] = useState(null)

    const fetchReviews = async () => {
        try {
            const { data } = await axios.get(backendUrl + `/api/doctor/reviews/${docId}`)
            if (data.success) {
                setReviews(data.reviews)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const checkEligibility = async () => {
        // Find if user has a completed appointment with this doctor that hasn't been reviewed
        if (token && userData) {
            try {
                const { data } = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } })
                if (data.success) {
                    const completed = data.appointments.find(app =>
                        app.docId === docId &&
                        app.isCompleted &&
                        !app.cancelled
                    )
                    setRecentAppointment(completed)
                }
            } catch (error) {
                console.log(error)
            }
        }
    }

    const submitReview = async (e) => {
        e.preventDefault()
        if (!recentAppointment) return

        setLoading(true)
        try {
            const { data } = await axios.post(backendUrl + '/api/doctor/add-review', {
                userId: userData._id,
                docId,
                appointmentId: recentAppointment._id,
                rating,
                comment
            }, { headers: { token } })

            if (data.success) {
                toast.success("Review submitted!")
                setComment('')
                setRecentAppointment(null)
                fetchReviews()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReviews()
        checkEligibility()
    }, [docId, token, userData])

    return (
        <div className='mt-10'>
            <h3 className='text-xl font-medium text-gray-800 mb-4'>Patient Reviews</h3>

            {/* Submit Review Logic */}
            {recentAppointment && (
                <div className='bg-primary/5 p-6 rounded-lg border border-primary/20 mb-8'>
                    <p className='font-medium text-gray-700 mb-2'>Leave a Review</p>
                    <form onSubmit={submitReview} className='flex flex-col gap-4'>
                        <div className='flex gap-2'>
                            {[1, 2, 3, 4, 5].map(num => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setRating(num)}
                                    className={`text-2xl ${rating >= num ? 'text-yellow-400' : 'text-gray-300'}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        <textarea
                            className='w-full border border-gray-300 rounded p-3 text-sm outline-none focus:border-primary'
                            placeholder='Share your experience with this doctor...'
                            rows="3"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            required
                        />
                        <button
                            disabled={loading}
                            className='bg-primary text-white px-8 py-2 rounded-full text-sm w-fit'
                        >
                            {loading ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </form>
                </div>
            )}

            {/* Display Reviews */}
            <div className='flex flex-col gap-6'>
                {reviews.length > 0 ? reviews.map((item, index) => (
                    <div key={index} className='border-b border-gray-100 pb-6 last:border-none'>
                        <div className='flex items-center gap-3 mb-2'>
                            <img className='w-10 h-10 rounded-full bg-gray-100' src={item.userId?.image || assets.profile_pic} alt="" />
                            <div>
                                <p className='font-medium text-gray-800 text-sm'>{item.userId?.name}</p>
                                <div className='flex text-xs text-yellow-400'>
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i}>{i < item.rating ? '★' : '☆'}</span>
                                    ))}
                                </div>
                            </div>
                            <p className='text-xs text-gray-400 ml-auto'>{new Date(item.date).toLocaleDateString()}</p>
                        </div>
                        <p className='text-gray-600 text-sm leading-relaxed'>{item.comment}</p>
                    </div>
                )) : (
                    <p className='text-gray-500 text-sm italic'>No reviews yet for this doctor.</p>
                )}
            </div>
        </div>
    )
}

export default ReviewSection
