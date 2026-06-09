const Cita = require('../models/Cita');
const Expediente = require('../models/Expediente');
const disponibilidadService = require('../services/disponibilidadService');
const notificacionService = require('../services/notificacionService');

exports.verDisponibilidad = async (req, res) => {
  try {
    const { tipo } = req.params;
    const fechas = await disponibilidadService.obtenerProximasFechas(tipo);
    res.json(fechas);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.verDisponibilidadDia = async (req, res) => {
  try {
    const { tipo, fecha } = req.params;
    const disponibilidad = await disponibilidadService.verificarDisponibilidad(new Date(fecha), tipo);
    res.json(disponibilidad);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.crearCita = async (req, res) => {
  try {
    const citaData = req.body;
    console.log('📥 Crear cita - payload recibido:', JSON.stringify(citaData));
    const fechaCita = new Date(citaData.fecha);
    
    // Verificar disponibilidad
    const disponibilidad = await disponibilidadService.verificarDisponibilidad(fechaCita, citaData.tipoAudiencia);
    
    if (!disponibilidad.disponible) {
      return res.status(400).json({ 
        error: 'No hay disponibilidad para esta fecha',
        mensaje: disponibilidad.mensaje
      });
    }
    
    if (!disponibilidad.slots.includes(citaData.horaInicio)) {
      return res.status(400).json({ 
        error: 'El horario seleccionado no está disponible' 
      });
    }
    
    // Calcular hora fin (30 minutos después)
    const [hora, minuto] = citaData.horaInicio.split(':').map(Number);
    let horaFin = hora;
    let minutoFin = minuto + 30;
    if (minutoFin >= 60) {
      horaFin++;
      minutoFin = 0;
    }
    citaData.horaFin = `${String(horaFin).padStart(2, '0')}:${String(minutoFin).padStart(2, '0')}`;
    citaData.lugarAtencion = disponibilidad.lugares?.[0] || 'Ayuntamiento de Pueblo Nuevo Solistahuacán';
    
    // Crear la cita
    const cita = new Cita(citaData);
    await cita.save();
    
    // Crear o actualizar expediente
    let identificador = '';
    let tipoExpediente = '';
    
    switch(citaData.tipoAudiencia) {
      case 'localidad':
        identificador = citaData.comunidad || citaData.nombre;
        tipoExpediente = 'comunidad';
        break;
      case 'empresa':
        identificador = citaData.empresa?.nombre || citaData.nombre;
        tipoExpediente = 'empresa';
        break;
      case 'autoridad':
        identificador = citaData.organizacion || citaData.nombre;
        tipoExpediente = 'autoridad';
        break;
      default:
        identificador = citaData.nombre;
        tipoExpediente = 'persona';
    }
    
    let expediente = await Expediente.findOne({ identificador });
    
    if (!expediente) {
      expediente = new Expediente({
        tipo: tipoExpediente,
        identificador,
        nombreContacto: citaData.nombre,
        telefonoPrincipal: citaData.telefono,
        correoPrincipal: citaData.correo,
        comunidad: citaData.comunidad,
        cargo: citaData.cargo,
        organizacion: citaData.organizacion,
        empresa: citaData.empresa
      });
    }
    
    expediente.citas.push({
      citaId: cita._id,
      folio: cita.folio,
      fecha: cita.fecha,
      motivo: cita.motivo,
      resuelto: false
    });
    
    expediente.totalCitas++;
    expediente.citasPendientes++;
    expediente.ultimaCita = new Date();
    await expediente.save();
    
    cita.expedienteId = expediente._id;
    await cita.save();
    
    // Enviar notificaciones
    await notificacionService.notificarSolicitudCita(cita);
    
    res.status(201).json({
      success: true,
      mensaje: 'Cita solicitada exitosamente',
      cita: {
        folio: cita.folio,
        fecha: cita.fecha,
        hora: cita.horaInicio,
        lugar: cita.lugarAtencion
      }
    });
    
  } catch (error) {
    console.error('Error al crear cita:', error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Función confirmarCita (CORRECTA - con soporte para folio)
// En backend/controllers/citasController.js - confirmarCita
exports.confirmarCita = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📝 Confirmando cita: ${id}`);
    
    const esObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    let cita;
    
    if (esObjectId) {
      cita = await Cita.findById(id);
    } else {
      cita = await Cita.findOne({ folio: id });
    }
    
    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    cita.estado = 'confirmada';
    cita.fechaConfirmacion = new Date();
    await cita.save();
    
    // ✅ IMPORTANTE: Enviar notificación de confirmación
    console.log(`📧 Enviando email de confirmación a: ${cita.correo}`);
    await notificacionService.notificarConfirmacionCita(cita);
    
    console.log(`✅ Cita confirmada: ${cita.folio}`);
    
    res.json({
      success: true,
      mensaje: 'Cita confirmada exitosamente',
      cita
    });
    
  } catch (error) {
    console.error('❌ Error en confirmarCita:', error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Función atenderCita (CORRECTA - con soporte para folio)
exports.atenderCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { resuelto, motivoNoResolucion, observaciones } = req.body;
    
    console.log(`📝 Atendiendo cita: ${id}`);
    
    const esObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    let cita;
    
    if (esObjectId) {
      cita = await Cita.findById(id);
    } else {
      cita = await Cita.findOne({ folio: id });
    }
    
    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    cita.estado = resuelto ? 'atendida' : 'no_resuelta';
    cita.resolucion = {
      resuelto: resuelto,
      motivoNoResolucion: motivoNoResolucion || '',
      fechaAtencion: new Date(),
      observaciones: observaciones || ''
    };
    
    await cita.save();
    
    res.json({ success: true, mensaje: resuelto ? 'Cita marcada como resuelta' : 'Cita marcada como no resuelta', cita });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Función cancelarCita (completa - con motivo y notificaciones)
exports.cancelarCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo, motivoTexto } = req.body;
    
    console.log(`📝 Cancelando cita: ${id}`);
    console.log(`   Motivo código: ${motivo}`);
    console.log(`   Motivo texto: ${motivoTexto}`);
    
    const esObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    let cita;
    
    if (esObjectId) {
      cita = await Cita.findById(id);
    } else {
      cita = await Cita.findOne({ folio: id });
    }
    
    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    // Guardar estado anterior
    const estadoAnterior = cita.estado;
    
    // Actualizar cita
    cita.estado = 'cancelada';
    cita.fechaCancelacion = new Date();
    cita.motivoCancelacion = motivoTexto || motivo;
    await cita.save();
    
    // Enviar notificaciones SOLO si estaba pendiente o confirmada
    if (estadoAnterior !== 'cancelada') {
      console.log(`📧 Enviando notificaciones de cancelación a: ${cita.correo}`);
      await notificacionService.notificarCancelacion(cita, motivoTexto || motivo);
    }
    
    console.log(`✅ Cita cancelada: ${cita.folio}`);
    
    res.json({ 
      success: true, 
      mensaje: 'Cita cancelada exitosamente',
      cita 
    });
  } catch (error) {
    console.error('❌ Error en cancelarCita:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerCitasHoy = async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const citas = await disponibilidadService.obtenerCitasDia(hoy);
    res.json(citas);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerCitasPorFecha = async (req, res) => {
  try {
    const { fecha } = req.params;
    const citas = await disponibilidadService.obtenerCitasDia(new Date(fecha));
    res.json(citas);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerEstadisticas = async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    finMes.setHours(23, 59, 59, 999);
    
    // Estadísticas diarias
    const citasDiarias = await Cita.find({
      fecha: { $gte: hoy, $lte: new Date(hoy.getTime() + 86400000) },
      estado: { $ne: 'cancelada' }
    });
    
    const diarias = {
      total: citasDiarias.length,
      atendidas: citasDiarias.filter(c => c.estado === 'atendida').length,
      noResueltas: citasDiarias.filter(c => c.estado === 'no_resuelta').length,
      pendientes: citasDiarias.filter(c => c.estado === 'pendiente').length,
      confirmadas: citasDiarias.filter(c => c.estado === 'confirmada').length
    };
    
    // Estadísticas mensuales
    const citasMensuales = await Cita.find({
      fecha: { $gte: inicioMes, $lte: finMes },
      estado: { $ne: 'cancelada' }
    });
    
    const mensuales = {
      total: citasMensuales.length,
      resueltas: citasMensuales.filter(c => c.resolucion?.resuelto === true).length,
      noResueltas: citasMensuales.filter(c => c.resolucion?.resuelto === false).length,
      pendientes: citasMensuales.filter(c => ['pendiente', 'confirmada'].includes(c.estado)).length
    };
    
    // Por tipo de audiencia
    const porTipo = {
      ciudadano: citasMensuales.filter(c => c.tipoAudiencia === 'ciudadano').length,
      localidad: citasMensuales.filter(c => c.tipoAudiencia === 'localidad').length,
      empresa: citasMensuales.filter(c => c.tipoAudiencia === 'empresa').length,
      autoridad: citasMensuales.filter(c => c.tipoAudiencia === 'autoridad').length
    };
    
    res.json({
      diarias,
      mensuales,
      porTipo
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Buscar expediente por folio de cita
exports.obtenerExpedientePorFolio = async (req, res) => {
  try {
    const { folio } = req.params;
    
    console.log(`🔍 Buscando expediente por folio: ${folio}`);
    
    // Buscar la cita por folio
    const cita = await Cita.findOne({ folio });
    
    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    
    if (!cita.expedienteId) {
      return res.status(404).json({ error: 'Expediente no encontrado para esta cita' });
    }
    
    const expediente = await Expediente.findById(cita.expedienteId).populate('citas.citaId');
    
    console.log(`✅ Expediente encontrado: ${expediente.identificador}`);
    
    res.json(expediente);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerExpediente = async (req, res) => {
  try {
    const { identificador } = req.params;
    
    console.log(`🔍 Buscando expediente por identificador: ${identificador}`);
    
    const expediente = await Expediente.findOne({ 
      identificador: { $regex: new RegExp(identificador, 'i') }
    }).populate('citas.citaId');
    
    if (!expediente) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }
    
    res.json(expediente);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.buscarExpedientes = async (req, res) => {
  try {
    const { q, tipo } = req.query;
    const query = {};
    
    if (q) {
      query.identificador = { $regex: new RegExp(q, 'i') };
    }
    if (tipo) {
      query.tipo = tipo;
    }
    
    const expedientes = await Expediente.find(query)
      .sort({ ultimaCita: -1 })
      .limit(20);
    
    res.json(expedientes);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Agrega esta función para obtener TODAS las citas
exports.obtenerTodasCitas = async (req, res) => {
  try {
    const { estado, tipo, fechaInicio, fechaFin } = req.query;
    
    // Construir filtro dinámico
    let filtro = {};
    
    if (estado && estado !== 'todas') {
      filtro.estado = estado;
    }
    
    if (tipo && tipo !== 'todos') {
      filtro.tipoAudiencia = tipo;
    }
    
    if (fechaInicio || fechaFin) {
      filtro.fecha = {};
      if (fechaInicio) {
        filtro.fecha.$gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        filtro.fecha.$lte = new Date(fechaFin);
      }
    }
    
    const citas = await Cita.find(filtro)
      .sort({ fecha: -1, horaInicio: 1 });
    
    res.json(citas);
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ error: error.message });
  }
};

