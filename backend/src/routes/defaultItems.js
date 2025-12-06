import express from "express";
import { ensureDefaultItems } from "./shop.js"; // <- OJO a la ruta relativa

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    await ensureDefaultItems(req.params.userId);
    res.json({ ok: true });
  } catch (err) {
    console.error("ensureDefaultItems error:", err);
    res.status(500).json({ ok: false });
  }
});

export default router;
