const express = require('express');
const cors = require('cors');

// Exponer la API de Web Crypto de Node
try {
  const nodeCrypto = require('crypto');
  if (!globalThis.crypto) {
    globalThis.crypto = nodeCrypto.webcrypto || nodeCrypto;
  }
} catch (err) {
  console.warn('No se pudo inicializar globalThis.crypto:', err.message);
}

const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  credentials: true
}));
app.use(express.json());

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend funcionando correctamente' });
});

// Importar rutas reales
const citasRoutes = require('./routes/citas');
const disponibilidadRoutes = require('./routes/disponibilidad');

// Usar rutas reales
app.use('/api', citasRoutes);
app.use('/api/disponibilidad', disponibilidadRoutes);

// Conexión a MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kiyoshirodriguez49:Kiyo2003@cursomodb.4ukrdsc.mongodb.net/';

mongoose.set('strictQuery', false);

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB');
    const PORT = process.env.PORT || 3003;
    app.listen(PORT, () => {
      console.log(`✅ Backend corriendo en http://localhost:${PORT}`);
      console.log(`📅 Modo: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch(err => {
    console.error('❌ Error conectando a MongoDB:', err.message);
    console.error('Asegúrate de que MongoDB está corriendo:');
    console.error('  - macOS: brew services start mongodb-community');
    console.error('  - Linux: sudo systemctl start mongod');
    console.error('  - Windows: net start MongoDB');
    process.exit(1);
  });