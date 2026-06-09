import React, { useState, useEffect } from 'react';
import './CalendarioDisponibilidad.css';

const CalendarioDisponibilidad = ({ tipoAudiencia, onSelectFechaHora }) => {
  const [fechas, setFechas] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  // Días en español
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  useEffect(() => {
    if (tipoAudiencia) {
      cargarDisponibilidad();
    }
  }, [tipoAudiencia]);

  const cargarDisponibilidad = async () => {
    setCargando(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:3003/api/disponibilidad/${tipoAudiencia}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Datos recibidos:', data); // Para debug
      
      // Asegurar que data es un array
      if (Array.isArray(data)) {
        setFechas(data);
      } else {
        setFechas([]);
        console.warn('La API no devolvió un array:', data);
      }
    } catch (error) {
      console.error('Error cargando disponibilidad:', error);
      setError('Error al cargar la disponibilidad. Intente de nuevo más tarde.');
      setFechas([]);
    } finally {
      setCargando(false);
    }
  };

  const handleSelectFecha = async (fecha) => {
    setFechaSeleccionada(fecha);
    setCargando(true);
    setError('');
    
    try {
      const response = await fetch(`http://localhost:3003/api/disponibilidad/dia/${tipoAudiencia}/${fecha}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.disponible) {
        setMensaje(data.mensaje || 'No hay disponibilidad para esta fecha');
      } else {
        setMensaje('');
        if (onSelectFechaHora && data.slots && data.slots.length > 0) {
          onSelectFechaHora({ 
            fecha, 
            horarios: data.slots, 
            lugar: data.lugares?.[0] || 'Ayuntamiento de Palenque'
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar horarios disponibles');
    } finally {
      setCargando(false);
    }
  };

  // Generar matriz de calendario para el mes actual
  const generarMatrizCalendario = () => {
    // Si fechas no es un array, devolver array vacío
    if (!Array.isArray(fechas)) {
      console.warn('fechas no es un array:', fechas);
      return [];
    }
    
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = hoy.getMonth();
    
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    
    const diasEnMes = ultimoDia.getDate();
    const diaInicio = primerDia.getDay(); // 0 = Domingo
    
    const matriz = [];
    let semana = [];
    
    // Llenar días vacíos al inicio
    for (let i = 0; i < diaInicio; i++) {
      semana.push(null);
    }
    
    // Llenar días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fechaStr = `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      const fechaDisponible = fechas.find(f => f && f.fecha === fechaStr);
      
      semana.push({
        dia,
        fecha: fechaStr,
        disponible: !!(fechaDisponible && fechaDisponible.disponible !== false),
        slots: fechaDisponible?.slots || [],
        lugar: fechaDisponible?.lugares?.[0]
      });
      
      if (semana.length === 7) {
        matriz.push(semana);
        semana = [];
      }
    }
    
    // Llenar días vacíos al final
    if (semana.length > 0) {
      while (semana.length < 7) {
        semana.push(null);
      }
      matriz.push(semana);
    }
    
    return matriz;
  };

  const matrizCalendario = generarMatrizCalendario();
  const mesActual = new Date().getMonth();
  const añoActual = new Date().getFullYear();

  if (!tipoAudiencia) {
    return (
      <div className="calendario-placeholder">
        <p>Seleccione un tipo de audiencia para ver disponibilidad</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendario-error">
        <p>⚠️ {error}</p>
        <button onClick={cargarDisponibilidad} className="btn-reintentar">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="calendario-container">
      <h3 className="calendario-titulo">
        {meses[mesActual]} {añoActual} - {tipoAudiencia === 'ciudadano' ? 'Audiencia Ciudadana' :
          tipoAudiencia === 'localidad' ? 'Audiencia de Localidades' : 
          tipoAudiencia === 'autoridad' ? 'Audiencia con Autoridades' : 'Audiencia de Empresas'}
      </h3>
      
      {cargando && <div className="cargando">Cargando disponibilidad...</div>}
      {mensaje && <div className="mensaje-saturado">{mensaje}</div>}
      
      <div className="calendario-grid">
        {/* Días de la semana */}
        {diasSemana.map(dia => (
          <div key={dia} className="calendario-dia-header">{dia}</div>
        ))}
        
        {/* Días del mes */}
        {matrizCalendario.flat().map((dia, index) => (
          <div 
            key={index} 
            className={`calendario-dia ${dia ? (dia.disponible ? 'disponible' : 'no-disponible') : 'vacio'}
              ${fechaSeleccionada === dia?.fecha ? 'seleccionado' : ''}`}
            onClick={() => dia?.disponible && handleSelectFecha(dia.fecha)}
          >
            {dia && (
              <>
                <span className="dia-numero">{dia.dia}</span>
                {dia.disponible && dia.slots && dia.slots.length > 0 && (
                  <div className="horarios-mini">
                    <span className="slots-count">{dia.slots.length} horarios</span>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {fechaSeleccionada && (
        <div className="horarios-seleccionados">
          <h4>Horarios disponibles para {new Date(fechaSeleccionada).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
          <div className="horarios-lista">
            {fechas.find(f => f && f.fecha === fechaSeleccionada)?.slots?.map((hora, idx) => (
              <button 
                key={idx} 
                className="horario-boton"
                onClick={() => onSelectFechaHora && onSelectFechaHora({ 
                  fecha: fechaSeleccionada, 
                  hora,
                  lugar: fechas.find(f => f.fecha === fechaSeleccionada)?.lugares?.[0] || 'Ayuntamiento de Palenque'
                })}
              >
                {hora}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarioDisponibilidad;