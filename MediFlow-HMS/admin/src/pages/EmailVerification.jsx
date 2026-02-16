import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { AdminContext } from '../context/AdminContext';

const EmailVerification = () => {
    const { backendUrl } = useContext(AdminContext);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [verified, setVerified] = useState(false);

    const token = searchParams.get('token');
    const role = searchParams.get('role');

    useEffect(() => {
        if (token && role) {
            verifyEmail(token, role);
        } else {
            setLoading(false);
            toast.error('Invalid verification link');
        }
    }, [token, role]);

    const verifyEmail = async (token, role) => {
        try {
            let endpoint = '';
            if (role === 'doctor') endpoint = '/api/doctor/verify-email';
            else if (role === 'staff') endpoint = '/api/staff/verify-email';
            else {
                toast.error('Invalid role specialized');
                setLoading(false);
                return;
            }

            const { data } = await axios.post(backendUrl + endpoint, { token });
            if (data.success) {
                setVerified(true);
                toast.success(data.message);
                setTimeout(() => {
                    navigate('/?role=' + role);
                }, 3000);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 text-center border border-gray-100">
                {verified ? (
                    <>
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                            <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">Verified!</h2>
                        <p className="text-gray-600 mb-6 text-lg">Your account has been successfully verified. Redirecting to login...</p>
                    </>
                ) : (
                    <>
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                            <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">Verification Failed</h2>
                        <p className="text-gray-600 mb-8 text-lg">The link is invalid or has expired.</p>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-primary text-white py-3 px-6 rounded-xl font-bold shadow-lg hover:shadow-primary/30 transition-all hover:scale-[1.02]"
                        >
                            Back to Login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default EmailVerification;
