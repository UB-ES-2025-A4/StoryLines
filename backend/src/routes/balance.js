// backend/src/routes/balance.js
import express from 'express'
import { supabaseAdmin } from '../config/supabase.js'

const router = express.Router()

// Helper: asegura que el usuario tenga fila en user_balance
async function ensureBalanceRow(userId) {
  // 1) buscamos si ya existe
  const { data, error } = await supabaseAdmin
    .from('user_balance')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (data) return data

  // 2) si no existe, la creamos con el default (5000)
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('user_balance')
    .insert({ user_id: userId })
    .select('*')
    .single()

  if (insertError) throw insertError
  return inserted
}

/* ============================================
   GET /api/balance/:userId  → ver saldo
============================================ */
router.get('/:userId', async (req, res) => {
  const { userId } = req.params

  try {
    const row = await ensureBalanceRow(userId)
    return res.json({ ok: true, balance: row.balance })
  } catch (err) {
    console.error('Error GET /api/balance/:userId', err)
    return res.status(500).json({ ok: false, error: 'Error loading balance' })
  }
})

/* ============================================
   POST /api/balance/add  → recargar saldo
   body: { userId, amount }
============================================ */
router.post('/add', async (req, res) => {
  let { userId, amount } = req.body

  amount = Number(amount)

  if (!userId || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ ok: false, error: 'Datos inválidos' })
  }

  try {
    const row = await ensureBalanceRow(userId)
    const newBalance = row.balance + amount

    const { data, error } = await supabaseAdmin
      .from('user_balance')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select('balance')
      .single()

    if (error) throw error

    return res.json({ ok: true, balance: data.balance })
  } catch (err) {
    console.error('Error POST /api/balance/add', err)
    return res.status(500).json({ ok: false, error: 'Error updating balance' })
  }
})

/* ============================================
   POST /api/balance/deduct  → restar saldo
   body: { userId, amount }
============================================ */
router.post('/deduct', async (req, res) => {
  let { userId, amount } = req.body

  amount = Number(amount)

  if (!userId || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ ok: false, error: 'Datos inválidos' })
  }

  try {
    const row = await ensureBalanceRow(userId)

    if (row.balance < amount) {
      return res
        .status(400)
        .json({ ok: false, error: 'Balance insuficiente', balance: row.balance })
    }

    const newBalance = row.balance - amount

    const { data, error } = await supabaseAdmin
      .from('user_balance')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select('balance')
      .single()

    if (error) throw error

    return res.json({ ok: true, balance: data.balance })
  } catch (err) {
    console.error('Error POST /api/balance/deduct', err)
    return res.status(500).json({ ok: false, error: 'Error updating balance' })
  }
})

export default router
