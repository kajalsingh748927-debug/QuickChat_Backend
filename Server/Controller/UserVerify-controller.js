import bcrypt from 'bcrypt'
import User from '../Models/auth/signup.model.js'
import jwt from 'jsonwebtoken'
import transporter from '../config/nodemailer.js'
import crypto from "crypto";

export const sendOtpController = async(req, res)=>{
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
};

export const verifyOtpController= async(req, res)=>{
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
};

export const forgotPasswordController= async(req, res)=>{
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
};

export const otpVerifyController= async(req, res)=>{
  try{
    const {email,otp}= req.body;
    const user= await User.findOne({email});
    if(!user){return  res.status(404).json({ message: "User not found" })};
    if(user.verifyOtp !==otp || user.verifyOtpExpireAt <Date.now()){
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }


    res.json({success:true, message: "Account verified successfully" });
  }catch (error) {
    console.error(error);
    res.status(500).json({success:false ,message: "OTP verification failed" });
  }
};


export const resetPasswordController= async(req,res)=>{
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

};
export const resendOtpController=async(req, res)=>{
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

};