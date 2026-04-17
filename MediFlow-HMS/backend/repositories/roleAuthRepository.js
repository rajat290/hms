const createRoleAuthRepository = (model) => ({
    findByEmail: (email) => model.findOne({ email }),
    findById: (accountId) => model.findById(accountId),
    findByVerificationToken: (token) => model.findOne({ verificationToken: token }),
    findByResetOtpEmail: (email) => model.findOne({ email }),
    findByResetToken: (token) => model.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: Date.now() },
    }),
});

export { createRoleAuthRepository };
