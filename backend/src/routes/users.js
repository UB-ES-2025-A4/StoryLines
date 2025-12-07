import express from 'express';
import { deleteUserById } from '../services/userService.js';

const router = express.Router();

// Ruta para eliminar un usuario por ID
router.delete('/:id', async (req, res) => {

  const userId = req.params.id;
    try {
        const result = await deleteUserById(userId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;