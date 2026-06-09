const mongoose = require('mongoose');

const expedienteSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['persona', 'comunidad', 'empresa', 'autoridad'],
    required: true
  },
  identificador: { type: String, required: true, unique: true },
  
  // Datos de contacto
  nombreContacto: String,
  telefonoPrincipal: String,
  correoPrincipal: String,
  
  // Datos específicos
  comunidad: String,
  cargo: String,
  organizacion: String,
  empresa: {
    nombre: String,
    rfc: String
  },
  
  // Historial completo
  citas: [{
    citaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cita' },
    folio: String,
    fecha: Date,
    motivo: String,
    resultado: String,
    resuelto: Boolean,
    observaciones: String
  }],
  
  // Estadísticas
  totalCitas: { type: Number, default: 0 },
  citasResueltas: { type: Number, default: 0 },
  citasNoResueltas: { type: Number, default: 0 },
  citasPendientes: { type: Number, default: 0 },
  ultimaCita: Date,
  
  // Notas del funcionario
  notasGenerales: String,
  
  fechacreacion: { type: Date, default: Date.now },
  ultimaActualizacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Expediente', expedienteSchema);