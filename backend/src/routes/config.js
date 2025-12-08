import { Router } from "express";

const router = Router();

router.get("/supabase", (req, res) => {
  console.log('Config requested:', {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY?.substring(0, 20) + '...'
  })
  res.json({
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY
  });
});

export default router;