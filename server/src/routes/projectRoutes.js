import express from "express";
import {
  createProject,
  getProjects,
  deleteProject,
  getProjectById,
} from "../controllers/projectController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.use(protectRoute);

router.post("/", createProject);
router.get("/", getProjects);
router.delete("/:id", deleteProject);
router.get("/:id", protectRoute, getProjectById);
export default router;