import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SchedulePage.css';
import Navbar from '../shared/components/Navbar';
import Button from '../shared/components/Button';

const SchedulePage = () => {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);
  const [tipoAudiencia, setTipoAudiencia] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    correo: '',
    cargo: '',
    lugarOrigen: '',
    motivo: '',
    descripcion: '',
    comunidad: '',
    representante: '',
    empresa: '',
    fecha: '',
    hora: '',
    lugarAtencion: 'Ayuntamiento de Palenque'
  });

  const [fechasDisponibles, setFechasDisponibles] = useState([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [cargandoFechas, setCargandoFechas] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);

  const tiposAudiencia = [
    { 
      id: 'localidad', 
      nombre: 'Audiencia de Localidades', 
      descripcion: 'Comunidades, ejidos y grupos',
      dias: 'Martes y Miércoles (9am - 4pm)'
    },
    { 
      id: 'empresa', 
      nombre: 'Audiencia de Empresas', 
      descripcion: 'Empresas y comercios',
      dias: 'Miércoles (9am - 4pm)'
    },
    { 
      id: 'autoridad', 
      nombre: 'Audiencia con Autoridades', 
      descripcion: 'Agentes municipales, presidentes de colonias, líderes',
      dias: 'Lunes a Viernes (9am - 4pm)'
    }
  ];

  const motivosLocalidad = [
    { value: 'obra_nueva', label: 'Obra nueva' },
    { value: 'apoyo_economico', label: 'Apoyo económico' },
    { value: 'seguimiento_obra', label: 'Seguimiento de obra' }
  ];

  const motivosGenerales = [
    { value: 'consulta_general', label: 'Consulta general' },
    { value: 'apoyo_economico', label: 'Apoyo económico' },
    { value: 'otros', label: 'Otros' }
  ];

 // Función para formatear fecha correctamente usando UTC
const formatearFechaUTC = (fechaStr) => {
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
  const [year, month, day] = fechaStr.split('-');
  const fechaNum = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
  
  const diaSemana = fechaNum.getUTCDay();
  const dia = parseInt(day);
  const mesNombre = meses[parseInt(month) - 1];
  
  // Capitalizar primera letra del día
  const diaNombre = dias[diaSemana].charAt(0).toUpperCase() + dias[diaSemana].slice(1);
  
  return `${diaNombre}, ${dia} de ${mesNombre} de ${year}`;
};

  // Convertir hora a formato 24h
  const horaTo24 = (horaInput) => {
    if (horaInput == null) return '';
    let horaStr = horaInput;
    if (typeof horaInput === 'object') {
      if (horaInput.horaInicio) return horaInput.horaInicio;
      if (horaInput.hora) horaStr = horaInput.hora;
      else horaStr = String(horaInput);
    }

    horaStr = String(horaStr).trim();
    if (!horaStr) return '';
    if (/^\d{2}:\d{2}$/.test(horaStr)) return horaStr;

    const match = horaStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return horaStr;

    let h = parseInt(match[1], 10);
    const m = match[2];
    const ampm = (match[3] || '').toUpperCase();

    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;

    return `${String(h).padStart(2, '0')}:${m}`;
  };
// Convertir hora 24h a formato AM/PM
  const formatHoraMostrar = (hora24) => {
    if (!hora24) return '';
    const [h, m] = hora24.split(':');
    let hora = parseInt(h);
    const ampm = hora >= 12 ? 'PM' : 'AM';
    hora = hora % 12 || 12;
    return `${hora}:${m} ${ampm}`;
  };
  
  // Cargar fechas desde el backend
  const cargarFechasDelBackend = async () => {
    setCargandoFechas(true);
    try {
      const response = await fetch(`http://localhost:3003/api/disponibilidad/${tipoAudiencia}`);
      const data = await response.json();
      console.log('🔍 FRONTEND - Tipo:', tipoAudiencia);
      console.log('🔍 FRONTEND - Datos recibidos:', data);
      
      // Verificar qué días está recibiendo usando UTC
      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      data.forEach(item => {
        const [year, month, day] = item.fecha.split('-');
        const fechaUTC = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
        console.log(`   ${item.fecha} = ${diasSemana[fechaUTC.getUTCDay()]}`);
      });
      
      const fechas = data.map(item => item.fecha);
      setFechasDisponibles(fechas);
    } catch (error) {
      console.error('Error cargando fechas:', error);
      setFechasDisponibles([]);
    } finally {
      setCargandoFechas(false);
    }
  };

  // Cargar horarios desde el backend cuando se selecciona una fecha
  const cargarHorariosDelBackend = async (fecha) => {
  setCargandoHorarios(true);
  try {
    // NO MODIFICAR LA FECHA - Usarla exactamente como viene
    // Asegurar que no haya ningún tipo de transformación
    const fechaOriginal = fecha;
    console.log('🔍 Fecha original recibida:', fechaOriginal);
    
    // Forzar la URL con la fecha exacta
    const url = `http://localhost:3003/api/disponibilidad/dia/${tipoAudiencia}/${fechaOriginal}`;
    console.log('🔍 URL exacta:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    console.log('📅 Respuesta del backend:', data);
    
    if (data.disponible === true && data.slots && data.slots.length > 0) {
      const horariosFormateados = data.slots.map(slot => ({
        hora: formatHoraMostrar(slot),
        horaInicio: slot
      }));
      setHorariosDisponibles(horariosFormateados);
    } else {
      setHorariosDisponibles([]);
      if (data.mensaje) {
        console.log('Mensaje del backend:', data.mensaje);
      }
    }
  } catch (error) {
    console.error('Error cargando horarios:', error);
    setHorariosDisponibles([]);
  } finally {
    setCargandoHorarios(false);
  }
};

  // Efecto para cargar fechas cuando se selecciona tipo de audiencia y se llega al paso 3
  React.useEffect(() => {
    if (tipoAudiencia && paso === 3) {
      cargarFechasDelBackend();
    }
  }, [tipoAudiencia, paso]);

  const handleSelectTipo = (tipo) => {
    setTipoAudiencia(tipo);
    setFormData(prev => ({ ...prev, fecha: '', hora: '' }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectFecha = (fecha) => {
  // No convertir nada, usar la fecha exactamente como viene
  console.log('📅 Fecha seleccionada (sin modificar):', fecha);
  
  // Guardar la fecha exacta
  setFormData(prev => ({ ...prev, fecha: fecha, hora: '' }));
  
  // Llamar a cargar horarios con la misma fecha
  cargarHorariosDelBackend(fecha);
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const citaData = {
        nombre: formData.nombre,
        telefono: formData.telefono,
        correo: formData.correo,
        cargo: formData.cargo || '',
        lugarOrigen: formData.lugarOrigen || 'Sin especificar',
        motivo: formData.motivo || 'otros',
        descripcion: formData.descripcion || (formData.motivo || 'Sin descripción'),
        tipoAudiencia,
        fecha: formData.fecha,
        horaInicio: horaTo24(formData.hora),
        lugarAtencion: formData.lugarAtencion || 'Ayuntamiento de Palenque',
        fechaSolicitud: new Date().toISOString(),
        estado: 'pendiente'
      };

      if (tipoAudiencia === 'empresa') {
        citaData.empresa = {
          nombre: formData.empresa || '',
          representante: formData.nombre || ''
        };
      }
      
      if (tipoAudiencia === 'localidad') {
        citaData.comunidad = formData.comunidad || '';
        citaData.representante = formData.representante || '';
      }

      const response = await fetch('http://localhost:3003/api/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(citaData)
      });
      
      if (response.ok) {
        alert('✅ Cita solicitada exitosamente. Recibirá un mensaje de confirmación.');
        resetForm();
        navigate('/');
      } else {
        let errMsg = 'Error al agendar la cita. Intente de nuevo.';
        try {
          const errBody = await response.json();
          if (errBody && (errBody.message || errBody.error)) {
            errMsg = errBody.message || errBody.error;
          } else if (typeof errBody === 'string') {
            errMsg = errBody;
          }
        } catch (jsonErr) {
          console.warn('No se pudo parsear la respuesta de error como JSON', jsonErr);
        }
        console.error('Error al crear cita, status:', response.status, 'message:', errMsg);
        alert(`❌ ${errMsg}`);
      }
    } catch (error) {
      console.error('Error al enviar la solicitud de cita:', error);
      alert('❌ Error al enviar la solicitud. Por favor inténtelo más tarde.');
    }
  };

  const resetForm = () => {
    setTipoAudiencia('');
    setPaso(1);
    setFormData({
      nombre: '',
      telefono: '',
      correo: '',
      cargo: '',
      lugarOrigen: '',
      motivo: '',
      descripcion: '',
      comunidad: '',
      representante: '',
      empresa: '',
      fecha: '',
      hora: '',
      lugarAtencion: 'Ayuntamiento de Palenque'
    });
    setFechasDisponibles([]);
    setHorariosDisponibles([]);
    setCargandoHorarios(false);
  };

  const validarPaso2 = () => {
    if (!tipoAudiencia) return false;

    if (tipoAudiencia === 'empresa') {
      return formData.empresa && formData.nombre && formData.telefono && formData.correo;
    }

    const datosBasicosConLugar = formData.nombre && formData.telefono && formData.correo && formData.lugarOrigen;

    if (tipoAudiencia === 'localidad') {
      return datosBasicosConLugar && formData.representante && formData.motivo && formData.descripcion;
    } else {
      return datosBasicosConLugar && formData.motivo;
    }
  };

  const renderFormularioPorTipo = () => {
    switch(tipoAudiencia) {
      case 'localidad':
        return (
          <div className="formulario-localidad">
            <h3>FICHA DE REGISTRO PARA AUDIENCIA DE LOCALIDADES</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Nombre de la comunidad o Persona *</label>
                <input
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Representante de la comunidad *</label>
                <input
                  name="representante"
                  value={formData.representante}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Cargo *</label>
                <input
                  name="cargo"
                  value={formData.cargo}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Teléfono *</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Correo *</label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group full-width">
                <label>De donde es / Dirección *</label>
                <input
                  name="lugarOrigen"
                  value={formData.lugarOrigen}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Motivo de la visita *</label>
                <select
                  name="motivo"
                  value={formData.motivo}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione</option>
                  {motivosLocalidad.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group full-width">
                <label>Descripción de su problemática *</label>
                <textarea
                  name="descripcion"
                  rows="4"
                  value={formData.descripcion}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
        );
      
      case 'empresa':
        return (
          <div className="formulario-empresa">
            <h3>FICHA DE REGISTRO PARA AUDIENCIA CON EMPRESAS</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre de la empresa *</label>
                <input
                  name="empresa"
                  value={formData.empresa}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Representante *</label>
                <input
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Teléfono *</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Correo *</label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group full-width">
                <label>Motivo *</label>
                <select
                  name="motivo"
                  value={formData.motivo}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione</option>
                  {motivosGenerales.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="lugar-nota">* El lugar de atención puede cambiar (se confirmará al agendar)</p>
          </div>
        );
      
      case 'autoridad':
        return (
          <div className="formulario-autoridad">
            <h3>FICHA DE REGISTRO PARA AUDIENCIA CON AUTORIDADES MUNICIPALES</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Cargo *</label>
                <input
                  name="cargo"
                  value={formData.cargo}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Teléfono *</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Correo *</label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group full-width">
                <label>Lugar/organización/comunidad o colonia que representa *</label>
                <input
                  name="lugarOrigen"
                  value={formData.lugarOrigen}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group full-width">
                <label>Motivo de la visita *</label>
                <select
                  name="motivo"
                  value={formData.motivo}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione</option>
                  {motivosGenerales.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="ciudadano-app">
      <Navbar tipo="ciudadano" />
      
      <div className="container">
        <div className="schedule-page">
          <button className="btn-back" onClick={() => navigate('/')}>
            ← Volver al inicio
          </button>
          
          <h1>Sistema de Citas</h1>
          <p className="direccion">6ª. PTE. SUR ENTRE 5ª. SUR PTE Y 7ª. PTE. SUR S/N • BARRIO SAN ANASTACIO • C.P. 29750 • TEL. 919 685 23 11</p>
          
          {paso === 1 && (
            <div className="paso-container">
              <h2>Seleccione el tipo de audiencia</h2>
              <div className="tipos-grid">
                {tiposAudiencia.map(tipo => (
                  <div 
                    key={tipo.id}
                    className={`tipo-card ${tipoAudiencia === tipo.id ? 'seleccionado' : ''}`}
                    onClick={() => handleSelectTipo(tipo.id)}
                  >
                    <h3>{tipo.nombre}</h3>
                    <p className="descripcion">{tipo.descripcion}</p>
                    <p className="dias">{tipo.dias}</p>
                  </div>
                ))}
              </div>
              
              {tipoAudiencia && (
                <div className="botones-container">
                  <Button variant="primary" onClick={() => setPaso(2)}>
                    Continuar
                  </Button>
                </div>
              )}
            </div>
          )}

          {paso === 2 && (
            <div className="paso-container">
              <h2>Datos de la audiencia</h2>
              
              <form className="formulario-cita" onSubmit={(e) => e.preventDefault()}>
                {renderFormularioPorTipo()}

                <div className="botones-container">
                  <Button variant="secondary" onClick={() => setPaso(1)}>
                    Atrás
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={() => setPaso(3)}
                    disabled={!validarPaso2()}
                  >
                    Ver disponibilidad
                  </Button>
                </div>
              </form>
            </div>
          )}

          {paso === 3 && (
            <div className="paso-container">
              <h2>Seleccione fecha y hora disponible</h2>
              
              <div className="fechas-disponibles">
                <h3>Fechas disponibles</h3>
                {cargandoFechas ? (
                  <div className="cargando">Cargando fechas disponibles...</div>
                ) : fechasDisponibles.length === 0 ? (
                  <div className="sin-fechas">No hay fechas disponibles para este tipo de audiencia</div>
                ) : (
                  <div className="fechas-grid">
                    {fechasDisponibles.map(fecha => (
                      <div
                        key={fecha}
                        className={`fecha-card ${formData.fecha === fecha ? 'seleccionada' : ''}`}
                        onClick={() => handleSelectFecha(fecha)}
                      >
                        {formatearFechaUTC(fecha)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {formData.fecha && (
                <div className="horarios-disponibles">
                  <h3>Horarios disponibles (30 min cada uno)</h3>
                  {cargandoHorarios ? (
                    <div className="cargando">Cargando horarios...</div>
                  ) : horariosDisponibles.length === 0 ? (
                    <div className="sin-horarios">No hay horarios disponibles para esta fecha</div>
                  ) : (
                    <div className="horarios-grid">
                      {horariosDisponibles.map(hObj => {
                        const ocupado = bookedSlots.some(b => b.fecha === formData.fecha && b.hora === hObj.horaInicio);
                        const seleccionado = formData.hora && horaTo24(formData.hora) === hObj.horaInicio;
                        return (
                          <div
                            key={hObj.hora}
                            className={`horario-card ${seleccionado ? 'seleccionado' : ''} ${ocupado ? 'ocupado' : ''}`}
                            onClick={() => !ocupado && setFormData(prev => ({ ...prev, hora: hObj.hora }))}
                          >
                            {hObj.hora}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {formData.fecha && horariosDisponibles.length === 0 && !cargandoHorarios && (
                <div className="sin-disponibilidad">
                  <p>No hay horarios disponibles para esta fecha.</p>
                  <p>Por favor seleccione otra fecha.</p>
                </div>
              )}

              <div className="informacion-lugar">
                <h4>📍 Lugar de atención:</h4>
                <p>{formData.lugarAtencion}</p>
              </div>

              {formData.fecha && formData.hora && (
                <div className="resumen-cita">
                  <h3>Confirmar cita</h3>
                  <div className="resumen-detalles">
                    <p><strong>📅 Fecha:</strong> {formatearFechaUTC(formData.fecha)}</p>
                    <p><strong>🕐 Hora:</strong> {formData.hora}</p>
                    <p><strong>📍 Lugar:</strong> {formData.lugarAtencion}</p>
                    <p><strong>👤 Tipo:</strong> {tiposAudiencia.find(t => t.id === tipoAudiencia)?.nombre}</p>
                  </div>
                  
                  <div className="botones-container">
                    <Button variant="secondary" onClick={() => setPaso(2)}>
                      Atrás
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                      Confirmar cita
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;