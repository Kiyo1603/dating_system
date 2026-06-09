const axios = require('axios');

class SMSService {
  constructor() {
    // Configuración de UltraMsg
    this.instanceId = 'instance178608';  // Tu instance ID de UltraMsg
    this.token = 'xgtb7nibxzs1u381';      // Tu token de UltraMsg
    this.baseUrl = 'https://api.ultramsg.com';
    this.isConfigured = true;
    
    console.log('📱 Servicio SMS/WhatsApp configurado con UltraMsg');
  }

  // Enviar mensaje por WhatsApp (recomendado)
  async enviarWhatsApp(telefono, mensaje) {
    try {
      // Limpiar número de teléfono para México
      let telefonoLimpio = telefono.toString().replace(/\D/g, '');
      
      if (telefonoLimpio.length === 10) {
        telefonoLimpio = '+52' + telefonoLimpio;
      } else if (!telefonoLimpio.startsWith('+')) {
        telefonoLimpio = '+' + telefonoLimpio;
      }

      const url = `${this.baseUrl}/${this.instanceId}/messages/chat`;
      
      const data = new URLSearchParams();
      data.append('token', this.token);
      data.append('to', telefonoLimpio);
      data.append('body', mensaje);
      
      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      console.log('✅ WhatsApp enviado a:', telefonoLimpio);
      console.log('   Respuesta:', response.data);
      return { success: true, data: response.data };
      
    } catch (error) {
      console.error('❌ Error enviando WhatsApp:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  // Enviar mensaje por SMS (UltraMsg también soporta SMS)
  async enviarSMS(telefono, mensaje) {
    // UltraMsg está más enfocado en WhatsApp, pero también tiene SMS
    console.log('📱 [SMS con UltraMsg]');
    console.log('   Para:', telefono);
    console.log('   Mensaje:', mensaje.substring(0, 100));
    console.log('   ⚠️ UltraMsg es principalmente para WhatsApp');
    
    // Por ahora, redirigimos a WhatsApp (recomendado)
    return this.enviarWhatsApp(telefono, mensaje);
  }

  // Enviar mensaje de confirmación con formato
  async enviarConfirmacion(telefono, cita) {
    const fecha = new Date(cita.fecha);
    const dia = fecha.getUTCDate();
    const mes = fecha.getUTCMonth() + 1;
    const año = fecha.getUTCFullYear();
    
    const mensaje = `🏛️ *Ayuntamiento de Palenque*\n\n✅ *CITA CONFIRMADA*\n\n📋 *Folio:* ${cita.folio}\n📅 *Fecha:* ${dia}/${mes}/${año}\n⏰ *Hora:* ${cita.horaInicio}\n📍 *Lugar:* ${cita.lugarAtencion}\n\n📌 *Recomendaciones:*\n• Llegar 15 minutos antes\n• Traer identificación oficial\n• Traer documentos necesarios\n\n¡Gracias por usar nuestro sistema!`;
    
    return this.enviarWhatsApp(telefono, mensaje);
  }

  // Enviar mensaje de solicitud
  async enviarSolicitud(telefono, cita) {
    const fecha = new Date(cita.fecha);
    const dia = fecha.getUTCDate();
    const mes = fecha.getUTCMonth() + 1;
    const año = fecha.getUTCFullYear();
    
    const mensaje = `🏛️ *Ayuntamiento de Palenque*\n\n📋 *SOLICITUD RECIBIDA*\n\n📋 *Folio:* ${cita.folio}\n📅 *Fecha solicitada:* ${dia}/${mes}/${año}\n⏰ *Hora:* ${cita.horaInicio}\n\n⏳ Tu cita está pendiente de confirmación. Recibirás un mensaje cuando sea confirmada.`;
    
    return this.enviarWhatsApp(telefono, mensaje);
  }

  // Enviar mensaje de cancelación
async enviarCancelacion(telefono, cita, motivo) {
  const fecha = new Date(cita.fecha);
  const dia = fecha.getUTCDate();
  const mes = fecha.getUTCMonth() + 1;
  const año = fecha.getUTCFullYear();
  
  // Formatear el motivo para que se vea bien
  let motivoFormateado = motivo || 'No especificado';
  
  const mensaje = `🏛️ *Ayuntamiento de Palenque*\n\n⚠️ *CITA CANCELADA*\n\n📋 *Folio:* ${cita.folio}\n📅 *Fecha:* ${dia}/${mes}/${año}\n⏰ *Hora:* ${cita.horaInicio}\n\n📌 *Motivo de cancelación:*\n${motivoFormateado}\n\nPara reagendar una nueva cita, ingrese al sistema de citas.\n`;
  
  return this.enviarWhatsApp(telefono, mensaje);
}
}

module.exports = new SMSService();