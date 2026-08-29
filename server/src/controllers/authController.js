import jwt from "jsonwebtoken";
import { ENV } from "../lib/env.js";
import User from "../models/User.js";

function generateToken(userId) {
    return jwt.sign({userId}, ENV.JWT_SECRET, {expiresIn:"7d"});
}

export async function register(req,res){
   try{ const {email,password,name}=req.body;
    if(!email || !password || !name){
        return res.status(400).json({msg:"Please provide all required fields"});
    }
    if(password.length<8){
        return res.status(400).json({msg:"Password must be at least 8 characters long"});
    }
    const existingUser=await User.findOne({email});
    if(existingUser){
        return res.status(409).json({msg:"User with this email already exists"});
    }
    const user=new User({
        email,
        passwordHash:password,
        name
    });
    await user.save();
    const token=generateToken(user._id);
    res.status(201).json({token});}
    catch(err){
        console.error("Error in register:", err.message);
        res.status(500).json({msg:"Internal server error"});
    }
}

export async function login(req,res){
    try{
        const {email,password}=req.body;
        if(!email || !password){
            return res.status(400).json({msg:"Please provide email and password"});
        }
        const user=await User.findOne({email});
        if(!user){
            return res.status(404).json({msg:"User not found"});
        }
        const isMatch=await user.comparePassword(password);
        if(!isMatch){
            return res.status(401).json({msg:"Invalid credentials"});
        }
        const token=generateToken(user._id);
        res.status(200).json({token});
    }
    catch(err){
         console.error("Error in login:", err.message);
        res.status(500).json({msg:"Internal server error"});
    }
}