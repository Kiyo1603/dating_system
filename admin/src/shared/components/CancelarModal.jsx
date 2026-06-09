import React from 'react';
import './CancelarModal.css';

const CancelarModal = ({ isOpen, onClose, onConfirm, folio }) => {
  const [motivo, setMotivo] = React.useState('');
  const [otroMotivo, setOtroMotivo] = React.useState('');

  const motivosPredefinidos = [
    { id: 'cliente_cancelo', label: '📞 El cliente canceló la cita' },
    { id: 'problema_agenda', label: '📅 Problema de agenda del personal' },
    { id: 'documentacion_incompleta', label: '📄 Documentación incompleta' },
    { id: 'inasistencia_cliente', label: '🚫 El cliente no asistió' },
    { id: 'emergencia', label: '🚨 Emergencia o caso fortuito' },
    { id: 'duplicada', label: '🔄 Cita duplicada' },
    { id: 'otro', label: '📝 Otro motivo' }
  ];

  const handleConfirm = () => {
    let motivoFinal = '';
    
    if (motivo === 'otro') {
      if (!otroMotivo.trim()) {
        alert('Por favor especifique el motivo');
        return;
      }
      motivoFinal = otroMotivo;
    } else {
      const selected = motivosPredefinidos.find(m => m.id === motivo);
      motivoFinal = selected ? selected.label : motivo;
    }
    
    onConfirm(motivoFinal);
  };

  if (!isOpen) return null;

  return (
    <div className="cancelar-modal-overlay" onClick={onClose}>
      <div className="cancelar-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="cancelar-modal-header">
          <h3>⚠️ Cancelar Cita</h3>
          <button className="cancelar-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="cancelar-modal-body">
          <p>¿Está seguro de cancelar la cita?</p>
          <p className="folio-info">Folio: <strong>{folio}</strong></p>
          
          <div className="cancelar-motivos">
            <label>Seleccione el motivo de cancelación:</label>
            <div className="motivos-lista">
              {motivosPredefinidos.map(m => (
                <label key={m.id} className="motivo-radio">
                  <input
                    type="radio"
                    name="motivo"
                    value={m.id}
                    checked={motivo === m.id}
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                  <span>{m.label}</span>
                </label>
              ))}
            </div>
            
            {motivo === 'otro' && (
              <div className="otro-motivo">
                <label>Especifique el motivo:</label>
                <textarea
                  rows="3"
                  placeholder="Describa el motivo de cancelación..."
                  value={otroMotivo}
                  onChange={(e) => setOtroMotivo(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="cancelar-modal-footer">
          <button className="cancelar-btn-cancelar" onClick={onClose}>
            No, regresar
          </button>
          <button 
            className="cancelar-btn-confirmar" 
            onClick={handleConfirm}
            disabled={!motivo}
          >
            Sí, cancelar cita
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelarModal;