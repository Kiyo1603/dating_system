const express = require('express');
const router = express.Router();
const citasController = require('../controllers/citasController');

// Rutas de disponibilidad
router.get('/disponibilidad/:tipo', citasController.verDisponibilidad);
router.get('/disponibilidad/dia/:tipo/:fecha', citasController.verDisponibilidadDia);

// CRUD de citas
router.post('/citas', citasController.crearCita);
router.put('/citas/:id/confirmar', citasController.confirmarCita);
router.post('/citas/:id/atender', citasController.atenderCita);
router.delete('/citas/:id/cancelar', citasController.cancelarCita);

// Consultas
router.get('/estadisticas', citasController.obtenerEstadisticas);
router.get('/citas/hoy', citasController.obtenerCitasHoy);
router.get('/citas/fecha/:fecha', citasController.obtenerCitasPorFecha);

// Expedientes - IMPORTANTE: El orden importa, las rutas más específicas van primero
router.get('/expediente/folio/:folio', citasController.obtenerExpedientePorFolio);  // ← Esta debe ir ANTES
router.get('/expediente/:identificador', citasController.obtenerExpediente);
router.get('/expedientes/buscar', citasController.buscarExpedientes);

// Todas las citas
router.get('/citas/todas', citasController.obtenerTodasCitas);

module.exports = router;