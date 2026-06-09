const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    
    // Credenciales de Gmail desde tu archivo Bluetooth5.py
    const emailUser = 'kiyoshi.rodriguez49@unach.mx';
    const emailPass = 'uswg aaex povc azpf';
    
    if (emailUser && emailPass && emailUser !== 'tu_correo@gmail.com') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass
        }
      });
      this.isConfigured = true;
      this.fromEmail = emailUser;
      console.log('📧 Servicio de email configurado con Gmail');
    } else {
      console.log('📧 Servicio de email en modo desarrollo (sin configuración real)');
    }
  }

  async enviarCorreo(destinatario, asunto, contenidoHtml) {
  console.log(`📧 Intentando enviar email a: ${destinatario}`);
  console.log(`📧 Asunto: ${asunto}`);
  
  if (!destinatario || !destinatario.includes('@')) {
    console.log('❌ Email inválido:', destinatario);
    return { success: false, error: 'Email inválido' };
  }

  if (!this.isConfigured || !this.transporter) {
    console.log('📧 [EMAIL SIMULADO] - No configurado');
    console.log('   Para:', destinatario);
    console.log('   Asunto:', asunto);
    return { success: true, modoDesarrollo: true };
  }

  try {
    const info = await this.transporter.sendMail({
      from: `"Ayuntamiento de Palenque" <${this.fromEmail}>`,
      to: destinatario,
      subject: asunto,
      html: contenidoHtml
    });
    
    console.log('✅ Email enviado exitosamente a:', destinatario);
    console.log('   Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error enviando email:', error.message);
    console.error('   Error completo:', error);
    return { success: false, error: error.message };
  }
}

  generarPlantillaConfirmacion(cita) {
    const formatearFechaCorrecta = (fecha) => {
    const fechaObj = new Date(fecha);
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    // Usar toLocaleDateString con timeZone UTC
    return new Date(fechaObj.getTime() + (fechaObj.getTimezoneOffset() * 60000))
        .toLocaleDateString('es-MX', opciones);
    };
    const fechaFormateada = formatearFechaCorrecta(cita.fecha);

    const tipoAudiencia = {
      ciudadano: '👤 Ciudadano',
      localidad: '🏘️ Localidad',
      empresa: '🏢 Empresa',
      autoridad: '👥 Autoridad'
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #D4A373; border-radius: 10px; }
          .header { text-align: center; border-bottom: 2px solid #D4A373; padding-bottom: 15px; margin-bottom: 20px; }
          .header h1 { color: #8B5A2B; margin: 0; font-size: 24px; }
          .folio { background: #F5EADB; padding: 10px; border-radius: 5px; text-align: center; margin: 15px 0; }
          .folio strong { font-size: 18px; color: #8B5A2B; }
          .detalles { margin: 20px 0; }
          .detalle-item { margin: 10px 0; padding: 8px; background: #FAF6F0; border-radius: 5px; }
          .recomendaciones { background: #E8F5E9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50; }
          .footer { text-align: center; font-size: 12px; color: #8B6B4D; margin-top: 20px; padding-top: 15px; border-top: 1px solid #D4A373; }
          .badge { display: inline-block; padding: 3px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; background: #4CAF50; color: white; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ Ayuntamiento de Palenque</h1>
            <p>Secretaría Municipal</p>
          </div>
          
          <h2 style="color: #4CAF50;">✅ Cita Confirmada</h2>
          
          <p>Estimado(a) <strong>${cita.nombre}</strong>,</p>
          <p>Su cita ha sido <strong style="color: #4CAF50;">CONFIRMADA</strong>. A continuación los detalles:</p>
          
          <div class="folio">
            <strong>📋 Folio: ${cita.folio}</strong>
          </div>
          
          <div class="detalles">
            <div class="detalle-item"><strong>📅 Fecha:</strong> ${fechaFormateada}</div>
            <div class="detalle-item"><strong>⏰ Hora:</strong> ${cita.horaInicio} - ${cita.horaFin || '16:00'}</div>
            <div class="detalle-item"><strong>📍 Lugar:</strong> ${cita.lugarAtencion}</div>
            <div class="detalle-item"><strong>👥 Tipo:</strong> ${tipoAudiencia[cita.tipoAudiencia] || cita.tipoAudiencia}</div>
          </div>
          
          <div class="recomendaciones">
            <strong>📌 Recomendaciones importantes:</strong>
            <ul>
              <li>Llegar 15 minutos antes de su cita</li>
              <li>Traer identificación oficial</li>
              <li>Traer documentos necesarios para su trámite</li>
            </ul>
          </div>
          
          <div style="text-align: center;"><span class="badge">CITA CONFIRMADA</span></div>
          
          <div class="footer">
            <p>6ª. PTE. SUR ENTRE 5ª. SUR PTE Y 7ª. SUR PTE S/N • BARRIO SAN ANASTACIO • C.P. 29750</p>
            <p>Tel. 919 685 23 11</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generarPlantillaSolicitud(cita) {
    const formatearFechaCorrecta = (fecha) => {
    const fechaObj = new Date(fecha);
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const diaSemana = dias[fechaObj.getUTCDay()];
    const dia = fechaObj.getUTCDate();
    const mes = meses[fechaObj.getUTCMonth()];
    const año = fechaObj.getUTCFullYear();
    
    return `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)}, ${dia} de ${mes} de ${año}`;
  };
  
  const fechaFormateada = formatearFechaCorrecta(cita.fecha);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #D4A373; border-radius: 10px; }
          .header { text-align: center; border-bottom: 2px solid #D4A373; padding-bottom: 15px; }
          .folio { background: #F5EADB; padding: 10px; border-radius: 5px; text-align: center; margin: 15px 0; }
          .pendiente { color: #FF9800; }
          .footer { text-align: center; font-size: 12px; margin-top: 20px; padding-top: 15px; border-top: 1px solid #D4A373; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ Ayuntamiento de Palenque</h1>
          </div>
          
          <h2 class="pendiente">📋 Solicitud de Cita Recibida</h2>
          
          <p>Estimado(a) <strong>${cita.nombre}</strong>,</p>
          <p>Hemos recibido su solicitud de cita con folio <strong>${cita.folio}</strong>.</p>
          
          <p><strong>📅 Fecha solicitada:</strong> ${fechaFormateada}</p>
          <p><strong>⏰ Hora:</strong> ${cita.horaInicio}</p>
          
          <div style="background: #FFF3E0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>⏳ Estado:</strong> <span class="pendiente">PENDIENTE DE CONFIRMACIÓN</span></p>
            <p>Recibirá un mensaje de confirmación en las próximas horas.</p>
          </div>
          
          <div class="footer">
            <p>6ª. PTE. SUR ENTRE 5ª. SUR PTE Y 7ª. SUR PTE S/N • BARRIO SAN ANASTACIO • C.P. 29750</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generarPlantillaCancelacion(cita, motivo) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #D4A373; border-radius: 10px; }
          .header { text-align: center; border-bottom: 2px solid #D4A373; padding-bottom: 15px; }
          .cancelado { color: #f44336; }
          .footer { text-align: center; font-size: 12px; margin-top: 20px; padding-top: 15px; border-top: 1px solid #D4A373; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏛️ Ayuntamiento de Palenque</h1>
          </div>
          
          <h2 class="cancelado">⚠️ Cita Cancelada</h2>
          
          <p>Estimado(a) <strong>${cita.nombre}</strong>,</p>
          <p>Le informamos que su cita con folio <strong>${cita.folio}</strong> ha sido <strong class="cancelado">CANCELADA</strong>.</p>
          
          <p><strong>Motivo:</strong> ${motivo || 'Cancelada por el sistema'}</p>
          
          <p>Para reagendar una nueva cita, por favor ingrese nuevamente al sistema.</p>
          
          <div class="footer">
            <p>6ª. PTE. SUR ENTRE 5ª. SUR PTE Y 7ª. SUR PTE S/N • BARRIO SAN ANASTACIO • C.P. 29750</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();