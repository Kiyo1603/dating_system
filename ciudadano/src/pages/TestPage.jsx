import React, { useState, useEffect } from 'react';

const TestPage = () => {
  const [fechas, setFechas] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3003/api/disponibilidad/empresa')
      .then(r => r.json())
      .then(data => setFechas(data));
  }, []);

  // Función CORRECTA para formatear fecha usando UTC
  const formatearFecha = (fechaStr) => {
  const [year, month, day] = fechaStr.split('-');
  // Método 1: Usar setUTCHours para fijar el mediodía UTC
  const fecha = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return fecha.toLocaleDateString('es-MX', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'UTC'
  });
};

console.log(formatearFecha('2026-05-27'));

  return (
    <div style={{ padding: 20 }}>
      <h1>PRUEBA DIRECTA - Empresas</h1>
      <h2>Fechas del backend:</h2>
      {fechas.map(f => (
        <div key={f.fecha}>✅ {formatearFecha(f.fecha)}</div>
      ))}
    </div>
  );
};

export default TestPage;