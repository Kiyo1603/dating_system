const express = require('express');
const router = express.Router();
const disponibilidadService = require('../services/disponibilidadService');

// Obtener fechas disponibles para un tipo de audiencia
router.get('/:tipo', async (req, res) => {
  try {
    const { tipo } = req.params;
    console.log(`📅 Consultando disponibilidad para: ${tipo}`);
    
    const fechas = await disponibilidadService.obtenerProximasFechas(tipo, 14);
    console.log(`✅ Encontradas ${fechas.length} fechas para ${tipo}`);
    
    res.json(fechas);
  } catch (error) {
    console.error('Error en disponibilidad:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verificar disponibilidad para un día específico
router.get('/dia/:tipo/:fecha', async (req, res) => {
  try {
    const { tipo, fecha } = req.params;
    console.log(`🔍 Verificando disponibilidad para ${tipo} en fecha ${fecha}`);
    
    const disponibilidad = await disponibilidadService.verificarDisponibilidad(new Date(fecha), tipo);
    res.json(disponibilidad);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;