const express = require('express');
const router = express.Router();
const materiasController = require('../controllers/materiasController');

router.get('/', materiasController.getAll);
router.get('/carrera/:carreraId', materiasController.getByCarrera);
router.get('/:id', materiasController.getById);
router.post('/', materiasController.create);
router.put('/:id', materiasController.update);
router.delete('/:id', materiasController.delete);

module.exports = router;