// Load environment variables as early as possible so modules that read
// process.env (like ./config/supabase.js) get the values.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from "multer";
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
//  RUTA DE SALUD SENCILLA
app.get('/health', (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'dev', uptime: process.uptime() });
});

//app.get('/', (req, res) => res.send('Servidor funcionando '));

const PORT = process.env.PORT || 3000;


app.listen(PORT, () => console.log(` Backend en http://localhost:${PORT}`));

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

    return res.json({ ok: true, message: 'Perfil guardado ', data: upserted });
  } catch (e) {
    console.error('[UPDATE PROFILE ERROR]', e);
    return res.status(500).json({ error: 'Error interno al guardar el perfil' });
  }
  
});


import { Buffer } from 'buffer';

// Subir avatar
app.post('/api/upload-avatar', async (req, res) => {
  try {
    const { userId, imageBase64 } = req.body;
    if (!userId || !imageBase64) return res.status(400).json({ error: "Faltan datos" });

    // Revisar si hay avatar previo
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    if (fetchError) return res.status(500).json({ error: fetchError.message });

    if (userData?.avatar_url) {
      // Extraer el nombre del archivo
      const oldFileName = userData.avatar_url.split("/").pop().split("?")[0];
      // Eliminar archivo anterior
      await supabaseAdmin.storage.from("profile-pictures").remove([oldFileName]);
    }

    // Subir la nueva imagen
    const buffer = Buffer.from(imageBase64, "base64");
    const fileName = `${userId}-${Date.now()}.png`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("profile-pictures")
      .upload(fileName, buffer, { upsert: true , contentType: "image/png",});

    if (uploadError) return res.status(500).json({ error: uploadError.message });

    // Obtener URL pública
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("profile-pictures")
      .getPublicUrl(fileName);

    // Actualizar usuario
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (updateError) return res.status(500).json({ error: updateError.message });

    res.json({ ok: true, avatar_url: publicUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error interno subiendo avatar" });
  }
});


// Eliminar avatar
app.post('/api/delete-avatar', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "Falta userId" });

    // Obtener el avatar actual
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("avatar_url")
      .eq("id", userId)
      .single();
    if (fetchError) return res.status(500).json({ error: fetchError.message });

    if (userData?.avatar_url) {
      const oldFileName = userData.avatar_url.split("/").pop().split("?")[0];
      await supabaseAdmin.storage.from("profile-pictures").remove([oldFileName]);
    }

    // Actualizar usuario
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (updateError) return res.status(500).json({ error: updateError.message });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error interno eliminando avatar" });
  }
});

app.get('/api/trips', async (req, res) => {
  try {
    // Obtener todos los viajes con usuario
    const { data: trips, error: tripsError } = await supabaseAdmin
      .from('trips')
      .select('*, users:user_id(id, username, display_name, user_color, avatar_url)')
      .eq('status', 'published');
    if (tripsError) return res.status(500).json({ error: tripsError.message });

    // Obtener todas las paradas de los viajes con país
    const { data: stops, error: stopsError } = await supabaseAdmin
      .from('trip_stops')
      .select('*, country:countries!trip_stops_country_id_fkey(id, name, latitude, longitude)');
    if (stopsError) return res.status(500).json({ error: stopsError.message });

    // Agrupar paradas por trip_id
    const stopsByTrip = {};
    stops.forEach(stop => {
      if (!stopsByTrip[stop.trip_id]) stopsByTrip[stop.trip_id] = [];
      stopsByTrip[stop.trip_id].push({
        country: stop.country?.name || '',
        city: stop.city,
        lat: stop.country?.latitude,
        lng: stop.country?.longitude,
        images: stop.images || []
      });
    });

    // Formatear los viajes como dummyTrips
    const tripsWithStops = trips.map(trip => ({
      id: trip.id,
      userId: trip.user_id,
      userName: trip.users?.display_name || trip.users?.username || '',
      userAvatar: trip.users?.avatar_url || null,
      userColor: trip.users?.user_color || 'rgba(192,192,192,1)',
      tripName: trip.trip_name,
      coverImage: trip.cover_image,
      stops: stopsByTrip[trip.id] || [],
      startDate: trip.start_date,
      endDate: trip.end_date,
      description: trip.description
    }));

    res.json({ ok: true, trips: tripsWithStops });
  } catch (e) {
    console.error('[GET TRIPS ERROR]', e);
    res.status(500).json({ error: 'Error interno obteniendo viajes' });
  }
});

