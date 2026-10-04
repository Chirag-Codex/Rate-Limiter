import crypto from "crypto";
import mongoose from "mongoose";
import Project from "../models/Project.js";
import Bucket from "../models/Bucket.js";
import User from "../models/User.js";

function generateApiKey() {
  return crypto.randomBytes(32).toString("hex");
}

function hashApiKey(apiKey) {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

export async function createProject(req, res) {
  try {
    const { name, websiteUrl, capacity, refillRate } = req.body;
    const user =await User.findById(req.user._id);
    const existingProjectsCount = await Project.countDocuments({ ownerId: req.user._id });

    if(existingProjectsCount>=user.maxProjects){
      return res.status(403).json({
        error:`Project Limit Reached`,
        msg:`Your ${user.plan} plan allows up to ${user.maxProjects} projects.
        Please upgrade your plan to create more projects.`,
        currentCount:existingProjectsCount,
        maxProjects:user.maxProjects,
        plan:user.plan
      })
    }
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Project name is required and must be a non-empty string" });
    }
      if (!websiteUrl || typeof websiteUrl !== "string" || websiteUrl.trim().length === 0) {
      return res.status(400).json({ error: "websiteUrl is required and must be a non-empty string" });
    }
    if (capacity !== undefined) {
      if (typeof capacity !== "number" || !Number.isFinite(capacity) || capacity < 1) {
        return res.status(400).json({ error: "Capacity must be a valid number greater than or equal to 1" });
      }
    }
     if (refillRate !== undefined) {
      if (typeof refillRate !== "number" || !Number.isFinite(refillRate) || refillRate <= 0) {
        return res.status(400).json({ error: "Refill rate must be a valid number greater than 0" });
      }
    }
    const rawKey = generateApiKey();
    const hashedKey = hashApiKey(rawKey);

    const project = new Project({
      name:name.trim(),
      websiteUrl:websiteUrl.trim(),
      ownerId: req.user._id,
      apiKeyHash: hashedKey,
      capacity: capacity !== undefined ? capacity : 10,
      refillRate: refillRate !== undefined ? refillRate : 1,
    });
    await project.save();
    res.status(201).json({
      project: {
        id: project._id,
        name: project.name,
        websiteUrl: project.websiteUrl,
        capacity: project.capacity,
        refillRate: project.refillRate,
      },
      apiKey: rawKey,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "You already have a project with this name" });
    }
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getProjects(req, res) {
  try {
    const projects = await Project.find({ ownerId: req.user._id }).select(
      "-apiKeyHash"
    );
    res.status(200).json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteProject(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid project ID" });
    }
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    if (!project.ownerId.equals(req.user._id)) {
      return res.status(403).json({ error: "You do not have permission to delete this project" });
    }
    await project.deleteOne();
    await Bucket.deleteMany({ clientId: new RegExp(`^${project._id}:`) });
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getProjectById(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: "Invalid project ID" });
    }
    const project = await Project.findById(req.params.id).select("-apiKeyHash");

    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }

    if (!project.ownerId.equals(req.user._id)) {
      return res.status(403).json({ msg: "Not authorized to view this project" });
    }

    res.status(200).json({ project });
  } catch (err) {
    console.error("Error in getProjectById:", err.message);
    res.status(500).json({ msg: "Internal server error" });
  }
}