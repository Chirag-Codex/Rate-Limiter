import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../models/User.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLAN_CONFIG = {
  GOLD: { priceInINR: 499, maxProjects: 10 },
  PRO: { priceInINR: 1499, maxProjects: 25 },
};

export async function createOrder(req,res){
    try{
        const {plan}=req.body;
        if(!PLAN_CONFIG[plan]){
            return res.status(400).json({
                error:`Invalid Plan Selected. Choose GOLD or PRO`
            })
        }

        const amountInPaise=PLAN_CONFIG[plan].priceInINR*100;
        const optons={
            amount:amountInPaise,
            currency:"INR",
            receipt: `rcpt_${req.user._id}_${Date.now()}`,
            notes:{
                userId:req.user._id.toString(),
                plan:plan
            }
        };

        const order=await razorpay.orders.create(optons);

        res.status(200).json({
            orderId:order.id,
            amount:order.amount,
            currency:order.currency,
            keyId:process.env.RAZORPAY_KEY_ID,
            plan
            
        });
    }
    catch(err){
        console.error("Error creating Razorpay order:", err);
        res.status(500).json({ error: "Failed to create order" });
    }
}

export async function verifyPayment(req,res){
    try{
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
      return res.status(400).json({ error: "Missing payment verification parameters" });
    }
    const body=razorpay_order_id+"|"+razorpay_payment_id;
    const expectedSignature=crypto
    .createHmac("sha256",process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

    if(expectedSignature!==razorpay_signature){
        return res.status(400).json({error:"Invalid payment signature. Transaction may be tampered."});

    }
    const maxProjects=PLAN_CONFIG[plan].maxProjects;
    const expiryDate=new Date();
    expiryDate.setDate(expiryDate.getDate()+30);

    const updatedUser=await User.findByIdAndUpdate(req.user._id
        ,{
            plan:plan,
            maxProjects:maxProjects,
            subscriptionExpiresAt:expiryDate
        },
        {new:true}
    ).select("-passwordHash");
    res.status(200).json({
        success:true,
        message:`Successfully upgraded to ${plan} plan.`,
        user:updatedUser
    });
    
}
catch(err){
        console.error("Error verifying payment:", err);
        res.status(500).json({ error: "Failed to verify payment" });
    }
}