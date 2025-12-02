import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

// ------------------------------------------------------
// Helper para verificar que el usuario pertenece a la amistad
// ------------------------------------------------------
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

// ------------------------------------------------------
// GET /messages/recent
// Últimos chats (para "Chats recientes")
// ------------------------------------------------------
router.get('/recents', async (req, res) => {
  try {
    const userId = req.query.userId;

    // Todas las amistades del usuario
    const { data: friendships, error: fError } = await supabaseAdmin
      .from('friends')
      .select(`
        id,
        user_id,
        friend_id,
        user:user_id (*),
        friend:friend_id (*)
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)

    if (fError) throw fError;

    if (!friendships.length) return res.json({ chats: [] });

    const friendshipIds = friendships.map(f => f.id);

    // Último mensaje de cada chat
    const { data: messages, error: mError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .in('friendship_id', friendshipIds)
      .order('created_at', { ascending: false });

    if (mError) throw mError;

    // Agrupar para quedarnos solo el último por amistad
    const lastPerFriendship = Object.values(
      messages.reduce((acc, msg) => {
        if (!acc[msg.friendship_id]) acc[msg.friendship_id] = msg;
        return acc;
      }, {})
    );

    // Combinar con datos del amigo
    const chats = lastPerFriendship.map(msg => {
      const fs = friendships.find(f => f.id === msg.friendship_id);

      const friendUser =
        fs.user_id === userId ? fs.friend : fs.user;

      return {
        friendship_id: fs.id,
        last_message: msg.content,
        created_at: msg.created_at,
        sender_id: msg.sender_id,
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

// ------------------------------------------------------
// GET /messages/:friendshipId
// Cargar historial de una conversación
// ------------------------------------------------------
router.get('/:friendshipId', async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.query.userId;

    // Validación de permisos
    const allowed = await validateFriendship(userId, friendshipId);
    if (!allowed) return res.status(403).json({ error: 'Acceso denegado' });

    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('friendship_id', friendshipId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ messages: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ------------------------------------------------------
// POST /messages/:friendshipId
// Enviar un mensaje
// ------------------------------------------------------
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
          content: message
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json({ message: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ------------------------------------------------------
// DELETE /messages/:id
// Eliminar un mensaje propio
// ------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.body;

    const { data: message, error: fetchError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (fetchError) throw fetchError;

    if (message.sender_id !== userId)
      return res.status(403).json({ error: 'No autorizado' });

    const { error: deleteError } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (deleteError) throw deleteError;

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
