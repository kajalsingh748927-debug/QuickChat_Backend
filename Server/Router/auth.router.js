import express from 'express'
const route = express.Router();

import bcrypt from 'bcrypt'
import User from '../Models/auth/signup.model.js'
import jwt from 'jsonwebtoken'
import transporter from '../config/nodemailer.js'
import crypto from "crypto";
import authMiddleware from '../middleware/authenticate.js'

// ---------------- Signup ----------------
route.post('/signup', async (req, res) => {
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
});

// ---------------- Login ----------------
route.post("/login", async (req, res) => {
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
});

// ---------------- Logout ----------------
route.get('/logout',authMiddleware, (req, res) => {
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
});

route.post('/sendverifyOtp', async(req, res)=>{
  try{
    const {userId}= req.body;
    const user = await User.findById(userId);

    if(user.isAccountVerified){
      return res.json({success:false, message:"account is alredy verifed"})
    }

const otp=String(Math.floor(100000+Math.random()*900000));///6 digit random number

user.verifyOtp= otp;
user.verifyOtpExpireAt= Date.now()+24*60*60*1000;
await user.save();

// sending  welcome email
    const mailOption=  {
      from: process.env.SMTP_USER,
      to:user.email ,
      subject:"Account verification Otp",
      text:` your otp is ${otp}welcome to greatstack website your id ${email}`
    }

    await transporter.sendMail(mailOption);

    res.json({success:true, message:"varificaion otp ssent on email"});

  }catch(error){
res.json({secess:false, message: error.message})
  }
})

route.post('/verify-otp',async(req, res)=>{
  try{
    const {email,otp}= req.body;
    const user= await User.findOne({email});
    if(!user){return  res.status(404).json({ message: "User not found" })};


    if(!user.isAccountVerified){
      return res.status(400).json({ message: "Account already verified" });
    }
    //
    //check otp expire

    if(user.verifyOtp !==otp || user.verifyOtpExpireAt <Date.now()){
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    //Update verification status 
    user.isAccountVerified=true;
    user.verifyOtp="";
    user.verifyOtpExpireAt=0;
    await user.save();
    res.json({ message: "Account verified successfully" });
  }catch (error) {
    console.error(error);
    res.status(500).json({ message: "OTP verification failed" });
  }
})


route.post('/forgetpass', async(req, res)=>{
  try{


  const {email}= req.body;
  const user= await User.findOne({email});

  //check user
  if(!user){
    return res.json({success:false, message:"user not exist "});
  }

 
    
    // Generate OTP (6 digits)
    const otp = crypto.randomInt(100000, 999999).toString();
    
    user.verifyOtp=otp;
    user.verifyOtpExpireAt=Date.now()+10*60*1000; //10 min
    // user.verifyOtp=otp;
      // user.verifyOtpExpireAt=Date.now() + 10 * 60 * 1000 ;// valid 10 mins
  await user.save();
    // generate token
    const token = jwt.sign(
      { id: user._id, email: user.email },
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
const mailOption=  {
      from: process.env.SMTP_USER,
      to:email ,
      subject:` welcome to nodemailer ${user.name}`,
      text:`Your OTP is ${otp}. It will expire in 10 minutes.`
    }

    await transporter.sendMail(mailOption);
     res.status(200).json({ 
      success: true,
       message: "OTP SEND SUCCESFULLY",
       user:{id:user._id, name:user.name, email:user.email}
       });
} catch (err) {
    res.status(500).json({ message: err.message });
  }
})
route.post('/otp-verify',async(req, res)=>{
  try{
    const {email,otp}= req.body;
    const user= await User.findOne({email});
    if(!user){return  res.status(404).json({ message: "User not found" })};


   
    //
    //check otp expire

    if(user.verifyOtp !==otp || user.verifyOtpExpireAt <Date.now()){
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }


    res.json({success:true, message: "Account verified successfully" });
  }catch (error) {
    console.error(error);
    res.status(500).json({success:false ,message: "OTP verification failed" });
  }
})

route.post("/reset-password",async(req,res)=>{
  try{
      const {email,  newpassword }=req.body;
  const user= await User.findOne({email});
  if (!user) return res.status(400).json({ message: "User not found" });

  //hash passs
  const hashpass=await bcrypt.hash(newpassword,10);
  user.password=hashpass;

  user.verifyOtp="";
  user.verifyOtpExpireAt=0;

  await user.save();
   res.status(200).json({ success: true, message: "Password change successful" });
} catch (err) {
    res.status(500).json({success:false, message: err.message||"Server error" });
  }

})

route.post("/resend-otp",async(req, res)=>{
  const {email} = req.body;

  const user= await User.findOne({email});
  if(!user){
    return res.json({success:false, message:"email not regestered"});
  }
  if(!user.isAccountVerified){
return res.json({success:false, message:"error"});
  }
  // ✅ Optional check: agar purana OTP abhi valid hai to wait karne ka message de sakte ho
    if (user.verifyOtpExpireAt > Date.now()) {
      return res.status(400).json({ message: "Please wait, OTP already sent. Try again later." });
    }

const otp = crypto.randomInt(100000, 999999).toString();

user.verifyOtp=otp;
user.verifyOtpExpireAt=Date.now + 10*60*1000; 
await user.save();

const mailOption=  {
      from: process.env.SMTP_USER,
      to:email ,
      subject:` welcome to nodemailer ${user.name}`,
      text:`Your OTP is ${otp}. It will expire in 10 minutes.`
    }

    await transporter.sendMail(mailOption);
     res.json({ success: true, message: "OTP SEND SUCCESFULLY" });

})
export default route;
