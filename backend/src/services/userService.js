import { supabaseAdmin } from '../config/supabase.js';

export const deleteUserById = async (userId) => {
    
    const { error: dbError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

    if (dbError) {
        return { success: false, message: `Error deleting user from database: ${dbError.message}` };
    }
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
        return { success: false, message: `Error deleting user from auth: ${authError.message}` };
    }

    return { success: true, message: "User deleted successfully" };
};