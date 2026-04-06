import { jest } from '@jest/globals';

const startSessionMock = jest.fn();

jest.unstable_mockModule('mongoose', () => ({
  default: {
    startSession: startSessionMock,
  },
}));

const { runInTransaction } = await import('../utils/transaction.js');

describe('transaction utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('runs work inside a transaction and closes the session', async () => {
    const endSessionMock = jest.fn().mockResolvedValue(undefined);
    const withTransactionMock = jest.fn(async (callback) => callback());
    startSessionMock.mockResolvedValue({
      withTransaction: withTransactionMock,
      endSession: endSessionMock,
    });

    const result = await runInTransaction(async (session) => {
      expect(session.endSession).toBe(endSessionMock);
      return 'done';
    });

    expect(withTransactionMock).toHaveBeenCalled();
    expect(endSessionMock).toHaveBeenCalled();
    expect(result).toBe('done');
  });

  it('translates replica-set transaction errors into an actionable message', async () => {
    const endSessionMock = jest.fn().mockResolvedValue(undefined);
    const withTransactionMock = jest.fn(async () => {
      throw new Error('Transaction numbers are only allowed on a replica set member or mongos');
    });
    startSessionMock.mockResolvedValue({
      withTransaction: withTransactionMock,
      endSession: endSessionMock,
    });

    await expect(runInTransaction(async () => 'never')).rejects.toThrow(
      'MongoDB transactions require a replica set enabled deployment.'
    );
    expect(endSessionMock).toHaveBeenCalled();
  });
});
