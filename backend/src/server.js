import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
// ✅ RUTA DE SALUD SENCILLA
app.get('/health', (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'dev', uptime: process.uptime() });
});

app.get('/', (req, res) => res.send('Servidor funcionando ✅'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Backend en http://localhost:${PORT}`));

import { supabaseAdmin } from './config/supabase.js';

const isUUIDv4 = (s='') => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

app.post('/api/profile', async (req, res) => {
  try {
    const { userId, email, username, display_name, bio, avatar_url } = req.body ?? {};

    // 1) Resolver el id: si no viene userId, intenta por email
    let id = userId;

    if (!id) {
      if (!email) {
        return res.status(400).json({ error: 'Falta userId o email' });
      }

      // Buscar el usuario por email usando la Admin API
      // (Service Role Key necesaria; en dev suele ser suficiente con la 1ª página)
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 100 });
      if (error) return res.status(400).json({ error: error.message });

      const user = data.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(404).json({ error: `No existe un usuario con email ${email}` });
      }
      id = user.id;
    }

    // Validaciones mínimas
    if (!isUUIDv4(id)) return res.status(400).json({ error: 'userId no es un UUID v4 válido' });
    if (typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 15) {
      return res.status(400).json({ error: 'El nombre de usuario debe tener entre 3 y 15 caracteres' });
    }

    // Validar username → sin espacios, máximo 15 (sin mínimo)
    if (typeof display_name !== 'string' || display_name.trim().length > 15) {
      return res.status(400).json({ error: 'Apodo inválido (sin espacios y máx 15 caracteres)' });
    }
    if (typeof bio === 'string' && bio.trim().length > 151) {
      return res
        .status(400)
        .json({ error: 'La biografía no puede superar los 150 caracteres' });
    }
    const uname = String(username).trim();

    const { data: existing, error: existErr } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('username', uname)
    .neq('id', id)  // Excluye tu propio usuario
    .limit(1);

    if (existErr) {
    return res.status(400).json({ error: existErr.message });
    }

    if (existing && existing.length > 0) {
    return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso' });
    }
    // Construir payload SOLO con columnas reales de tu tabla public.users
    const payload = {
      id,                              // PK de tu fila de perfil
      username: String(username).trim(),
      updated_at: new Date().toISOString()
    };
    if (typeof display_name === 'string') payload.display_name = display_name.trim();
    if (typeof bio === 'string')          payload.bio          = bio.trim();
    if (typeof avatar_url === 'string')   payload.avatar_url   = avatar_url.trim();

    // Upsert por id: crea si no existe, actualiza si existe
    const { data: upserted, error: upErr } = await supabaseAdmin
      .from('users')
      .upsert(payload, { onConflict: 'id' })
      .select('id, username, display_name, bio, avatar_url');

    if (upErr) return res.status(400).json({ error: upErr.message });

    return res.json({ ok: true, message: 'Perfil guardado ✅', data: upserted });
  } catch (e) {
    console.error('[UPDATE PROFILE ERROR]', e);
    return res.status(500).json({ error: 'Error interno al guardar el perfil' });
  }
  
});