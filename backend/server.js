const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();


const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT;
const SECRET_KEY = process.env.SECRET_KEY;

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

function autenticarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Acceso Denegado' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
}

function esAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: "Acceso denegado: Se requiere rol de Administrador" });
    }
}

app.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;
    const hashed = await bcrypt.hash(password, 10);

    const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
    db.execute(query, [username, email, hashed, role || 'user'], (err) => {
        if (err) return res.status(500).json({ error: "Error al registrar usuario" });
        res.status(201).json({ mensaje: "Usuario creado exitosamente" });
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.execute('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (results.length === 0 || !(await bcrypt.compare(password, results[0].password))) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }
        const token = jwt.sign({ id: results[0].id, role: results[0].role }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token });
    });
});


app.get('/postres', autenticarToken, (req, res) => {
    db.execute('SELECT * FROM postres ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/postres', autenticarToken, esAdmin, (req, res) => {
    const { nombre, description, precio, cantidad, imagen_url } = req.body;
    const agotadoAuto = cantidad <= 0 ? 1 : 0;
    const query = 'INSERT INTO postres (nombre, description, precio, cantidad, agotado, imagen_url, creado_por) VALUES (?, ?, ?, ?, ?, ?, ?)';

    db.execute(query, [nombre, description, precio, cantidad, agotadoAuto, imagen_url, req.user.id], (err) => {
        if (err) return res.status(500).json({ error: "Error al guardar postre" });
        res.status(201).json({ mensaje: "Postre añadido" });
    });
});

app.put('/postres/:id', autenticarToken, esAdmin, (req, res) => {
    let { nombre, description,precio, cantidad, agotado, imagen_url } = req.body;
    const { id } = req.params;
    if (parseInt(cantidad) <= 0) agotado = 1;

    const query = 'UPDATE postres SET nombre = ?, description = ?, precio = ?, cantidad = ?, agotado = ?, imagen_url = ? WHERE id = ?';

    db.execute(query, [nombre, description, precio, cantidad, agotado, imagen_url, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: "Error al actualizar" });
        res.json({ mensaje: "Postre actualizado con éxito" });
    });
});

app.delete('/postres/:id', autenticarToken, esAdmin, (req, res) => {
    db.execute('DELETE FROM postres WHERE id = ?', [req.params.id,], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Postre eliminado" });
    });
});

app.use((err, req, res, next) => {
    console.error("DETALLE DEL ERROR:", err.message);
    res.status(500).json({ error: err.message || "Error interno del servidor" });
});




app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));


