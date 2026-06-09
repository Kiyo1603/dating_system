const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema({
  folio: { type: String, unique: true },
  tipoAudiencia: {
    type: String,
    enum: ['ciudadano', 'localidad', 'empresa','autoridad'],
    required: true
  },
  fecha: { type: Date, required: true },
  horaInicio: { type: String, required: true },
  horaFin: { type: String, required: true },
  duracion: { type: Number, default: 30 },
  
  // Datos del solicitante
  nombre: { type: String, required: true },
  telefono: { type: String, required: true },
  correo: { type: String, required: true },
  cargo: String,
  lugarOrigen: { type: String, required: true },
  
  // Datos específicos por tipo
  comunidad: String, // Para localidades
  empresa: {
    nombre: String,
    representante: String
  },
  
  // Detalles de la cita
  motivo: {
    type: String,
    enum: ['obra_nueva', 'apoyo_economico', 'seguimiento_obra', 'consulta_general', 'otros'],
    required: true
  },
  descripcion: { type: String, required: true },
  lugarAtencion: { 
    type: String, 
    default: 'Ayuntamiento de Palenque'
  },
  
  // Estado y seguimiento
  estado: {
    type: String,
    enum: ['pendiente', 'confirmada', 'cancelada', 'atendida', 'no_resuelta'],
    default: 'pendiente'
  },
  resolucion: {
    resuelto: Boolean,
    motivoNoResolucion: String,
    fechaAtencion: Date,
    observaciones: String
  },
  
  // Control
  fechaSolicitud: { type: Date, default: Date.now },
  fechaConfirmacion: Date,
  fechaCancelacion: Date,

  // Motivo de cancelación (opcional, solo si se cancela)
  motivoCancelacion: {
  type: String,
  default: null
},
  
  // Expediente
  expedienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expediente' }
});

// Generar folio único antes de guardar
citaSchema.pre('save', async function() {
  if (!this.folio) {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('Cita').countDocuments();
    this.folio = `CIT-${año}${mes}-${String(count + 1).padStart(4, '0')}`;
  }
});

module.exports = mongoose.model('Cita', citaSchema);
