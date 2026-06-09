import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../shared/components/Navbar';
import Button from '../shared/components/Button';
import CancelarModal from '../shared/components/CancelarModal';
import './AppointmentsPage.css';

const AppointmentsPage = () => {
  const [citas, setCitas] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  
  const [modalCancelarOpen, setModalCancelarOpen] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);

  const formatearFechaUTC = (fechaStr) => {
    const fecha = new Date(fechaStr);
    const año = fecha.getUTCFullYear();
    const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getUTCDate()).padStart(2, '0');
    return `${dia}/${mes}/${año}`;
  };

  const cargarCitas = useCallback(async () => {
    setCargando(true);
    try {
      let url = `http://localhost:3003/api/citas/todas?page=${pagina}&limit=20`;
      if (filtroEstado !== 'todas') url += `&estado=${filtroEstado}`;
      if (filtroTipo !== 'todos') url += `&tipo=${filtroTipo}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setCitas(data);
        setTotalPaginas(Math.ceil(data.length / 20) || 1);
      } else if (data.citas && Array.isArray(data.citas)) {
        setCitas(data.citas);
        setTotalPaginas(data.totalPaginas || 1);
      } else {
        setCitas([]);
      }
    } catch (error) {
      console.error('Error cargando citas:', error);
      setCitas([]);
    } finally {
      setCargando(false);
    }
  }, [pagina, filtroEstado, filtroTipo]);

  useEffect(() => {
    cargarCitas();
  }, [cargarCitas]);

  const handleCancelarCita = async (motivo) => {
    if (!citaSeleccionada) return;
    
    try {
      const response = await fetch(`http://localhost:3003/api/citas/${citaSeleccionada.folio}/cancelar`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo, motivoTexto: motivo })
      });
      
      if (response.ok) {
        alert(`✅ Cita ${citaSeleccionada.folio} cancelada exitosamente`);
        setModalCancelarOpen(false);
        setCitaSeleccionada(null);
        cargarCitas();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || 'No se pudo cancelar'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cancelar la cita');
    }
  };

  const abrirModalCancelar = (cita) => {
    setCitaSeleccionada(cita);
    setModalCancelarOpen(true);
  };

  const cambiarEstado = async (folio, nuevoEstado) => {
    try {
      let url = '';
      let method = '';
      let body = null;
      
      switch(nuevoEstado) {
        case 'confirmada':
          url = `http://localhost:3003/api/citas/${folio}/confirmar`;
          method = 'PUT';
          break;
        case 'cancelada':
          return;
        case 'atendida':
          const esResuelto = window.confirm('¿La audiencia fue resuelta exitosamente?');
          let motivoNoResolucion = '';
          if (!esResuelto) {
            motivoNoResolucion = prompt('Motivo por el que no se resolvió:');
            if (!motivoNoResolucion) return;
          }
          url = `http://localhost:3003/api/citas/${folio}/atender`;
          method = 'POST';
          body = JSON.stringify({ resuelto: esResuelto, motivoNoResolucion, observaciones: '' });
          break;
        default:
          return;
      }
      
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body });
      
      if (response.ok) {
        alert(`✅ Cita ${nuevoEstado === 'confirmada' ? 'confirmada' : 'actualizada'}`);
        cargarCitas();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.mensaje || 'No se pudo actualizar'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el estado');
    }
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
        <h1>Gestión de Citas</h1>
        
        <div className="filtros-container">
          <div className="filtro-grupo">
            <label>Estado:</label>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="todas">Todas</option>
              <option value="pendiente">Por Confirmar</option>
              <option value="confirmada">Confirmadas</option>
              <option value="atendida">Atendidas</option>
              <option value="cancelada">Canceladas</option>
              <option value="no_resuelta">No resueltas</option>
            </select>
          </div>
          
          <div className="filtro-grupo">
            <label>Tipo:</label>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="ciudadano">Ciudadano</option>
              <option value="localidad">Localidad</option>
              <option value="empresa">Empresa</option>
              <option value="autoridad">Autoridad</option>
            </select>
          </div>
          
          <Button variant="primary" size="small" onClick={() => { setPagina(1); cargarCitas(); }}>
            Buscar
          </Button>
        </div>

        {cargando ? (
          <div className="cargando">Cargando citas...</div>
        ) : citas.length === 0 ? (
          <p className="sin-citas">No hay citas para mostrar</p>
        ) : (
          <>
            <div className="tabla-container">
              <table className="citas-table">
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th>Tipo</th>
                    <th>Motivo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {citas.map(cita => (
                    <tr key={cita.folio || cita._id}>
                      <td>{cita.folio}</td>
                      <td>{formatearFechaUTC(cita.fecha)}</td>
                      <td>{cita.horaInicio}</td>
                      <td>{cita.nombre}</td>
                      <td>{cita.telefono}</td>
                      <td>{cita.tipoAudiencia}</td>
                      <td className="motivo-cell">{cita.motivo}</td>
                      <td>{getEstadoBadge(cita.estado)}</td>
                      <td className="acciones-cell">
                        {cita.estado === 'pendiente' && (
                          <>
                            <button className="btn-confirmar" onClick={() => cambiarEstado(cita.folio, 'confirmada')}>
                              Confirmar
                            </button>
                            <button className="btn-cancelar" onClick={() => abrirModalCancelar(cita)}>
                              Cancelar
                            </button>
                          </>
                        )}
                        {cita.estado === 'confirmada' && (
                          <>
                            <button className="btn-atender" onClick={() => cambiarEstado(cita.folio, 'atendida')}>
                              Atendida
                            </button>
                            <button className="btn-cancelar" onClick={() => abrirModalCancelar(cita)}>
                              Cancelar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="paginacion">
              <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)}>Anterior</button>
              <span>Página {pagina} de {totalPaginas}</span>
              <button disabled={pagina === totalPaginas} onClick={() => setPagina(p => p + 1)}>Siguiente</button>
            </div>
          </>
        )}
      </div>

      <CancelarModal
        isOpen={modalCancelarOpen}
        onClose={() => {
          setModalCancelarOpen(false);
          setCitaSeleccionada(null);
        }}
        onConfirm={handleCancelarCita}
        folio={citaSeleccionada?.folio}
      />
    </div>
  );
};

export default AppointmentsPage;