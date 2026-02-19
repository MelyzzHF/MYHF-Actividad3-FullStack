import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://localhost:3000';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [postres, setPostres] = useState([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [auth, setAuth] = useState({ username: '', email: '', password: '', role: 'user' });
  const [postre, setPostre] = useState({ nombre: '', description: '', precio: '', cantidad: '', imagen_url: '' });

  useEffect(() => {
    const obtenerPostres = async () => {
      const res = await fetch(`${API_URL}/postres`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setPostres(await res.json());
    };

    if (token) obtenerPostres();
  }, [token]);

  const obtenerPostres = async () => {
    const res = await fetch(`${API_URL}/postres`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setPostres(await res.json());
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/register' : '/login';
    const body = isRegistering
      ? { username: auth.username, email: auth.email, password: auth.password, role: auth.role }
      : { username: auth.username, password: auth.password };

    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (res.ok) {
      if (isRegistering) {
        alert("¡Registrado! Ahora inicia sesión");
        setIsRegistering(false);
      } else {
        localStorage.setItem('token', data.token);
        setToken(data.token);
      }
    } else {
      alert(data.error);
    }
  };

  const actualizarStockManual = async (p, cambio) => {
    const nuevaCant = parseInt(p.cantidad) + cambio;
    if (nuevaCant < 0) return;

    const res = await fetch(`${API_URL}/postres/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ ...p, cantidad: nuevaCant, agotado: nuevaCant === 0 ? 1 : 0 })
    });
    if (res.ok) obtenerPostres();
    else {
      const data = await res.json();
      alert(data.error || "No tiene permiso");
    }
  };

  const nuevoPostre = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/postres`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        nombre: postre.nombre, description: postre.description,
        precio: postre.precio, cantidad: postre.cantidad, imagen_url: postre.imagen_url
      })
    });
    if (res.ok) {
      setPostre({nombre: '', description: '', precio: '', cantidad: '', imagen_url: '' });
      obtenerPostres();
    } else {
      const data = await res.json();
      alert(data.error || "No tienes permiso para crear tareas");
    }
  };

  const editarPostre = async (t) => {
    const nuevoNombre = prompt("Nuevo nombre:", t.nombre);
    const nuevaDesc = prompt("Nueva descripción:", t.description);
    const nuevoPrecio = prompt("Precio:", t.precio);

    if (nuevoNombre !== null) {
      const res = await fetch(`${API_URL}/postres/${t.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...t, nombre: nuevoNombre, description: nuevaDesc, precio: nuevoPrecio })
      });
      if (res.ok) obtenerPostres();
      else {
        const data = await res.json();
        alert(data.error);
      }
    }
  };

  const toggleAgotado = async (t) => {
    const res = await fetch(`${API_URL}/postres/${t.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ ...t, agotado: t.agotado ? 0 : 1 })
    });
    if (res.ok) obtenerPostres();
    else {
      const data = await res.json();
      alert(data.error);
      obtenerPostres();
    }
  };

  const eliminarPostre = async (id) => {
    if (window.confirm("¿Borrar este postre?")) {
      const res = await fetch(`${API_URL}/postres/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        obtenerPostres();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    }
  };

  if (!token) {
    return (
      <div className="inicioSesion">
        <h2>{isRegistering ? 'Crear Cuenta' : 'Bienvenido'}</h2>
        <form onSubmit={handleAuth} className="registrarse">
          <input placeholder="Usuario" value={auth.username} onChange={e => setAuth({ ...auth, username: e.target.value })} required />
          {isRegistering && (
            <>
              <input type="email" placeholder="Email" value={auth.email} onChange={e => setAuth({ ...auth, email: e.target.value })} required />
              <select value={auth.role} onChange={e => setAuth({ ...auth, role: e.target.value })}>
                <option value="user">Soy Cliente</option>
                <option value="admin">Soy Admin</option>
              </select>
            </>
          )}
          <input type="password" placeholder="Contraseña" value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })} required />
          <button type="submit">{isRegistering ? 'Registrar' : 'Entrar'}</button>
        </form>
        <button onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? 'Ya tengo cuenta' : 'No tengo cuenta, registrarme'}
        </button>
      </div>
    );
  }

  return (
    <div className="contenedorGeneral">
      <div class="barra">
        <h1 id="tituloPrincipal">Sweet Home - Catálogo de Pasteles</h1>
        <button onClick={() => { localStorage.removeItem('token'); setToken(null); }}>Cerrar Sesión</button>
      </div>

      <form onSubmit={nuevoPostre} className="postre-form">
        <input placeholder="Nombre del Postre" value={postre.nombre} onChange={e => setPostre({ ...postre, nombre: e.target.value })} required />
        <input placeholder="Descripción" value={postre.description} onChange={e => setPostre({ ...postre, description: e.target.value })} />
        <input type="number" placeholder="Precio $" value={postre.precio} onChange={e => setPostre({ ...postre, precio: e.target.value })} required />
        <input type="number" placeholder="Stock" value={postre.cantidad} onChange={e => setPostre({ ...postre, cantidad: e.target.value })} required />
        <input placeholder="URL Imagen" value={postre.imagen_url} onChange={e => setPostre({ ...postre, imagen_url: e.target.value })} />
        <button type="submit">Añadir</button>
      </form>

      <div className="postre-completada">
        {postres.map(t => (
          <div key={t.id} className={`postre-card ${t.agotado ? 'agotado' : ''}`}>
            {t.imagen_url && <img src={t.imagen_url} alt={t.nombre} className="postre-foto" />}
            <div className="contenedorPostres">

              <div className="contador-box">
                <button
                  onClick={() => actualizarStockManual(t, -1)}
                  disabled={t.cantidad <= 0}
                >-</button>
                <span>{t.cantidad}</span>
                <button
                  onClick={() => actualizarStockManual(t, 1)}>+</button>
              </div>

              <small className={t.cantidad <= 3 && t.cantidad > 0 ? 'stock-bajo' : ''}>
                {t.agotado ? "AGOTADO" : `Quedan: ${t.cantidad} unidades`}
              </small>


              <input
                type="checkbox"
                checked={t.agotado === 1 || t.agotado === true}
                onChange={() => toggleAgotado(t)}
                className="postre-checkbox"
              />
              <div className="text-info">
                <h3>{t.nombre} <span className="precio-tag">${t.precio}</span></h3>
                <p>{t.description}</p>
              </div>
            </div>
            <div className="btns">
              <button onClick={() => editarPostre(t)}>Editar</button>
              <button onClick={() => eliminarPostre(t.id)} className="btn-delete">Borrar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;