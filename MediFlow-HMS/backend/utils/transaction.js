import mongoose from 'mongoose';

const TRANSACTION_OPTIONS = {
  readConcern: { level: 'snapshot' },
  writeConcern: { w: 'majority' },
};

const runInTransaction = async (work) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      result = await work(session);
    }, TRANSACTION_OPTIONS);

    return result;
  } catch (error) {
    if (/Transaction numbers are only allowed/.test(error.message)) {
      error.message = 'MongoDB transactions require a replica set enabled deployment.';
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

export { runInTransaction };
