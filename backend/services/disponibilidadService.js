const Cita = require('../models/Cita');

const CONFIGURACION_HORARIOS = {
  ciudadano: { dias: [1, 2, 3, 4, 5] },
  localidad: { dias: [2, 3] },
  empresa: { dias: [3] },
  autoridad: { dias: [1, 2, 3, 4, 5] }
};

class DisponibilidadService {
  generarSlots() {
    const slots = [];
    for (let hora = 9; hora < 16; hora++) {
      slots.push(`${String(hora).padStart(2, '0')}:00`);
      slots.push(`${String(hora).padStart(2, '0')}:30`);
    }
    return slots;
  }

  // Función SIMPLE y CORRECTA para obtener día de semana
 getDiaSemana(fechaStr) {
  // Parsear la fecha manualmente
  const [year, month, day] = fechaStr.split('-').map(Number);
  
  // Usar el algoritmo de Zeller
  let y = year;
  let m = month;
  let q = day;
  
  if (m === 1 || m === 2) {
    m += 12;
    y--;
  }
  
  const K = y % 100;
  const J = Math.floor(y / 100);
  
  // Fórmula de Zeller (0 = sábado, 1 = domingo, ..., 6 = viernes)
  let h = (q + Math.floor((13 * (m + 1)) / 5) + K + Math.floor(K / 4) + Math.floor(J / 4) + 5 * J) % 7;
  
  // Convertir a: 0=domingo, 1=lunes, 2=martes, 3=miércoles, 4=jueves, 5=viernes, 6=sábado
  const mapeo = [6, 0, 1, 2, 3, 4, 5];
  const diaSemana = mapeo[h];
  
  console.log(`📅 getDiaSemana - ${fechaStr} = ${diaSemana}`);
  
  return diaSemana;
}

async verificarDisponibilidad(fecha, tipo) {
  const config = CONFIGURACION_HORARIOS[tipo];
  if (!config) {
    return { disponible: false, slots: [] };
  }
  
  // Obtener fecha en formato YYYY-MM-DD
  let fechaStr;
  if (typeof fecha === 'string') {
    // Si viene como string, tomar solo la parte de la fecha
    fechaStr = fecha.split('T')[0];
    
    // IMPORTANTE: Si la fecha tiene guiones, usarla tal cual
    // No convertir a Date para evitar desplazamiento de zona horaria
    console.log(`📅 Fecha recibida como string: ${fechaStr}`);
  } else {
    // Si viene como objeto Date, extraer componentes manualmente
    const año = fecha.getUTCFullYear();
    const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getUTCDate()).padStart(2, '0');
    fechaStr = `${año}-${mes}-${dia}`;
    console.log(`📅 Fecha recibida como Date: ${fechaStr}`);
  }
  
  // Calcular día de semana
  const diaSemana = this.getDiaSemana(fechaStr);
  
  console.log(`📅 ${tipo} - Fecha: ${fechaStr}, Día semana: ${diaSemana}`);
  
  // Validación de día
  if (!config.dias.includes(diaSemana)) {
    let mensaje = '';
    if (tipo === 'empresa') mensaje = '🏢 Solo miércoles';
    else if (tipo === 'localidad') mensaje = '🏘️ Solo martes y miércoles';
    else mensaje = 'Día no disponible';
    return { disponible: false, mensaje, slots: [] };
  }
  
  // Generar slots
  const todosSlots = this.generarSlots();
  
  return {
    disponible: true,
    slots: todosSlots,
    lugares: ['Ayuntamiento de Palenque']
  };
}

  async obtenerProximasFechas(tipo, limite = 14) {
  const config = CONFIGURACION_HORARIOS[tipo];
  if (!config) return [];
  
  const fechas = [];
  const hoy = new Date();
  
  let diasRevisados = 0;
  let maxDias = 60;
  
  while (fechas.length < limite && diasRevisados < maxDias) {
    diasRevisados++;
    
    const fecha = new Date();
    fecha.setDate(hoy.getDate() + diasRevisados);
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const fechaStr = `${año}-${mes}-${dia}`;
    const diaSemana = this.getDiaSemana(fechaStr);
    
    if (config.dias.includes(diaSemana)) {
      fechas.push({
        fecha: fechaStr,
        slots: this.generarSlots(),
        lugares: ['Ayuntamiento de Palenque']
      });
    }
  }
  
  console.log(`📊 ${tipo} - Total fechas: ${fechas.length}`);
  return fechas;
}

  async obtenerCitasDia(fecha) {
  // Asegurar que fecha sea un objeto Date válido
  let fechaObj;
  if (typeof fecha === 'string') {
    fechaObj = new Date(fecha);
  } else if (fecha instanceof Date) {
    fechaObj = fecha;
  } else {
    fechaObj = new Date();
  }
  
  const año = fechaObj.getFullYear();
  const mes = fechaObj.getMonth();
  const dia = fechaObj.getDate();
  
  const fechaInicio = new Date(año, mes, dia);
  fechaInicio.setHours(0, 0, 0, 0);
  const fechaFin = new Date(año, mes, dia);
  fechaFin.setHours(23, 59, 59, 999);
  
  return await Cita.find({
    fecha: { $gte: fechaInicio, $lte: fechaFin },
    estado: { $ne: 'cancelada' }
  }).sort({ horaInicio: 1 });
}
}

module.exports = new DisponibilidadService();