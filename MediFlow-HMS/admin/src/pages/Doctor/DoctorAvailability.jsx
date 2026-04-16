import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { DoctorContext } from '../../context/DoctorContext';
import PageHeader from '../../components/backoffice/PageHeader';
import SurfaceCard from '../../components/backoffice/SurfaceCard';

const initialAvailability = {
  enabled: true,
  timezone: 'Asia/Kolkata',
  schedule: {
    monday: [{ start: '09:00', end: '17:00' }],
    tuesday: [{ start: '09:00', end: '17:00' }],
    wednesday: [{ start: '09:00', end: '17:00' }],
    thursday: [{ start: '09:00', end: '17:00' }],
    friday: [{ start: '09:00', end: '17:00' }],
    saturday: [],
    sunday: [],
  },
  slotDuration: 30,
  customDates: {},
  blockedDates: [],
};

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const daysDisplay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DoctorAvailability = () => {
  const { dToken, backendUrl, docId } = useContext(DoctorContext);
  const [availability, setAvailability] = useState(initialAvailability);

  useEffect(() => {
    const getAvailability = async () => {
      try {
        const { data } = await axios.post(
          `${backendUrl}/api/doctor/get-availability`,
          { docId },
          { headers: { dToken } },
        );
        if (data.success && data.availability) {
          setAvailability(data.availability);
        }
      } catch (error) {
        toast.error(error.message);
      }
    };

    if (dToken && docId) {
      getAvailability();
    }
  }, [backendUrl, dToken, docId]);

  const updateAvailability = async () => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/doctor/update-availability`,
        { docId, availability },
        { headers: { dToken } },
      );
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleScheduleChange = (day, index, field, value) => {
    const newSchedule = { ...availability.schedule };
    if (newSchedule[day][index]) {
      newSchedule[day][index][field] = value;
    }
    setAvailability({ ...availability, schedule: newSchedule });
  };

  const addTimeSlot = (day) => {
    const newSchedule = { ...availability.schedule };
    newSchedule[day].push({ start: '09:00', end: '17:00' });
    setAvailability({ ...availability, schedule: newSchedule });
  };

  const removeTimeSlot = (day, index) => {
    const newSchedule = { ...availability.schedule };
    newSchedule[day].splice(index, 1);
    setAvailability({ ...availability, schedule: newSchedule });
  };

  const toggleDayOff = (day) => {
    const newSchedule = { ...availability.schedule };
    newSchedule[day] = newSchedule[day].length === 0 ? [{ start: '09:00', end: '17:00' }] : [];
    setAvailability({ ...availability, schedule: newSchedule });
  };

  return (
    <div className="space-y-6 animate-soft-in">
      <PageHeader
        eyebrow="Doctor availability"
        title="Shape a schedule patients can trust and staff can understand quickly."
        description="Weekly hours and slot duration are laid out in a way that keeps every day readable, even when changes happen often."
        actions={
          <button type="button" className="soft-button-primary" onClick={updateAvailability}>
            Save availability
          </button>
        }
      />

      <SurfaceCard className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Timezone</label>
            <div className="soft-input flex items-center">{availability.timezone}</div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Slot duration</label>
            <select
              className="soft-select"
              value={availability.slotDuration}
              onChange={(event) => setAvailability({ ...availability, slotDuration: Number(event.target.value) })}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {daysOfWeek.map((day, index) => (
            <div key={day} className="rounded-[26px] border border-slate-100 bg-slate-50/80 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={availability.schedule[day].length > 0}
                      onChange={() => toggleDayOff(day)}
                    />
                    <span className="h-7 w-14 rounded-full bg-slate-200 transition after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:bg-teal-500 peer-checked:after:translate-x-7" />
                  </label>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{daysDisplay[index]}</p>
                    <p className="text-sm text-slate-500">
                      {availability.schedule[day].length > 0 ? 'Booking slots available' : 'Marked as day off'}
                    </p>
                  </div>
                </div>
                {availability.schedule[day].length > 0 ? (
                  <button type="button" className="soft-button-secondary px-4 py-2 text-xs" onClick={() => addTimeSlot(day)}>
                    Add time range
                  </button>
                ) : null}
              </div>

              {availability.schedule[day].length > 0 ? (
                <div className="mt-5 space-y-3">
                  {availability.schedule[day].map((slot, slotIndex) => (
                    <div key={`${day}-${slotIndex}`} className="grid gap-3 rounded-[22px] border border-white/80 bg-white/90 p-4 md:grid-cols-[1fr_auto_1fr_auto] md:items-center">
                      <input type="time" value={slot.start} onChange={(event) => handleScheduleChange(day, slotIndex, 'start', event.target.value)} className="soft-input" />
                      <span className="text-center text-sm font-semibold text-slate-400">to</span>
                      <input type="time" value={slot.end} onChange={(event) => handleScheduleChange(day, slotIndex, 'end', event.target.value)} className="soft-input" />
                      {availability.schedule[day].length > 1 ? (
                        <button type="button" className="soft-button-secondary px-4 py-2 text-xs" onClick={() => removeTimeSlot(day, slotIndex)}>
                          Remove
                        </button>
                      ) : (
                        <div />
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
};

export default DoctorAvailability;
