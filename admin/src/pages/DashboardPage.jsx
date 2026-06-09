import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../shared/components/Navbar';
import Button from '../shared/components/Button';
import './DashboardPage.css';

const DashboardPage = () => {
  const [estadisticas, setEstadisticas] = useState({
    diarias: { total: 0, atendidas: 0, pendientes: 0, confirmadas: 0, canceladas: 0 },
    mensuales: { total: 0, resueltas: 0, noResueltas: 0 },
    porTipo: { ciudadano: 0, localidad: 0, empresa: 0, autoridad: 0 }
  });

  const [citasHoy, setCitasHoy] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [expedienteBuscado, setExpedienteBuscado] = useState('');
  const [expedienteResultado, setExpedienteResultado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);

  // Función para formatear fecha correctamente usando UTC
  const formatearFechaUTC = (fechaStr) => {
    const fecha = new Date(fechaStr);
    const año = fecha.getUTCFullYear();
    const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getUTCDate()).padStart(2, '0');
    return `${dia}/${mes}/${año}`;
  };

  const formatearFechaLargaUTC = (fechaStr) => {
    const fecha = new Date(fechaStr);
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const diaSemana = dias[fecha.getUTCDay()];
    const dia = fecha.getUTCDate();
    const mes = meses[fecha.getUTCMonth()];
    const año = fecha.getUTCFullYear();
    
    return `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)}, ${dia} de ${mes} de ${año}`;
  };

  // Usar useCallback para evitar dependencia infinita
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [estadisticasRes, citasRes] = await Promise.all([
        fetch('http://localhost:3003/api/estadisticas'),
        fetch(`http://localhost:3003/api/citas/fecha/${fechaSeleccionada}`)
      ]);
      
      const estadisticasData = await estadisticasRes.json();
      let citasData = await citasRes.json();
      
      if (!Array.isArray(citasData)) {
        citasData = citasData.citas || citasData.data || [];
      }
      
      setEstadisticas(estadisticasData);
      setCitasHoy(citasData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setCitasHoy([]);
    } finally {
      setCargando(false);
    }
  }, [fechaSeleccionada]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Resto de funciones igual...
  const handleConfirmarCita = async (folio) => {
    try {
      const response = await fetch(`http://localhost:3003/api/citas/${folio}/confirmar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`✅ Cita ${folio} confirmada exitosamente`);
        cargarDatos();
      } else {
        alert(`❌ Error: ${data.error || 'No se pudo confirmar'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al confirmar cita');
    }
  };

  const handleAtenderCita = async (folio, resuelto) => {
    let motivoNoResolucion = '';
    
    if (!resuelto) {
      motivoNoResolucion = prompt('Especifique el motivo por el que no se resolvió:');
      if (!motivoNoResolucion) return;
    }
    
    const observaciones = prompt('Observaciones adicionales (opcional):') || '';
    
    try {
      const response = await fetch(`http://localhost:3003/api/citas/${folio}/atender`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resuelto, motivoNoResolucion, observaciones })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(resuelto ? `✅ Cita ${folio} marcada como resuelta` : `⚠️ Cita ${folio} marcada como no resuelta`);
        cargarDatos();
      } else {
        alert(`❌ Error: ${data.error || 'No se pudo actualizar'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar atención');
    }
  };

  const buscarExpediente = async () => {
  if (!expedienteBuscado) return;
  
  setCargando(true);
  try {
    let response;
    
    // Determinar si es un folio (empieza con CIT-) o un nombre
    if (expedienteBuscado.toUpperCase().startsWith('CIT-')) {
      // Buscar por folio de cita
      response = await fetch(`http://localhost:3003/api/expediente/folio/${encodeURIComponent(expedienteBuscado)}`);
    } else {
      // Buscar por nombre/identificador
      response = await fetch(`http://localhost:3003/api/expediente/${encodeURIComponent(expedienteBuscado)}`);
    }
    
    if (response.ok) {
      const data = await response.json();
      setExpedienteResultado(data);
    } else {
      alert('Expediente no encontrado. Puede buscar por:\n- Nombre de persona\n- Nombre de comunidad\n- Nombre de empresa\n- Folio de cita (ej. CIT-202605-0001)');
      setExpedienteResultado(null);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al buscar expediente');
  } finally {
    setCargando(false);
  }
};

  const cambiarFecha = (dias) => {
    const nuevaFecha = new Date(fechaSeleccionada);
    nuevaFecha.setUTCDate(nuevaFecha.getUTCDate() + dias);
    setFechaSeleccionada(nuevaFecha.toISOString().split('T')[0]);
  };

  const getEstadoBadge = (estado) => {
    const clases = {
      pendiente: 'estado-pendiente',
      confirmada: 'estado-confirmada',
      atendida: 'estado-atendida',
      cancelada: 'estado-cancelada',
      no_resuelta: 'estado-no-resuelta'
    };
    return <span className={`estado-badge ${clases[estado] || ''}`}>{estado}</span>;
  };

  return (
    <div className="admin-app">
      <Navbar tipo="admin" />
      
      <div className="container">
        <header className="dashboard-header">
          <h1>Panel de Administración</h1>
          <p>Secretaría Municipal de AMATAN, Palenque Chiapas</p>
        </header>

        {cargando ? (
          <div className="cargando">Cargando datos...</div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card diario">
                <h3>Audiencias Hoy</h3>
                <div className="stat-number">{estadisticas.diarias?.total || 0}</div>
                <div className="stat-detalle">
                  <span>Atendidas: {estadisticas.diarias?.atendidas || 0}</span>
                  <span>Pendientes: {estadisticas.diarias?.pendientes || 0}</span>
                </div>
              </div>

              <div className="stat-card mensual">
                <h3>Audiencias Mes</h3>
                <div className="stat-number">{estadisticas.mensuales?.total || 0}</div>
                <div className="stat-detalle">
                  <span className="resueltas">✅ Resueltas: {estadisticas.mensuales?.resueltas || 0}</span>
                  <span className="no-resueltas">❌ No resueltas: {estadisticas.mensuales?.noResueltas || 0}</span>
                </div>
              </div>

              <div className="stat-card por-tipo">
                <h3>Por Tipo</h3>
                <div className="tipos-stats">
                  <div>👤 Autoridades: {estadisticas.porTipo?.autoridad || 0}</div>
                  <div>🏘️ Localidad: {estadisticas.porTipo?.localidad || 0}</div>
                  <div>🏢 Empresa: {estadisticas.porTipo?.empresa || 0}</div>
                </div>
              </div>
            </div>

            <section className="citas-hoy">
              <div className="fecha-selector">
                <button onClick={() => cambiarFecha(-1)}>◀ Anterior</button>
                <h2>Audiencias del {formatearFechaLargaUTC(fechaSeleccionada)}</h2>
                <button onClick={() => cambiarFecha(1)}>Siguiente ▶</button>
                <button onClick={() => setFechaSeleccionada(new Date().toISOString().split('T')[0])}>Hoy</button>
              </div>
              
              {citasHoy.length === 0 ? (
                <p className="sin-citas">No hay audiencias programadas para esta fecha</p>
              ) : (
                <div className="citas-lista">
                  {citasHoy.map(cita => (
                    <div key={cita.folio || cita._id} className="cita-card">
                      <div className="cita-header">
                        <span className={`tipo-badge tipo-${cita.tipoAudiencia}`}>
                          {cita.tipoAudiencia === 'ciudadano' ? 'Ciudadano' :
                           cita.tipoAudiencia === 'localidad' ? 'Localidad' : 
                           cita.tipoAudiencia === 'autoridad' ? 'Autoridad' : 'Empresa'}
                        </span>
                        <span className="folio">Folio: {cita.folio}</span>
                        {getEstadoBadge(cita.estado)}
                      </div>

                      <div className="cita-body">
                        <div className="cita-info">
                          <div className="info-row"><strong>⏰ Hora:</strong> {cita.horaInicio} - {cita.horaFin}</div>
                          <div className="info-row"><strong>👤 Nombre:</strong> {cita.nombre}</div>
                          <div className="info-row"><strong>📞 Teléfono:</strong> {cita.telefono}</div>
                          <div className="info-row"><strong>✉️ Correo:</strong> {cita.correo}</div>
                          {cita.cargo && <div className="info-row"><strong>📋 Cargo:</strong> {cita.cargo}</div>}
                          <div className="info-row"><strong>📍 De dónde es:</strong> {cita.lugarOrigen}</div>
                          {cita.comunidad && <div className="info-row"><strong>🏘️ Comunidad:</strong> {cita.comunidad}</div>}
                          {cita.empresa?.nombre && (
                            <>
                              <div className="info-row"><strong>🏢 Empresa:</strong> {cita.empresa.nombre}</div>
                              <div className="info-row"><strong>👔 Representante:</strong> {cita.empresa.representante}</div>
                            </>
                          )}
                          <div className="info-row motivo"><strong>📝 Motivo:</strong> {cita.motivo}</div>
                          <div className="info-row descripcion"><strong>📄 Descripción:</strong> {cita.descripcion}</div>
                          <div className="info-row"><strong>📍 Lugar:</strong> {cita.lugarAtencion}</div>
                        </div>
                      </div>

                      {cita.estado === 'pendiente' && (
                        <div className="cita-acciones">
                          <Button variant="success" size="small" onClick={() => handleConfirmarCita(cita.folio)}>
                            ✅ Confirmar
                          </Button>
                        </div>
                      )}

                      {cita.estado === 'confirmada' && (
                        <div className="cita-acciones">
                          <Button variant="success" size="small" onClick={() => handleAtenderCita(cita.folio, true)}>
                            ✓ Resuelto
                          </Button>
                          <Button variant="danger" size="small" onClick={() => handleAtenderCita(cita.folio, false)}>
                            ✗ No resuelto
                          </Button>
                        </div>
                      )}

                      {cita.resolucion && (
                        <div className={`resolucion-badge ${cita.resolucion.resuelto ? 'resuelto' : 'no-resuelto'}`}>
                          {cita.resolucion.resuelto ? '✅ Problema resuelto' : '❌ No se pudo resolver'}
                          {cita.resolucion.motivoNoResolucion && (
                            <div className="motivo">Motivo: {cita.resolucion.motivoNoResolucion}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="expedientes-section">
              <h2>Consulta de Expediente</h2>
              <p>Historial completo de citas por persona, comunidad o empresa</p>
              
              <div className="busqueda-expediente">
                <input
                  type="text"
                  placeholder="Nombre de la persona, comunidad o empresa"
                  value={expedienteBuscado}
                  onChange={(e) => setExpedienteBuscado(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && buscarExpediente()}
                />
                <Button variant="primary" onClick={buscarExpediente}>
                  Buscar Expediente
                </Button>
              </div>

              {expedienteResultado && (
                <div className="expediente-resultado">
                  <h3>Expediente: {expedienteResultado.identificador}</h3>
                  <div className="expediente-stats">
                    <div>Total de citas: {expedienteResultado.totalCitas}</div>
                    <div>Resueltas: {expedienteResultado.citasResueltas}</div>
                    <div>No resueltas: {expedienteResultado.citasNoResueltas}</div>
                  </div>
                  
                  <div className="historial-citas">
                    <h4>Historial de citas</h4>
                    {expedienteResultado.citas?.map((cita, index) => (
                      <div key={index} className="historial-item">
                        <div className="fecha">{formatearFechaUTC(cita.fecha)}</div>
                        <div className="detalle">
                          <div>Folio: {cita.folio}</div>
                          <div>Motivo: {cita.motivo}</div>
                          <div className={`resultado ${cita.resuelto ? 'resuelto' : 'no-resuelto'}`}>
                            {cita.resuelto ? '✅ Resuelto' : '❌ No resuelto'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;