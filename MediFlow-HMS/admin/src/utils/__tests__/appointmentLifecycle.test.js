import { describe, expect, it } from 'vitest';
import {
  VISIT_STATUS,
  canAcceptAppointment,
  canCancelAppointment,
  canCheckInAppointment,
  canCompleteAppointment,
  canStartConsultation,
  getVisitStatus,
  getVisitStatusMeta,
  isVisitActionableForBilling,
  isVisitActive,
} from '../appointmentLifecycle';

describe('appointmentLifecycle', () => {
  it('derives visit status from explicit status and legacy flags in the right order', () => {
    expect(getVisitStatus({ visitStatus: VISIT_STATUS.ACCEPTED, cancelled: true })).toBe(VISIT_STATUS.ACCEPTED);
    expect(getVisitStatus({ cancelled: true, isCompleted: true })).toBe(VISIT_STATUS.CANCELLED);
    expect(getVisitStatus({ isCompleted: true })).toBe(VISIT_STATUS.COMPLETED);
    expect(getVisitStatus({ isCheckedIn: true })).toBe(VISIT_STATUS.CHECKED_IN);
    expect(getVisitStatus({ isAccepted: true })).toBe(VISIT_STATUS.ACCEPTED);
    expect(getVisitStatus({})).toBe(VISIT_STATUS.REQUESTED);
  });

  it('returns action permissions that match the visit stage', () => {
    expect(canAcceptAppointment({ visitStatus: VISIT_STATUS.REQUESTED })).toBe(true);
    expect(canAcceptAppointment({ visitStatus: VISIT_STATUS.ACCEPTED })).toBe(false);

    expect(canCheckInAppointment({ visitStatus: VISIT_STATUS.REQUESTED })).toBe(true);
    expect(canCheckInAppointment({ visitStatus: VISIT_STATUS.ACCEPTED })).toBe(true);
    expect(canCheckInAppointment({ visitStatus: VISIT_STATUS.COMPLETED })).toBe(false);

    expect(canStartConsultation({ visitStatus: VISIT_STATUS.ACCEPTED })).toBe(true);
    expect(canStartConsultation({ visitStatus: VISIT_STATUS.CHECKED_IN })).toBe(true);
    expect(canStartConsultation({ visitStatus: VISIT_STATUS.REQUESTED })).toBe(false);

    expect(canCompleteAppointment({ visitStatus: VISIT_STATUS.IN_CONSULTATION })).toBe(true);
    expect(canCompleteAppointment({ visitStatus: VISIT_STATUS.CHECKED_IN })).toBe(false);

    expect(canCancelAppointment({ visitStatus: VISIT_STATUS.REQUESTED })).toBe(true);
    expect(canCancelAppointment({ visitStatus: VISIT_STATUS.CHECKED_IN })).toBe(true);
    expect(canCancelAppointment({ visitStatus: VISIT_STATUS.COMPLETED })).toBe(false);
  });

  it('exposes consistent meta and operational state helpers', () => {
    expect(getVisitStatusMeta({ visitStatus: VISIT_STATUS.CHECKED_IN })).toEqual(
      expect.objectContaining({
        label: 'Checked in',
        tone: 'info',
      }),
    );

    expect(isVisitActive({ visitStatus: VISIT_STATUS.REQUESTED })).toBe(true);
    expect(isVisitActive({ visitStatus: VISIT_STATUS.CANCELLED })).toBe(false);
    expect(isVisitActionableForBilling({ visitStatus: VISIT_STATUS.ACCEPTED })).toBe(true);
    expect(isVisitActionableForBilling({ visitStatus: VISIT_STATUS.CANCELLED })).toBe(false);
  });
});
