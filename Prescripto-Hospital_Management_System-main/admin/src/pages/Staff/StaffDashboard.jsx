import React, { useContext, useEffect } from "react";
import { assets } from "../../assets/assets";
import { StaffContext } from "../../context/StaffContext";
import { AppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";

const StaffDashboard = () => {
    const { sToken, getDashData, cancelAppointment, dashData } = useContext(StaffContext);
    const { slotDateFormat, isEmergencyMode } = useContext(AppContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (sToken) {
            getDashData();
        }
    }, [sToken]);

    return dashData ? (
        <div className="m-5">
            {isEmergencyMode && (
                <div className="bg-red-600 text-white p-4 rounded-xl mb-6 flex items-center justify-between animate-pulse shadow-lg">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🚨</span>
                        <div>
                            <p className="font-black uppercase tracking-widest text-sm">Emergency Mode Active</p>
                            <p className="text-xs text-red-100">All staff on high alert. Prioritize critical care patients.</p>
                        </div>
                    </div>
                    <button className="bg-white text-red-600 px-4 py-1 rounded-lg font-bold text-xs" onClick={() => navigate('/staff-queue')}>Go to Queue</button>
                </div>
            )}
            {/* 1. Key Stats Row */}
            <div className="flex flex-wrap gap-3 mb-8">
                <div className="flex-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 min-w-52">
                    <img className="w-12 p-3 bg-indigo-50 rounded-full" src={assets.appointment_icon} alt="" />
                    <div>
                        <p className="text-2xl font-bold text-gray-800">{dashData.appointments}</p>
                        <p className="text-sm text-gray-500 font-medium">Total Appointments</p>
                    </div>
                </div>
                <div className="flex-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 min-w-52">
                    <img className="w-12 p-3 bg-green-50 rounded-full" src={assets.patients_icon} alt="" />
                    <div>
                        <p className="text-2xl font-bold text-gray-800">{dashData.patients}</p>
                        <p className="text-sm text-gray-500 font-medium">Register Patients</p>
                    </div>
                </div>
                <div className="flex-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 min-w-52">
                    <img className="w-12 p-3 bg-blue-50 rounded-full" src={assets.doctor_icon} alt="" />
                    <div>
                        <p className="text-2xl font-bold text-gray-800">{dashData.doctors}</p>
                        <p className="text-sm text-gray-500 font-medium">Available Doctors</p>
                    </div>
                </div>
                <div className="flex-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 min-w-52">
                    <img className="w-12 p-3 bg-amber-50 rounded-full" src={assets.earning_icon} alt="" />
                    <div>
                        <p className="text-2xl font-bold text-gray-800">₹{dashData.totalCollections || 0}</p>
                        <p className="text-sm text-gray-500 font-medium">Today's Collections</p>
                    </div>
                </div>
            </div>

            {/* 2. Quick Actions Row */}
            <h3 className="text-lg font-bold text-gray-800 mb-4 px-1">Quick Actions</h3>
            <div className="flex flex-wrap gap-4 mb-8">
                <div
                    onClick={() => navigate('/staff-add-patient')}
                    className="flex-1 min-w-48 bg-gradient-to-r from-indigo-500 to-indigo-600 p-5 rounded-lg text-white shadow-md cursor-pointer hover:shadow-lg transition-all transform hover:-translate-y-1"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 p-2 rounded-full"><img className="w-6 invert" src={assets.add_icon} alt="" /></div>
                        <p className="font-bold text-lg">New Patient</p>
                    </div>
                    <p className="text-indigo-100 text-sm">Register a new patient arrival</p>
                </div>

                <div
                    onClick={() => navigate('/staff-appointments')}
                    className="flex-1 min-w-48 bg-white border border-gray-200 p-5 rounded-lg shadow-sm cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all group"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-green-50 p-2 rounded-full group-hover:bg-green-100"><img className="w-6" src={assets.appointment_icon} alt="" /></div>
                        <p className="font-bold text-lg text-gray-800">Book Appointment</p>
                    </div>
                    <p className="text-gray-500 text-sm">Schedule a consultation</p>
                </div>

                <div
                    onClick={() => navigate('/staff-patients')}
                    className="flex-1 min-w-48 bg-white border border-gray-200 p-5 rounded-lg shadow-sm cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all group"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-50 p-2 rounded-full group-hover:bg-blue-100"><img className="w-6" src={assets.people_icon} alt="" /></div>
                        <p className="font-bold text-lg text-gray-800">Search Patient</p>
                    </div>
                    <p className="text-gray-500 text-sm">Find records & details</p>
                </div>
                <div
                    onClick={() => navigate('/staff-billing')}
                    className="flex-1 min-w-48 bg-white border border-gray-200 p-5 rounded-lg shadow-sm cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all group"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-amber-50 p-2 rounded-full group-hover:bg-amber-100"><img className="w-6" src={assets.earning_icon} alt="" /></div>
                        <p className="font-bold text-lg text-gray-800">Billing</p>
                    </div>
                    <p className="text-gray-500 text-sm">Create invoice & payment</p>
                </div>
            </div>

            {/* 3. Today's Agenda */}
            <h3 className="text-lg font-bold text-gray-800 mb-4 px-1">Recent Activity</h3>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 px-6 py-4 border-b bg-gray-50/50">
                    <img src={assets.list_icon} alt="" />
                    <p className="font-semibold text-gray-700">Latest Bookings</p>
                </div>

                <div className="divide-y divide-gray-100">
                    {dashData.latestAppointments.slice(0, 5).map((item, index) => (
                        <div className="flex items-center px-6 py-4 gap-4 hover:bg-gray-50 transition-colors" key={index}>
                            <img className="rounded-full w-10 h-10 object-cover border border-gray-200" src={item.docData.image} alt="" />
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-900 font-medium truncate">{item.docData.name}</p>
                                <p className="text-gray-500 text-sm">{slotDateFormat(item.slotDate)} • {item.slotTime}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                {item.cancelled ? (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">Cancelled</span>
                                ) : item.isCompleted ? (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-100">Completed</span>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        {/* Quick Action: Cancel (simplified for cockpit) */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); cancelAppointment(item._id); }}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                            title="Cancel Appointment"
                                        >
                                            <img className="w-5 grayscale group-hover:grayscale-0" src={assets.cancel_icon} alt="" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    ) : (
        <div className="m-5 text-gray-500">Loading Dashboard...</div>
    );
};

export default StaffDashboard;
