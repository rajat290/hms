// Utility to generate available slots for a doctor on a specific date
export const generateAvailableSlots = (doctorData, targetDate) => {
    const { availability, slots_booked } = doctorData;

    if (!availability || !availability.enabled) {
        return [];
    }

    const date = new Date(targetDate);
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
    const dateKey = `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`;

    // Check if date is blocked
    if (availability.blockedDates && availability.blockedDates.includes(dateKey)) {
        return [];
    }

    // Get schedule for this day (check custom dates first, then weekly schedule)
    let daySchedule = availability.customDates && availability.customDates[dateKey]
        ? availability.customDates[dateKey]
        : availability.schedule[dayName] || [];

    if (!daySchedule || daySchedule.length === 0) {
        return [];
    }

    const slotDuration = availability.slotDuration || 30;
    const slots = [];
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    // Generate slots for each time range
    daySchedule.forEach(range => {
        const [startHour, startMin] = range.start.split(':').map(Number);
        const [endHour, endMin] = range.end.split(':').map(Number);

        let currentTime = new Date(date);
        currentTime.setHours(startHour, startMin, 0, 0);

        const endTime = new Date(date);
        endTime.setHours(endHour, endMin, 0, 0);

        while (currentTime < endTime) {
            // Skip past slots if today
            if (isToday && currentTime <= now) {
                currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
                continue;
            }

            const timeStr = currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

            // Check if slot is already booked
            const isBooked = slots_booked[dateKey] && slots_booked[dateKey].includes(timeStr);

            if (!isBooked) {
                slots.push({
                    datetime: new Date(currentTime),
                    time: timeStr
                });
            }

            currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
        }
    });

    return slots;
};

// Helper to get slots for multiple days
export const getMultiDaySlots = (doctorData, startDate, numDays = 7) => {
    const allSlots = [];
    const current = new Date(startDate);

    for (let i = 0; i < numDays; i++) {
        const daySlots = generateAvailableSlots(doctorData, current);
        allSlots.push(daySlots);
        current.setDate(current.getDate() + 1);
    }

    return allSlots;
};
