import { Router } from "express";
import Message from "../models/message_model.js";

const router = Router();

// GET /api/v1/messages/:room - recent messages for a room
router.get("/:room", async (req, res) => {
    try {
        const { room } = req.params;
        const messages = await Message.find({ room }).sort({ createdAt: 1 }).limit(200).lean();
        res.json({ ok: true, messages });
    } catch (error) {
        console.error("Failed to fetch messages:", error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

export default router;
