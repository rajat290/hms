import userModel from '../models/userModel.js';

const createUser = async (userData) => {
    const user = new userModel(userData);
    return user.save();
};

const findUserByEmail = (email) => userModel.findOne({ email });
const findUserById = (userId) => userModel.findById(userId);
const findUserByVerificationToken = (token) => userModel.findOne({ verificationToken: token });
const findUserByResetToken = (token) => userModel.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
const findUserByResetOtpEmail = (email) => userModel.findOne({ email });

export {
    createUser,
    findUserByEmail,
    findUserById,
    findUserByResetOtpEmail,
    findUserByResetToken,
    findUserByVerificationToken,
};
