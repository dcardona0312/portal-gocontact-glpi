const db = require('../config/database');
const loginView = require('../views/loginView');

// Muestra la pantalla de Login
exports.showLogin = (req, res) => {
    res.send(loginView(req.query.telefono || '', req.query.error));
};

// Procesa el formulario de Login contra la Base de Datos
exports.login = (req, res) => {
    const { username, password, telefono_pendiente } = req.body;
    db.get(`SELECT * FROM usuarios WHERE usuario = ? AND contrasena = ?`, [username, password], (err, row) => {
        if (err || !row) return res.redirect(`/login?error=1&telefono=${telefono_pendiente}`);
        
        // Guardamos los datos en la sesión del navegador
        req.session.usuario = row.usuario;
        req.session.nombreAgente = row.nombre;
        
        // Si venía rebotado de una llamada de GoContact, lo mandamos allá de una vez
        res.redirect(telefono_pendiente ? `/atencion?telefono=${telefono_pendiente}` : '/atencion');
    });
};

// Cierra la sesión de forma segura
exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/login');
};

// Middleware para proteger las pantallas operativas
exports.verificarSesion = (req, res, next) => {
    if (req.session && req.session.usuario) return next();
    res.redirect(req.query.telefono ? `/login?telefono=${req.query.telefono}` : '/login');
};