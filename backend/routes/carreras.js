// routes/carrerasRoutes.js
const express = require('express');
const router = express.Router();
const carrerasController = require('../controllers/carrerasController');

// Rutas para carreras
router.get('/', carrerasController.getAll);
router.get('/:id', carrerasController.getById);
router.post('/', carrerasController.create);
router.put('/:id', carrerasController.update);
router.delete('/:id', carrerasController.delete);
router.get('/:id/estadisticas', carrerasController.getEstadisticas);

module.exports = router;