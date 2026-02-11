import bcrypt from 'bcrypt'
import User from '../Models/auth/signup.model.js'
import jwt from 'jsonwebtoken'
import transporter from '../config/nodemailer.js'
import crypto from "crypto";


export const signupController = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // check user exist or not
    const existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const saltRounds = 10;
    const hashPassword = await bcrypt.hash(password, saltRounds);

    
    // Generate OTP (6 digits)
    const otp = crypto.randomInt(100000, 999999).toString();
    // create new user
    const newUser = new User({
      name,
      email,
      password: hashPassword,
      verifyOtp:otp,
      verifyOtpExpireAt:Date.now() + 10 * 60 * 1000, // valid 10 mins
    });

    await newUser.save();


    // generate token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }   // ⬅️ match with cookie expiry
    );

    
    // set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000 // 1 hour
    });


    // sending  welcome email
    const mailOption=  {
      from: process.env.SMTP_USER,
      to:email ,
      subject:` welcome to nodemailer ${name}`,
      text:`Your OTP is ${otp}. It will expire in 10 minutes.`
    }
try{
  await transporter.sendMail(mailOption);

}catch(err) {
  console.error("Email sending failed:", err);
  // optional: log, but do not throw
}
    // send safe response (without password)
   return res.status(200).json({success:true, 
    message:"user signup successfully",
    name:name,
    token
  });

  } catch (error) {
    res.status(500).json({success:false,  message: "Server error", error });
  }
};

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // check exist or not
    const existUser = await User.findOne({ email });
    if (!existUser) {
      return res.status(400).json({success:false, message: "User does not exist. Please signup." });
    }

    // password check
    const isMatch = await bcrypt.compare(password, existUser.password);
    if (!isMatch) {
      return res.status(400).json({ success:false, message: "Incorrect password" });
    }

    // generate token
    const token = jwt.sign(
      { id: existUser._id, email: existUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000
    });

    res.status(200).json({
      success:true,
      message: "User login successful",
      user: { id: existUser._id, name: existUser.name, email: existUser.email },
      token
    });

  } catch (error) {
    res.status(500).json({success:false, message: "Server error" });
  }
};

export const logoutController = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });
    res.status(200).json({ success:true,message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({success:false, message: "Server error to you", error });
  }
};