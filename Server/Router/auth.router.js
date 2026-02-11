import express from 'express'
const route = express.Router();

import authMiddleware from '../middleware/authenticate.js'
import { signupController, loginController,logoutController } from '../Controller/auth-controller.js';
import { sendOtpController, verifyOtpController,otpVerifyController,forgotPasswordController,resendOtpController,resetPasswordController } from '../Controller/UserVerify-controller.js';

// ---------------- Signup ----------------
route.post('/signup', signupController);

// ---------------- Login ----------------
route.post("/login",loginController );

// ---------------- Logout ----------------
route.get('/logout',authMiddleware, logoutController);
route.post('/sendverifyOtp', sendOtpController);
route.post('/verify-otp',verifyOtpController);
route.post('/forgetpass',forgotPasswordController );
route.post('/otp-verify',otpVerifyController);
route.post("/reset-password",resendOtpController);
route.post("/resend-otp",resetPasswordController);

export default route;
