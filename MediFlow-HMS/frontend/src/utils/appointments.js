export const normalizeDoctorSlots = (slotGroups = []) =>
  slotGroups.map((daySlots = []) =>
    daySlots.map((slot) => ({
      ...slot,
      datetime: new Date(slot.datetime),
    })),
  );

export const buildSlotDateKey = (date) => {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return `${day}_${month}_${year}`;
};

export const isAppointmentPaid = (appointment) =>
  Boolean(appointment?.payment || appointment?.paymentStatus === 'paid');

export const getAppointmentStage = (appointment) => {
  if (appointment?.cancelled) {
    return { label: 'Cancelled', tone: 'danger' };
  }

  if (appointment?.isCompleted) {
    return { label: 'Completed', tone: 'success' };
  }

  if (appointment?.isAccepted) {
    return { label: 'Confirmed', tone: 'success' };
  }

  return { label: 'Pending review', tone: 'info' };
};

export const getPaymentStage = (appointment) => {
  if (appointment?.paymentStatus === 'refunded') {
    return { label: 'Refunded', tone: 'neutral' };
  }

  if (isAppointmentPaid(appointment)) {
    return { label: 'Paid', tone: 'success' };
  }

  if (appointment?.paymentStatus === 'partially paid') {
    return { label: 'Partially paid', tone: 'warning' };
  }

  return { label: 'Awaiting payment', tone: 'warning' };
};
