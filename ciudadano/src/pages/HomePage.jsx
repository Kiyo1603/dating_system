import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import Navbar from '../shared/components/Navbar';
import Button from '../shared/components/Button';

const HomePage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="ciudadano-app">
      <Navbar tipo="ciudadano" />
      
      <div className="container">
        <header className="hero-section">
          <div className="hero-content">
            <h1>Bienvenido al Sistema de Citas</h1>
            <p>Municipio de AMATAN, Palenque Chiapas</p>
            <Button variant="primary" onClick={() => navigate('/agendar')}>
              Agendar Nueva Cita
            </Button>
          </div>
        </header>
      </div>
    </div>
  );
};

export default HomePage;