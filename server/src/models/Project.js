import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    websiteUrl: {
      type: String,
      required: true,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    apiKeyHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    capacity: {
      type: Number,
      required: true,
      default: 10,
      min: 1,
    },
    refillRate: {
      type: Number,
      required: true,
      default: 1,
      min: 0.1,
    },
    allowedCount: {
      type: Number,
      default: 0,
    },
    deniedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);


projectSchema.index({ ownerId: 1, name: 1 }, { unique: true });

const Project = mongoose.model("Project", projectSchema);
export default Project;