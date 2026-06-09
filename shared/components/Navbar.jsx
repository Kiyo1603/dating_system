import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ tipo = 'ciudadano' }) => {
  const location = useLocation();
  
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <div className="brand-logo">P</div>
          <div className="brand-text">
            <h2>Municipalidad de Palenque</h2>
            <p>{tipo === 'admin' ? 'Panel Administrativo' : 'Sistema de Citas'}</p>
          </div>
        </div>
        <div className="navbar-menu">
          {tipo === 'admin' ? (
            <>
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                Dashboard
              </Link>
              <Link to="/citas" className={`nav-link ${location.pathname === '/citas' ? 'active' : ''}`}>
                Gestión de Citas
              </Link>
            </>
          ) : (
            <>
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                Inicio
              </Link>
              <Link to="/agendar" className={`nav-link ${location.pathname === '/agendar' ? 'active' : ''}`}>
                Agendar Cita
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
