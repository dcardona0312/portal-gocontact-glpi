const express = require('express');
const session = require('express-session');
const webRoutes = require('./routes/web'); // Importamos nuestro mapa de rutas modulares
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'mi_clave_secreta_super_segura_carvajal', 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 2 * 60 * 60 * 1000 } 
}));

app.use((req, res, next) => {
    res.removeHeader('X-Frame-Options');
    res.setHeader("Content-Security-Policy", "frame-ancestors 'self' https://americasbps2.gocontact.com");
    next();
});

app.use('/', webRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Servidor Repositorio Activo en Puerto ${PORT}`);
});