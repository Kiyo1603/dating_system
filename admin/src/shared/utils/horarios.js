// Configuración de horarios según el PDF
export const CONFIGURACION_HORARIOS = {
  ciudadano: {
    dias: [1, 2, 3, 4, 5], // Lunes a Viernes
    horarioInicio: '09:00',
    horarioFin: '16:00',
    duracionMinutos: 30,
    maximoDiario: 14, // 14 citas de 30 min (7 horas)
    mensajeSaturado: 'Agenda saturada para hoy'
  },
  
  localidad: {
    dias: [2, 3], // Martes y Miércoles
    horarioInicio: '09:00',
    horarioFin: '16:00',
    duracionMinutos: 30,
    maximoDiario: 14,
    mensajeSaturado: 'No hay disponibilidad para audiencias de localidades esta semana'
  },
  
  empresa: {
    dias: [3], // Miércoles
    horarioInicio: '09:00',
    horarioFin: '16:00',
    duracionMinutos: 30,
    maximoDiario: 14,
    lugarAlternativo: 'Sala de Juntas Municipal', // A veces cambia el lugar
    mensajeSaturado: 'Agenda de empresas saturada'
  }
};

// Función para verificar disponibilidad
export const verificarDisponibilidad = (fecha, tipo, citasExistentes) => {
  const config = CONFIGURACION_HORARIOS[tipo];
  const diaSemana = new Date(fecha).getDay(); // 0 = Domingo, 1 = Lunes, etc.
  
  // Verificar si el día está disponible
  if (!config.dias.includes(diaSemana)) {
    return {
      disponible: false,
      mensaje: 'No hay audiencias disponibles este día'
    };
  }
  
  // Contar citas existentes
  const citasDia = citasExistentes.filter(cita => 
    cita.fecha === fecha && cita.estado !== 'cancelada'
  );
  
  if (citasDia.length >= config.maximoDiario) {
    return {
      disponible: false,
      mensaje: config.mensajeSaturado
    };
  }
  
  // Generar slots disponibles
  const slotsDisponibles = generarSlotsDisponibles(fecha, config, citasDia);
  
  return {
    disponible: slotsDisponibles.length > 0,
    slots: slotsDisponibles,
    lugarAtencion: tipo === 'empresa' && slotsDisponibles.length > 5 
      ? config.lugarAlternativo 
      : 'Ayuntamiento de Palenque'
  };
};

// Generar slots de 30 minutos
export const generarSlotsDisponibles = (fecha, config, citasExistentes) => {
  const slots = [];
  const inicio = convertirHora(config.horarioInicio);
  const fin = convertirHora(config.horarioFin);
  
  for (let hora = inicio; hora < fin; hora += 0.5) {
    const horaStr = formatearHora(hora);
    
    // Verificar si el slot está ocupado
    const ocupado = citasExistentes.some(cita => 
      cita.horaInicio === horaStr && cita.estado !== 'cancelada'
    );
    
    if (!ocupado) {
      slots.push(horaStr);
    }
  }
  
  return slots;
};