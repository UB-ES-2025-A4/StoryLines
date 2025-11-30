import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

// Obtener todos los items comprados del usuario
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  const { data, error } = await supabaseAdmin
    .from("user_items")
    .select("item_id")
    .eq("user_id", userId);

  if (error) return res.status(500).json({ ok: false, error: error.message });

  return res.json({ ok: true, items: data.map(x => x.item_id) });
});

// Comprar un item
router.post("/buy", async (req, res) => {
  const { userId, itemId } = req.body;

  // 1. Comprobar si existe ya en user_items
  const { data: existing } = await supabaseAdmin
    .from("user_items")
    .select("*")
    .eq("user_id", userId)
    .eq("item_id", itemId)
    .maybeSingle();

  if (existing) {
    return res.json({ ok: false, error: "Item ya comprado" });
  }

  // 2. Obtener info del item
  const { data: item, error: itemErr } = await supabaseAdmin
    .from("shop_items")
    .select("*")
    .eq("id", itemId)
    .single();

  if (itemErr || !item) {
    return res.status(404).json({ ok: false, error: "Item no encontrado" });
  }

  // 3. Obtener balance
  const { data: bal, error: balErr } = await supabaseAdmin
    .from("user_balance")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (balErr || !bal) {
    return res.status(400).json({ ok: false, error: "Balance no encontrado" });
  }

  if (bal.balance < item.price) {
    return res.json({ ok: false, error: "Saldo insuficiente" });
  }

  // 4. Restar saldo
  await supabaseAdmin
    .from("user_balance")
    .update({ balance: bal.balance - item.price })
    .eq("user_id", userId);

  // 5. Insertar compra
  await supabaseAdmin
    .from("user_items")
    .insert({ user_id: userId, item_id: itemId });

  return res.json({ ok: true, message: "Compra realizada", item });
});

export default router;
