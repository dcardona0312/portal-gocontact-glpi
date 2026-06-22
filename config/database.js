const sqlite3 = require('sqlite3').verbose();

// 1. Conexión física al archivo de la base de datos
const db = new sqlite3.Database('./portal_data.db', (err) => {
    if (err) return console.error("Error al conectar BD:", err.message);
    console.log("Base de datos SQLite conectada correctamente.");
});

// 2. Inicialización de las tablas del sistema
db.serialize(() => {
    // Tabla para los Agentes que inician sesión (Diego, Jurgen, Gilmar, Juan)
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT UNIQUE,
        contrasena TEXT,
        nombre TEXT,
        rol TEXT
    )`);

    // Tabla para el Repositorio de Colaboradores de Carvajal
    db.run(`CREATE TABLE IF NOT EXISTS colaboradores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cedula TEXT UNIQUE,
        telefono TEXT UNIQUE,
        nombre TEXT,
        cargo TEXT,
        area TEXT
    )`);

    // Tabla para registrar el Historial de Casos Atendidos
    db.run(`CREATE TABLE IF NOT EXISTS historial_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telefono TEXT,
        agente TEXT,
        categoria TEXT,
        titulo TEXT,
        descripcion TEXT,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 3. Inyección automática de los Agentes autorizados
    const usuariosIniciales = [
        { user: 'diego.cardona', pass: 'Carvajal2026*', nombre: 'Diego Cardona', rol: 'agente' },
        { user: 'jurgen.giron', pass: 'Carvajal2026*', nombre: 'Jurgen Giron', rol: 'agente' },
        { user: 'gilmar.aranda', pass: 'Carvajal2026*', nombre: 'Gilmar Aranda', rol: 'agente' },
        { user: 'juan.minnota', pass: 'Carvajal2026*', nombre: 'Juan Minnota', rol: 'agente' }
    ];

    usuariosIniciales.forEach(u => {
        db.run(`INSERT OR IGNORE INTO usuarios (usuario, contrasena, nombre, rol) VALUES (?, ?, ?, ?)`, 
            [u.user, u.pass, u.nombre, u.rol]);
    });

    // 4. Datos de prueba iniciales para el Repositorio de Colaboradores
    db.run(`INSERT OR IGNORE INTO colaboradores (cedula, telefono, nombre, cargo, area) 
            VALUES ('10203040', '300123456', 'Carlos Sotelo', 'Analista de Soporte', 'Tecnología')`);
            
    db.run(`INSERT OR IGNORE INTO colaboradores (cedula, telefono, nombre, cargo, area) 
            VALUES ('50607080', '315987654', 'Ana María Gómez', 'Coordinadora de Operaciones', 'Logística')`);
});

// 5. Exportamos la conexión para que los controladores puedan consultarla
module.exports = db;