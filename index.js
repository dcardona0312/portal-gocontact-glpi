const express = require('express');
const session = require('express-session');
const webRoutes = require('./routes/web'); // Importamos nuestro mapa de rutas modulares
const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARES PARA PROCESAR FORMULARIOS Y JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CONFIGURACIÓN DE SESIONES EN EL NAVEGADOR
app.use(session({
    secret: 'mi_clave_secreta_super_segura_carvajal', 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 2 * 60 * 60 * 1000 } // La sesión expira en 2 horas de inactividad
}));

// CONTROL DE IFRAME (SEGUIMIENTO DE SEGURIDAD PARA GOCONTACT)
app.use((req, res, next) => {
    res.removeHeader('X-Frame-Options');
    res.setHeader("Content-Security-Policy", "frame-ancestors 'self' https://americasbps2.gocontact.com");
    next();
});

// ENLAZAR TODAS LAS URLs DEL SISTEMA
app.use('/', webRoutes);

// ENCENDER EL MOTOR
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Servidor ARQUITECTURA MVC encendido con éxito`);
    console.log(`🔗 Local: http://localhost:${PORT}`);
    console.log(`==================================================`);
});