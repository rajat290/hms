import {
  anonymizeUserForDeletion,
  buildAadhaarRecord,
  buildPrivacyConsentRecord,
  getDeletionReviewWindowDays,
  getPrivacyPolicyVersion,
  isPrivacyConsentCurrent,
} from '../utils/privacy.js';

describe('privacy utils', () => {
  it('normalizes Aadhaar into hashed and masked storage fields', () => {
    expect(buildAadhaarRecord('1234 5678 9012')).toEqual({
      aadharHash: expect.any(String),
      aadharMasked: 'XXXX XXXX 9012',
    });
  });

  it('builds a current consent record against the active policy version', () => {
    const settings = { privacyPolicyVersion: '2026-09', deletionReviewWindowDays: 45 };
    const consent = buildPrivacyConsentRecord({ version: getPrivacyPolicyVersion(settings) });

    expect(getDeletionReviewWindowDays(settings)).toBe(45);
    expect(isPrivacyConsentCurrent({ consent, settings })).toBe(true);
  });

  it('anonymizes user data when an account deletion request is completed', () => {
    const user = {
      _id: 'user-123456',
      name: 'Aarav Singh',
      email: 'aarav@mediflow.test',
      phone: '9999999999',
      address: { line1: 'Lake Road' },
      insuranceId: 'INS-1001',
      aadharHash: 'hash',
      aadharMasked: 'XXXX XXXX 9012',
      emergencyContact: { name: 'Neha', phone: '8888888888', relation: 'Sister' },
    };

    anonymizeUserForDeletion(user);

    expect(user.name).toContain('Deleted User');
    expect(user.email).toMatch(/@privacy\.mediflow\.invalid$/);
    expect(user.phone).toBe('');
    expect(user.aadharHash).toBe('');
    expect(user.aadharMasked).toBe('');
    expect(user.accountStatus).toBe('anonymized');
    expect(user.anonymizedAt).toBeInstanceOf(Date);
  });
});
