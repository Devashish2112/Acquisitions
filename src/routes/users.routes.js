import express from "express";
import { fetchAllUsers, getUserById, updateUser, deleteUser } from "../controller/users.controller.js";
import { authenticateToken, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", fetchAllUsers);
router.get("/:id", getUserById);
router.put("/:id", authenticateToken, updateUser);
router.delete("/:id", authenticateToken, requireRole(['admin']), deleteUser);

export default router;