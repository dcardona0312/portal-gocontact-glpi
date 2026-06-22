const express = require('express');
const router = express.Router();

// Importamos los controladores que acabas de crear
const authController = require('../controllers/authController');
const ticketController = require('../controllers/ticketController');
const adminController = require('../controllers/adminController');

// ==========================================
// RUTAS DE AUTENTICACIÓN (LOGIN / LOGOUT)
// ==========================================
router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// ==========================================
// RUTAS OPERATIVAS (PROTEGIDAS CON SESIÓN)
// ==========================================
// El "authController.verificarSesion" actúa como un guardián; si no hay login, rebota al usuario
router.get('/atencion', authController.verificarSesion, ticketController.showAtencion);
router.post('/registrar-caso', authController.verificarSesion, ticketController.registrarCaso);
router.get('/admin', authController.verificarSesion, adminController.showAdmin);
router.post('/crear-colaborador', authController.verificarSesion, ticketController.crearColaborador);

// Exportamos el enrutador para que el index.js principal pueda leerlo
module.exports = router;