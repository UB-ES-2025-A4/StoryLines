import { supabaseAdmin } from '../config/supabase.js';

/**
 * Busca usuarios por username con priorización de amigos
 * @param {string} query - Query de búsqueda
 * @param {string} currentUserId - ID del usuario actual
 * @returns {Promise<Array>} Array de usuarios encontrados
 */
export async function searchUsers(query, currentUserId) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchPattern = `${query.toLowerCase()}%`;

  // 1. Obtener IDs de amigos aceptados del usuario actual (en ambas direcciones)
  const { data: friendsData, error: friendsError } = await supabaseAdmin
    .from('friends')
    .select('user_id, friend_id')
    .eq('status', 'accepted')
    .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

  if (friendsError) {
    throw new Error(`Error obteniendo amigos: ${friendsError.message}`);
  }

  // Extraer IDs de amigos (el que no sea currentUserId)
  const friendIds = friendsData.map(f => 
    f.user_id === currentUserId ? f.friend_id : f.user_id
  );

  // 2. Buscar usuarios que coincidan con el query
  const { data: usersData, error: usersError } = await supabaseAdmin
    .from('users')
    .select('id, username, display_name, avatar_url')
    .ilike('username', searchPattern)
    .neq('id', currentUserId) // Excluir al usuario actual
    .order('username', { ascending: true })
    .limit(50); // Límite temporal mayor para filtrar después

  if (usersError) {
    throw new Error(`Error buscando usuarios: ${usersError.message}`);
  }

  // 3. Separar amigos y desconocidos
  const friends = [];
  const strangers = [];

  usersData.forEach(user => {
    if (friendIds.includes(user.id)) {
      friends.push({ ...user, isFriend: true });
    } else {
      strangers.push({ ...user, isFriend: false });
    }
  });

  // 4. Combinar y limitar a 10
  const results = [...friends, ...strangers].slice(0, 10);

  return results;
}

/**
 * Obtiene el estado de amistad entre dos usuarios
 * @param {string} userId - ID del usuario actual
 * @param {string} targetUserId - ID del usuario objetivo
 * @returns {Promise<string>} Status: 'friends', 'pending_sent', 'pending_received', 'none'
 */
export async function getFriendshipStatus(userId, targetUserId) {
  // Buscar relación en ambas direcciones
  const { data, error } = await supabaseAdmin
    .from('friends')
    .select('user_id, friend_id, status')
    .or(`and(user_id.eq.${userId},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${userId})`);

  if (error) {
    throw new Error(`Error obteniendo estado de amistad: ${error.message}`);
  }

  if (data.length === 0) {
    return 'none';
  }

  const relation = data[0];

  if (relation.status === 'accepted') {
    return 'friends';
  }

  if (relation.status === 'pending') {
    // Determinar quién envió la solicitud
    if (relation.user_id === userId) {
      return 'pending_sent';
    } else {
      return 'pending_received';
    }
  }

  return 'none';
}