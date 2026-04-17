export const VISIT_STATUS = Object.freeze({
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  CHECKED_IN: 'checked_in',
  IN_CONSULTATION: 'in_consultation',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
})

const STATUS_META = Object.freeze({
  [VISIT_STATUS.REQUESTED]: {
    label: 'Requested',
    tone: 'warning',
    description: 'Waiting for confirmation',
  },
  [VISIT_STATUS.ACCEPTED]: {
    label: 'Accepted',
    tone: 'info',
    description: 'Confirmed and waiting for patient',
  },
  [VISIT_STATUS.CHECKED_IN]: {
    label: 'Checked in',
    tone: 'info',
    description: 'Patient is ready for the doctor',
  },
  [VISIT_STATUS.IN_CONSULTATION]: {
    label: 'In consultation',
    tone: 'accent',
    description: 'Visit is actively in progress',
  },
  [VISIT_STATUS.COMPLETED]: {
    label: 'Completed',
    tone: 'success',
    description: 'Visit closed successfully',
  },
  [VISIT_STATUS.CANCELLED]: {
    label: 'Cancelled',
    tone: 'danger',
    description: 'Booking was cancelled',
  },
})

export const getVisitStatus = (appointment) => {
  if (appointment?.visitStatus) {
    return appointment.visitStatus
  }

  if (appointment?.cancelled) {
    return VISIT_STATUS.CANCELLED
  }

  if (appointment?.isCompleted) {
    return VISIT_STATUS.COMPLETED
  }

  if (appointment?.isCheckedIn) {
    return VISIT_STATUS.CHECKED_IN
  }

  if (appointment?.isAccepted) {
    return VISIT_STATUS.ACCEPTED
  }

  return VISIT_STATUS.REQUESTED
}

export const getVisitStatusMeta = (appointment) => STATUS_META[getVisitStatus(appointment)] || STATUS_META[VISIT_STATUS.REQUESTED]

export const canAcceptAppointment = (appointment) => getVisitStatus(appointment) === VISIT_STATUS.REQUESTED

export const canCheckInAppointment = (appointment) => {
  const visitStatus = getVisitStatus(appointment)
  return visitStatus === VISIT_STATUS.REQUESTED || visitStatus === VISIT_STATUS.ACCEPTED
}

export const canStartConsultation = (appointment) => {
  const visitStatus = getVisitStatus(appointment)
  return visitStatus === VISIT_STATUS.ACCEPTED || visitStatus === VISIT_STATUS.CHECKED_IN
}

export const canCompleteAppointment = (appointment) => getVisitStatus(appointment) === VISIT_STATUS.IN_CONSULTATION

export const canCancelAppointment = (appointment) => {
  const visitStatus = getVisitStatus(appointment)
  return [
    VISIT_STATUS.REQUESTED,
    VISIT_STATUS.ACCEPTED,
    VISIT_STATUS.CHECKED_IN,
  ].includes(visitStatus)
}

export const isVisitActive = (appointment) => {
  const visitStatus = getVisitStatus(appointment)
  return ![VISIT_STATUS.COMPLETED, VISIT_STATUS.CANCELLED].includes(visitStatus)
}

export const isVisitActionableForBilling = (appointment) => getVisitStatus(appointment) !== VISIT_STATUS.CANCELLED
