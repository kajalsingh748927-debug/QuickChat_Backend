import { request } from 'express';
import mongoose from 'mongoose';
import { type } from 'os';

const signupSchema= new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    verifyOtp:{type:String, default:''},
    isAccountVerified:{
        type:Boolean,
        default:false
    },
    verifyOtpExpireAt:{type:Number, default:0},
},{timestamps:true})

const User=    mongoose.model("User",signupSchema);
export default User;