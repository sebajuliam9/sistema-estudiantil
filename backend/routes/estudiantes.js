const express = require('express');
const router = express.Router();
const estudiantesController = require('../controllers/estudiantesController');

// Rutas existentes
router.get('/', estudiantesController.getAll);
router.get('/buscar/:dni', estudiantesController.buscarPorDNI);
router.get('/:id', estudiantesController.getById);
router.post('/', estudiantesController.create);
router.put('/:id', estudiantesController.update);
router.delete('/:id', estudiantesController.delete);
router.get('/:id/notas', estudiantesController.getNotas);
router.post('/:id/notas', estudiantesController.guardarNotas);


module.exports = router;