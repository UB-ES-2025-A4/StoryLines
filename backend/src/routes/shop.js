import express from 'express'
import { supabaseAdmin } from '../config/supabase.js'

const router = express.Router()

// GET /api/shop/items → devuelve TODOS los items de la tienda
router.get('/items', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('shop_items')
      .select('*')
      .order('price', { ascending: true })

    console.log("Supabase devolvió:", data)

    if (error) {
      console.error('Error supabase shop_items:', error)
      return res.status(500).json({ ok: false, error: 'Error loading items' })
    }

    const items = data.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      price: row.price,
      imageUrl: row.image_url,
      textureUrl: row.texture_url,
      isDefault: row.is_default,
      bgUrl: row.bg_url
    }))

    res.json({ ok: true, items })
  } catch (err) {
    console.error('Error GET /api/shop/items:', err)
    res.status(500).json({ ok: false, error: 'Internal server error' })
  }
})

// GET /api/shop/items/:id
router.get('/items/:id', async (req, res) => {
  const { id } = req.params

  try {
    const { data, error } = await supabaseAdmin
      .from('shop_items')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Error supabase shop_items by id:', error)
      return res.status(500).json({ ok: false, error: 'Error loading item' })
    }

    if (!data) {
      return res.status(404).json({ ok: false, error: 'Item not found' })
    }

    const item = {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      price: data.price,
      imageUrl: data.image_url,
      textureUrl: data.texture_url,
      bgUrl: data.bg_url,
      isDefault: data.is_default
    }

    res.json({ ok: true, item })
  } catch (err) {
    console.error('Error GET /api/shop/items/:id:', err)
    res.status(500).json({ ok: false, error: 'Internal server error' })
  }
})

export default router
