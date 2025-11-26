import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    ok: true,
    env: process.env.NODE_ENV || "dev",
    uptime: process.uptime(),
  });
});

export default router;
