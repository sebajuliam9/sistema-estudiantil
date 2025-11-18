const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Configuración de la base de datos
// En tu proyecto está en backend/config/database.js
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3003;

// ================== MIDDLEWARE BÁSICO ==================
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ================== FRONTEND ESTÁTICO ==================
// server.js está en backend/ y el frontend está en ../frontend
const frontendPath = path.join(__dirname, '../frontend');

// Servir archivos estáticos del frontend (CSS, JS, imágenes, etc.)
app.use(express.static(frontendPath));

// ================== RUTAS PRINCIPALES API ==================
console.log('🔄 Cargando rutas...');

app.use('/api/auth', require('./routes/auth'));
app.use('/api/estudiantes', require('./routes/estudiantes'));
app.use('/api/materias', require('./routes/materias'));
app.use('/api/carreras', require('./routes/carreras'));
app.use('/api', require('./routes/analiticos'));

console.log('✅ Rutas esenciales cargadas');

// ================== RUTAS BACKUP DE CARRERAS ==================

app.get('/api/carreras-backup', async (req, res) => {
  try {
    console.log('📡 Solicitando carreras desde la base de datos...');
    const result = await db.query('SELECT * FROM carreras ORDER BY nombre');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('❌ Error al obtener carreras:', error);
    res.status(500).json({
      success: false,
      error: 'Error al conectar con la base de datos'
    });
  }
});

app.get('/api/carreras-backup/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM carreras WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Carrera no encontrada'
      });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('❌ Error al obtener carrera:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

app.post('/api/carreras-backup', async (req, res) => {
  try {
    const { resolucion, nombre, horas } = req.body;
    console.log('💾 Guardando carrera en la base de datos:', { resolucion, nombre, horas });

    const carreraExistente = await db.query(
      'SELECT id FROM carreras WHERE resolucion = $1',
      [resolucion]
    );
    if (carreraExistente.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe una carrera con esa resolución'
      });
    }

    const result = await db.query(
      'INSERT INTO carreras (resolucion, nombre, horas) VALUES ($1, $2, $3) RETURNING *',
      [resolucion, nombre, horas]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Carrera creada correctamente'
    });
  } catch (error) {
    console.error('❌ Error al crear carrera:', error);
    res.status(500).json({
      success: false,
      error: 'Error al guardar en la base de datos'
    });
  }
});

app.put('/api/carreras-backup/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolucion, nombre, horas } = req.body;

    const carreraExistente = await db.query(
      'SELECT id FROM carreras WHERE id = $1',
      [id]
    );
    if (carreraExistente.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Carrera no encontrada'
      });
    }

    const resolucionExistente = await db.query(
      'SELECT id FROM carreras WHERE resolucion = $1 AND id != $2',
      [resolucion, id]
    );
    if (resolucionExistente.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe otra carrera con esa resolución'
      });
    }

    const result = await db.query(
      `UPDATE carreras
       SET resolucion = $1, nombre = $2, horas = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [resolucion, nombre, horas, id]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Carrera actualizada correctamente'
    });
  } catch (error) {
    console.error('❌ Error al actualizar carrera:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

app.delete('/api/carreras-backup/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Eliminando carrera ID:', id);

    const carreraExistente = await db.query(
      'SELECT id FROM carreras WHERE id = $1',
      [id]
    );
    if (carreraExistente.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Carrera no encontrada'
      });
    }

    const estudiantesEnCarrera = await db.query(
      'SELECT id FROM estudiantes WHERE carrera_id = $1 LIMIT 1',
      [id]
    );
    if (estudiantesEnCarrera.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar la carrera porque tiene estudiantes asociados'
      });
    }

    const materiasEnCarrera = await db.query(
      'SELECT id FROM materias WHERE carrera_id = $1 LIMIT 1',
      [id]
    );
    if (materiasEnCarrera.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar la carrera porque tiene materias asociadas'
      });
    }

    await db.query('DELETE FROM carreras WHERE id = $1', [id]);
    res.json({
      success: true,
      message: 'Carrera eliminada correctamente'
    });
  } catch (error) {
    console.error('❌ Error al eliminar carrera:', error);

    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar la carrera porque tiene registros relacionados'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ================== BACKUP ESTUDIANTES / MATERIAS ==================

app.delete('/api/estudiantes-backup/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Eliminando estudiante ID:', id);

    const estudianteExistente = await db.query(
      'SELECT id FROM estudiantes WHERE id = $1',
      [id]
    );
    if (estudianteExistente.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Estudiante no encontrado'
      });
    }

    await db.query('DELETE FROM estudiantes WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Estudiante eliminado correctamente'
    });
  } catch (error) {
    console.error('❌ Error al eliminar estudiante:', error);

    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar el estudiante porque tiene registros relacionados'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

app.delete('/api/materias-backup/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Eliminando materia ID:', id);

    const materiaExistente = await db.query(
      'SELECT id FROM materias WHERE id = $1',
      [id]
    );
    if (materiaExistente.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Materia no encontrada'
      });
    }

    const calificacionesEnMateria = await db.query(
      'SELECT id FROM calificaciones WHERE materia_id = $1 LIMIT 1',
      [id]
    );
    if (calificacionesEnMateria.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar la materia porque tiene calificaciones asociadas'
      });
    }

    await db.query('DELETE FROM materias WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Materia eliminada correctamente'
    });
  } catch (error) {
    console.error('❌ Error al eliminar materia:', error);

    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar la materia porque tiene registros relacionados'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ================== HEALTHCHECK ==================

app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');

    res.json({
      success: true,
      message: 'Sistema y base de datos funcionando correctamente',
      database: 'Conectado a PostgreSQL',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Sistema funcionando pero sin conexión a base de datos',
      database: 'Desconectado',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ================== RUTAS FRONTEND ==================

// Ruta principal -> index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Cualquier ruta que no empiece con /api/ devuelve el frontend
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ================== INICIO DEL SERVIDOR ==================

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📚 Sistema Estudiantil IES N° 2 Humahuaca`);
  console.log(`🔑 Usa: admin / 1234`);

  setTimeout(async () => {
    try {
      await db.query('SELECT 1');
      console.log('✅ Conectado a PostgreSQL correctamente');
    } catch (error) {
      console.log('❌ Error conectando a PostgreSQL:', error.message);
    }
  }, 1000);
});
