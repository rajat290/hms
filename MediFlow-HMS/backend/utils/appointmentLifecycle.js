const VISIT_STATUS = Object.freeze({
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  CHECKED_IN: 'checked_in',
  IN_CONSULTATION: 'in_consultation',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

const STATUS_TRANSITIONS = Object.freeze({
  [VISIT_STATUS.REQUESTED]: [VISIT_STATUS.ACCEPTED, VISIT_STATUS.CHECKED_IN, VISIT_STATUS.CANCELLED],
  [VISIT_STATUS.ACCEPTED]: [VISIT_STATUS.CHECKED_IN, VISIT_STATUS.IN_CONSULTATION, VISIT_STATUS.CANCELLED],
  [VISIT_STATUS.CHECKED_IN]: [VISIT_STATUS.IN_CONSULTATION, VISIT_STATUS.CANCELLED],
  [VISIT_STATUS.IN_CONSULTATION]: [VISIT_STATUS.COMPLETED],
  [VISIT_STATUS.COMPLETED]: [],
  [VISIT_STATUS.CANCELLED]: [],
});

const deriveVisitStatusFromLegacyFlags = (appointment, { preferVisitStatus = true } = {}) => {
  if (preferVisitStatus && appointment?.visitStatus) {
    return appointment.visitStatus;
  }

  if (appointment?.cancelled) {
    return VISIT_STATUS.CANCELLED;
  }

  if (appointment?.isCompleted) {
    return VISIT_STATUS.COMPLETED;
  }

  if (appointment?.isCheckedIn) {
    return VISIT_STATUS.CHECKED_IN;
  }

  if (appointment?.isAccepted) {
    return VISIT_STATUS.ACCEPTED;
  }

  return VISIT_STATUS.REQUESTED;
};

const syncLegacyAppointmentFlags = (appointment) => {
  const status = deriveVisitStatusFromLegacyFlags(appointment);

  appointment.visitStatus = status;
  appointment.cancelled = status === VISIT_STATUS.CANCELLED;
  appointment.isCompleted = status === VISIT_STATUS.COMPLETED;
  appointment.isCheckedIn = [
    VISIT_STATUS.CHECKED_IN,
    VISIT_STATUS.IN_CONSULTATION,
    VISIT_STATUS.COMPLETED,
  ].includes(status);
  appointment.isAccepted = [
    VISIT_STATUS.ACCEPTED,
    VISIT_STATUS.CHECKED_IN,
    VISIT_STATUS.IN_CONSULTATION,
    VISIT_STATUS.COMPLETED,
  ].includes(status);

  return appointment;
};

const applyVisitStatus = ({
  appointment,
  nextStatus,
  at = new Date(),
  reason,
}) => {
  appointment.visitStatus = nextStatus;
  appointment.lastStatusUpdatedAt = at;

  if (nextStatus === VISIT_STATUS.REQUESTED) {
    appointment.acceptedAt = undefined;
    appointment.checkedInAt = undefined;
    appointment.consultationStartedAt = undefined;
    appointment.completedAt = undefined;
    appointment.cancelledAt = undefined;
    appointment.cancellationReason = undefined;
  }

  if (nextStatus === VISIT_STATUS.ACCEPTED) {
    appointment.acceptedAt = appointment.acceptedAt || at;
    appointment.cancelledAt = undefined;
    appointment.cancellationReason = undefined;
  }

  if (nextStatus === VISIT_STATUS.CHECKED_IN) {
    appointment.acceptedAt = appointment.acceptedAt || at;
    appointment.checkedInAt = appointment.checkedInAt || at;
    appointment.cancelledAt = undefined;
    appointment.cancellationReason = undefined;
  }

  if (nextStatus === VISIT_STATUS.IN_CONSULTATION) {
    appointment.acceptedAt = appointment.acceptedAt || at;
    appointment.checkedInAt = appointment.checkedInAt || at;
    appointment.consultationStartedAt = appointment.consultationStartedAt || at;
    appointment.cancelledAt = undefined;
    appointment.cancellationReason = undefined;
  }

  if (nextStatus === VISIT_STATUS.COMPLETED) {
    appointment.acceptedAt = appointment.acceptedAt || at;
    appointment.checkedInAt = appointment.checkedInAt || at;
    appointment.consultationStartedAt = appointment.consultationStartedAt || at;
    appointment.completedAt = at;
    appointment.cancelledAt = undefined;
    appointment.cancellationReason = undefined;
  }

  if (nextStatus === VISIT_STATUS.CANCELLED) {
    appointment.cancelledAt = at;
    appointment.cancellationReason = reason || appointment.cancellationReason;
  }

  return syncLegacyAppointmentFlags(appointment);
};

const assertVisitTransition = ({ appointment, nextStatus, allowedFrom }) => {
  const currentStatus = deriveVisitStatusFromLegacyFlags(appointment);

  if (currentStatus === nextStatus) {
    return currentStatus;
  }

  if (allowedFrom && allowedFrom.length > 0 && !allowedFrom.includes(currentStatus)) {
    throw new Error(`Appointment must be in one of these states: ${allowedFrom.join(', ')}`);
  }

  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowedTransitions.includes(nextStatus)) {
    throw new Error(`Cannot move appointment from ${currentStatus} to ${nextStatus}`);
  }

  return currentStatus;
};

const transitionAppointmentVisitStatus = ({
  appointment,
  nextStatus,
  allowedFrom,
  at,
  reason,
}) => {
  assertVisitTransition({ appointment, nextStatus, allowedFrom });
  return applyVisitStatus({ appointment, nextStatus, at, reason });
};

const resetAppointmentForReschedule = ({ appointment, at = new Date() }) => {
  appointment.rescheduledCount = (appointment.rescheduledCount || 0) + 1;
  appointment.lastRescheduledAt = at;
  return applyVisitStatus({
    appointment,
    nextStatus: VISIT_STATUS.REQUESTED,
    at,
  });
};

export {
  VISIT_STATUS,
  applyVisitStatus,
  assertVisitTransition,
  deriveVisitStatusFromLegacyFlags,
  resetAppointmentForReschedule,
  syncLegacyAppointmentFlags,
  transitionAppointmentVisitStatus,
};