app.get('/api/friends', async (req, res) => {
  try {
    const userId = req.query.userId; // lo puedes pasar por query si no usas auth directa
    if (!userId) return res.status(400).json({ error: 'Falta userId' });

    // 1️⃣ Buscar todas las relaciones donde el usuario sea user_id o friend_id
    const { data, error } = await supabaseAdmin
      .from('friends')
      .select(`
        id,
        user_id,
        friend_id,
        created_at,
        user:users!friends_user_id_fkey(id, username, display_name, user_color, avatar_url),
        friend:users!friends_friend_id_fkey(id, username, display_name, user_color, avatar_url)
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (error) return res.status(500).json({ error: error.message });

    // 2️⃣ Transformar los datos para que siempre devuelva "el otro usuario" como `friend`
    const formatted = data.map((row) => {
      const isSender = row.user_id === userId;
      const friendData = isSender ? row.friend : row.user;

      return {
        id: row.id,
        created_at: row.created_at,
        friend: {
          id: friendData?.id,
          username: friendData?.username,
          display_name: friendData?.display_name,
          user_color: friendData?.user_color,
          avatar_url: friendData?.avatar_url
        }
      };
    });

    return res.json({ ok: true, friends: formatted });
  } catch (e) {
    console.error('[GET FRIENDS ERROR]', e);
    res.status(500).json({ error: 'Error interno obteniendo amigos' });
  }
});

app.post('/api/add-friend', async (req, res) => {
  try {
    const { user_id, friend_id } = req.body
    if (!user_id || !friend_id)
      return res.status(400).json({ error: 'Faltan campos' })

    const { error } = await supabaseAdmin
      .from('friends')
      .insert([{ user_id, friend_id }])

    if (error) throw error

    return res.json({ ok: true })
  } catch (e) {
    console.error('[ADD FRIEND ERROR]', e)
    res.status(500).json({ error: e.message })
  }
})


// Obtener un viaje individual con paradas y comentarios
app.get('/api/trips/:id', async (req, res) => {
  try {
    const tripId = req.params.id;
    if (!tripId) return res.status(400).json({ ok: false, error: 'Falta el ID del viaje' });

    // 1️⃣ Viaje principal con datos del usuario
    const { data: trip, error: tripError } = await supabaseAdmin
      .from('trips')
      .select(`
        id,
        user_id,
        trip_name,
        description,
        cover_image,
        start_date,
        end_date,
        status,
        users:user_id(id, username, display_name, user_color)
      `)
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      return res.status(404).json({ ok: false, error: tripError?.message || 'Viaje no encontrado' });
    }

    // 2️⃣ Paradas del viaje
    const { data: stops, error: stopsError } = await supabaseAdmin
      .from('trip_stops')
      .select(`
        id,
        city,
        description,
        images,
        country:countries!trip_stops_country_id_fkey(id, name, latitude, longitude)
      `)
      .eq('trip_id', tripId);

    if (stopsError) {
      console.error('[STOPS ERROR]', stopsError);
      return res.status(500).json({ ok: false, error: 'Error obteniendo paradas' });
    }

    // 3️⃣ Comentarios
    const { data: comments, error: commentsError } = await supabaseAdmin
      .from('comments')
      .select('id, user, text, created_at')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (commentsError) {
      console.error('[COMMENTS ERROR]', commentsError);
    }

    // 4️⃣ Formatear datos finales
    const formattedStops = stops.map(stop => ({
      title: stop.city || 'Stop',
      city: stop.city,
      country: stop.country?.name || '',
      description: stop.description || '',
      images: stop.images || [],
      lat: stop.country?.latitude,
      lng: stop.country?.longitude,
      currentImageIndex: 0
    }));

    const fullTrip = {
      id: trip.id,
      trip_name: trip.trip_name,
      description: trip.description,
      cover_image: trip.cover_image,
      start_date: trip.start_date,
      end_date: trip.end_date,
      user: {
        id: trip.users?.id,
        username: trip.users?.username,
        display_name: trip.users?.display_name,
        color: trip.users?.user_color
      },
      stops: formattedStops,
      comments: comments || []
    };

    res.json({ ok: true, trip: fullTrip });
  } catch (e) {
    console.error('[GET TRIP BY ID ERROR]', e);
    res.status(500).json({ ok: false, error: 'Error interno obteniendo el viaje' });
  }
});

// Servir el frontend compilado (build de Vue/React)
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Cualquier ruta que no sea de API devolverá index.html
app.get('/*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});
