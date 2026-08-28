import mongoose from "mongoose";

const bucketSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tokens: {
      type: Number,
      required: true,
      default: 0,
    },
    lastRefill: {
      type: Number,
      required: true,
      default: () => Date.now(),
    },
    capacity: {
      type: Number,
      required: true,
      default: 10,
    },
    refillRate: {
      type: Number,
      required: true,
      default: 1, 
    },
    lastRequestAllowed: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, 
  }
);

const Bucket = mongoose.model("Bucket", bucketSchema);

export default Bucket;