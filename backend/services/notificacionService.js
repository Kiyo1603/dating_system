const emailService = require('./emailService');
const smsService = require('./smsService');

class NotificacionService {
  constructor() {
    this.modoDesarrollo = process.env.NODE_ENV === 'development';
    console.log(`📱 Servicio de notificaciones en modo ${this.modoDesarrollo ? 'desarrollo' : 'producción'}`);
  }

  async enviarSMS(telefono, mensaje) {
    return await smsService.enviarSMS(telefono, mensaje);
  }

  async enviarWhatsApp(telefono, mensaje) {
    return await smsService.enviarWhatsApp(telefono, mensaje);
  }

  async enviarCorreo(correo, asunto, contenidoHtml) {
    return await emailService.enviarCorreo(correo, asunto, contenidoHtml);
  }

  async notificarConfirmacionCita(cita) {
    console.log(`📢 Notificando confirmación de cita ${cita.folio} a ${cita.nombre}`);
    
    const htmlConfirmacion = emailService.generarPlantillaConfirmacion(cita);
    
    // Enviar WhatsApp y Email en paralelo
    const [whatsappResult, emailResult] = await Promise.all([
      smsService.enviarConfirmacion(cita.telefono, cita),
      this.enviarCorreo(cita.correo, '✅ CITA CONFIRMADA - Ayuntamiento de Palenque', htmlConfirmacion)
    ]);
    
    console.log(`📊 WhatsApp confirmación: ${whatsappResult.success ? '✅ ENVIADO' : '❌ FALLÓ'}`);
    console.log(`📊 Email confirmación: ${emailResult.success ? '✅ ENVIADO' : '❌ FALLÓ'}`);
    
    return { 
      whatsapp: whatsappResult.success, 
      email: emailResult.success 
    };
  }

  async notificarSolicitudCita(cita) {
    console.log(`📢 Notificando solicitud de cita ${cita.folio} a ${cita.nombre}`);
    
    const htmlSolicitud = emailService.generarPlantillaSolicitud(cita);
    
    // Enviar WhatsApp y Email en paralelo
    const [whatsappResult, emailResult] = await Promise.all([
      smsService.enviarSolicitud(cita.telefono, cita),
      this.enviarCorreo(cita.correo, '📋 Solicitud de Cita Recibida', htmlSolicitud)
    ]);
    
    console.log(`📊 WhatsApp solicitud: ${whatsappResult.success ? '✅ ENVIADO' : '❌ FALLÓ'}`);
    console.log(`📊 Email solicitud: ${emailResult.success ? '✅ ENVIADO' : '❌ FALLÓ'}`);
    
    return { 
      whatsapp: whatsappResult.success, 
      email: emailResult.success 
    };
  }

  async notificarCancelacion(cita, motivo = '') {
    console.log(`📢 Notificando cancelación de cita ${cita.folio} a ${cita.nombre}`);
    
    const htmlCancelacion = emailService.generarPlantillaCancelacion(cita, motivo);
    
    const [whatsappResult, emailResult] = await Promise.all([
      smsService.enviarCancelacion(cita.telefono, cita, motivo),
      this.enviarCorreo(cita.correo, '⚠️ CITA CANCELADA - Ayuntamiento de Palenque', htmlCancelacion)
    ]);
    
    console.log(`📊 WhatsApp cancelación: ${whatsappResult.success ? '✅ ENVIADO' : '❌ FALLÓ'}`);
    console.log(`📊 Email cancelación: ${emailResult.success ? '✅ ENVIADO' : '❌ FALLÓ'}`);
    
    return { 
      whatsapp: whatsappResult.success, 
      email: emailResult.success 
    };
  }

  async notificarRecordatorioCita(cita) {
    const mensajeWhatsApp = `🏛️ *Ayuntamiento de Palenque*\n\n🔔 *RECORDATORIO DE CITA*\n\n📋 Folio: ${cita.folio}\n📅 Fecha: ${new Date(cita.fecha).toLocaleDateString('es-MX')}\n⏰ Hora: ${cita.horaInicio}\n📍 Lugar: ${cita.lugarAtencion}\n\nPor favor confirme su asistencia.`;
    
    const whatsappResult = await this.enviarWhatsApp(cita.telefono, mensajeWhatsApp);
    
    return { whatsapp: whatsappResult.success };
  }

  async notificarAgendaSaturada(fecha, tipo) {
    const fechaFormateada = new Date(fecha).toLocaleDateString('es-MX');
    console.log(`⚠️ ALERTA: Agenda saturada para ${tipo} el ${fechaFormateada}`);
  }
}

module.exports = new NotificacionService();