import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

/* ------------------------------------------------------
   Helper: verificar si el usuario pertenece a la amistad
------------------------------------------------------ */
async function validateFriendship(userId, friendshipId) {
  const { data, error } = await supabaseAdmin
    .from('friends')
    .select('*')
    .eq('id', friendshipId)
    .single();

  if (error) throw error;
  if (!data) return false;

  return data.user_id === userId || data.friend_id === userId;
}

/* ------------------------------------------------------
   Helper: obtener el ID del amigo en la amistad
------------------------------------------------------ */
async function getFriendId(friendshipId, userId) {
  const { data, error } = await supabaseAdmin
    .from("friends")
    .select("user_id, friend_id")
    .eq("id", friendshipId)
    .single();

  if (error) throw error;

  return data.user_id === userId ? data.friend_id : data.user_id;
}

/* ------------------------------------------------------
   GET /messages/recents
   Últimos chats + unreadCounts
------------------------------------------------------ */
router.get('/recents', async (req, res) => {
  try {
    const userId = req.query.userId;

    // Obtener amistades del usuario
    const { data: friendships, error: fError } = await supabaseAdmin
      .from('friends')
      .select(`
        id,
        user_id,
        friend_id,
        user:user_id (*),
        friend:friend_id (*)
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (fError) throw fError;
    if (!friendships.length) return res.json({ chats: [] });

    const friendshipIds = friendships.map(f => f.id);

    // Obtener mensajes ordenados por fecha
    const { data: messages, error: mError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .in('friendship_id', friendshipIds)
      .order('created_at', { ascending: false });

    if (mError) throw mError;

    // Mensajes no leídos
    const { data: unreadMessages } = await supabaseAdmin
      .from('messages')
      .select('friendship_id')
      .in('friendship_id', friendshipIds)
      .eq('status', 'sent')
      .neq('sender_id', userId);

    const unreadCounts = unreadMessages.reduce((acc, msg) => {
      acc[msg.friendship_id] = (acc[msg.friendship_id] || 0) + 1;
      return acc;
    }, {});

    // Solo el último mensaje por amistad
    const lastPerFriendship = Object.values(
      messages.reduce((acc, msg) => {
        if (!acc[msg.friendship_id]) acc[msg.friendship_id] = msg;
        return acc;
      }, {})
    );

    // Formateo final
    const chats = lastPerFriendship.map(msg => {
      const fs = friendships.find(f => f.id === msg.friendship_id);

      const friendUser =
        fs.user_id === userId ? fs.friend : fs.user;

      return {
        friendship_id: fs.id,
        last_message: msg.content,
        created_at: msg.created_at,
        sender_id: msg.sender_id,
        status: msg.status,
        unreadCounts: unreadCounts[msg.friendship_id] || 0,
        friend: {
          id: friendUser.id,
          username: friendUser.username,
          display_name: friendUser.display_name,
          avatar_url: friendUser.avatar_url
        }
      };
    });

    res.json({ chats });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ------------------------------------------------------
   GET /messages/:friendshipId
   Cargar historial + marcar como leídos
------------------------------------------------------ */
router.get('/:friendshipId', async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.query.userId;

    const allowed = await validateFriendship(userId, friendshipId);
    if (!allowed) return res.status(403).json({ error: 'Acceso denegado' });

    // ID del amigo
    const friendId = await getFriendId(friendshipId, userId);

    // Mensajes del chat
    const { data: messages, error: mError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('friendship_id', friendshipId)
      .order('created_at', { ascending: true });

    if (mError) throw mError;

    // Marcar como leídos los mensajes del amigo
    await supabaseAdmin
      .from('messages')
      .update({ status: 'read' })
      .eq('friendship_id', friendshipId)
      .eq('sender_id', friendId);

    res.json({ messages });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ------------------------------------------------------
   POST /messages/:friendshipId
   Enviar mensaje
------------------------------------------------------ */
router.post('/:friendshipId', async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const { message, senderId } = req.body;

    if (!message)
      return res.status(400).json({ error: 'Falta el mensaje' });

    const allowed = await validateFriendship(senderId, friendshipId);
    if (!allowed) return res.status(403).json({ error: 'Acceso denegado' });

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert([
        {
          friendship_id: friendshipId,
          sender_id: senderId,
          content: message,
          status: 'sent'
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json({ message: data[0] });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
