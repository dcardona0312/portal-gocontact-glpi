const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session'); // ← Nueva librería para sesiones
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CONFIGURACIÓN DE SESIONES (Duración de 2 horas en memoria)
app.use(session({
    secret: 'mi_clave_secreta_super_segura', 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 2 * 60 * 60 * 1000 } 
}));

// CONFIGURACIÓN DE LA BASE DE DATOS
const db = new sqlite3.Database('./portal_data.db', (err) => {
    if (err) return console.error("Error al conectar BD:", err.message);
    console.log("Base de datos conectada.");
});

// Asegurar que existan todas las tablas, incluyendo la de USUARIOS
db.serialize(() => {
    // Tabla de Usuarios del sistema (Agentes y Admin)
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT UNIQUE,
        contrasena TEXT,
        nombre TEXT,
        rol TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS colaboradores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telefono TEXT UNIQUE,
        nombre TEXT,
        cargo TEXT,
        area TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS historial_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telefono TEXT,
        agente TEXT,
        categoria TEXT,
        titulo TEXT,
        descripcion TEXT,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Inyectar los 4 usuarios reales del equipo de soporte
    const usuariosIniciales = [
        { user: 'diego.cardona', pass: 'Carvajal2026*', nombre: 'Diego Cardona', rol: 'agente' },
        { user: 'jurgen.giron', pass: 'Carvajal2026*', nombre: 'Jurgen Giron', rol: 'agente' },
        { user: 'gilmar.aranda', pass: 'Carvajal2026*', nombre: 'Gilmar Aranda', rol: 'agente' },
        { user: 'juan.minnota', pass: 'Carvajal2026*', nombre: 'Juan Minnota', rol: 'agente' }
    ];

    usuariosIniciales.forEach(u => {
        db.run(`INSERT OR IGNORE INTO usuarios (usuario, contrasena, nombre, rol) 
                VALUES (?, ?, ?, ?)`, [u.user, u.pass, u.nombre, u.rol]);
    });
            
    // Mantener el colaborador de prueba
    db.run(`INSERT OR IGNORE INTO colaboradores (telefono, nombre, cargo, area) 
            VALUES ('300123456', 'Carlos Sotelo', 'Analista de Soporte', 'Tecnología')`);
});

// MIDDLEWARE DE SEGURIDAD: Protege las rutas para que solo entren logueados
function verificarSesion(req, res, next) {
    if (req.session && req.session.usuario) {
        return next(); // Si tiene sesión, continúe a la pantalla
    }
    // Si no tiene sesión, mándelo al login, guardando el teléfono por si venía de GoContact
    const telefono = req.query.telefono ? `?telefono=${req.query.telefono}` : '';
    res.redirect(`/login${telefono}`);
}

// ==========================================
// VISTAS Y RUTAS DEL LOGIN
// ==========================================

// 1. Mostrar la pantalla de Login (GET)
app.get('/login', (req, res) => {
    const telefonoPendiente = req.query.telefono || '';
    const error = req.query.error ? '<p style="color:red; text-align:center;">Usuario o contraseña incorrectos</p>' : '';

    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Iniciar Sesión - Portal Soporte</title>
            <style>
                body { font-family: system-ui, sans-serif; background: #f1f5f9; display: flex; height: 100vh; align-items: center; justify-content: center; margin: 0; }
                .login-card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); width: 100%; max-width: 400px; }
                h2 { text-align: center; margin-top: 0; color: #0f172a; }
                label { display: block; margin: 15px 0 5px; font-weight: 600; font-size: 14px; color: #334155; }
                input { width: 100%; padding: 10px; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 6px; }
                button { background: #2563eb; color: white; padding: 12px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-top: 25px; width: 100%; font-size: 16px; }
                button:hover { background: #1d4ed8; }
            </style>
        </head>
        <body>
            <div class="login-card">
                <h2>Portal de Soporte</h2>
                ${error}
                <form action="/login" method="POST">
                    <input type="hidden" name="telefono_pendiente" value="${telefonoPendiente}">

                    <label>Usuario</label>
                    <input type="text" name="username" placeholder="Ej: agente01" required>

                    <label>Contraseña</label>
                    <input type="password" name="password" placeholder="••••••••" required>

                    <button type="submit">Ingresar al Portal</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// 2. Procesar el Login (POST)
app.post('/login', (req, res) => {
    const { username, password, telefono_pendiente } = req.body;

    db.get(`SELECT * FROM usuarios WHERE usuario = ? AND contrasena = ?`, [username, password], (err, row) => {
        if (err || !row) {
            // Si falla, regresa al login con una señal de error
            return res.redirect(`/login?error=1&telefono=${telefono_pendiente}`);
        }

        // CREAR LA SESIÓN EN MEMORIA
        req.session.usuario = row.usuario;
        req.session.nombreAgente = row.nombre;

        // Si venía una llamada desde GoContact con teléfono, redirigir directo allá
        if (telefono_pendiente) {
            res.redirect(`/atencion?telefono=${telefono_pendiente}`);
        } else {
            // Si se logueó de forma manual, mostrar mensaje general
            res.send(`<h2>Bienvenido ${row.nombre}. Esperando llamada desde GoContact...</h2>`);
        }
    });
});

// 3. Ruta para cerrar sesión (Logout)
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// ==========================================
// RUTA DE ATENCIÓN (AHORA PROTEGIDA POR EL MIDDLEWARE)
// ==========================================
app.get('/atencion', verificarSesion, (req, res) => { // ← Se agregó verificarSesion
    const telefonoCliente = req.query.telefono || '';
    const nombreAgenteActual = req.session.nombreAgente; // ← Tomamos el nombre desde la sesión segura

    db.get(`SELECT * FROM colaboradores WHERE telefono = ?`, [telefonoCliente], (err, colaborador) => {
        if (err) return res.status(500).send("Error en la base de datos");

        const infoColaborador = colaborador || { 
            nombre: "Colaborador Desconocido", cargo: "No Registrado", area: "N/A", telefono: telefonoCliente 
        };

        db.all(`SELECT * FROM historial_tickets WHERE telefono = ? ORDER BY fecha DESC LIMIT 3`, [telefonoCliente], (err, historial) => {
            let listaHistorial = historial.map(h => `
                <div style="background:#f1f5f9; padding:12px; margin-bottom:8px; border-radius:6px; font-size:13px; border-left: 4px solid #2563eb;">
                    <strong>[${h.categoria}]</strong> - ${h.titulo}<br>
                    <p style="margin: 4px 0; color:#475569;">${h.descripcion}</p>
                    <small style="color:#94a3b8;">Atendido por: ${h.agente} | ${h.fecha}</small>
                </div>
            `).join('') || '<p style="color:#94a3b8; font-size:13px;">Sin llamadas previas registradas.</p>';

            res.send(`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <title>Portal de Soporte</title>
                    <style>
                        body { font-family: system-ui, sans-serif; background: #f8fafc; padding: 30px; margin: 0; }
                        .header { max-width: 1200px; margin: 0 auto 15px; display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: white; padding: 10px 20px; border-radius: 8px; }
                        .container { display: flex; gap: 25px; max-width: 1200px; margin: 0 auto; }
                        .box { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); flex: 1; }
                        h2 { border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-top:0; color: #0f172a; }
                        .field { margin-bottom: 15px; }
                        label { display: block; margin: 15px 0 5px; font-weight: 600; font-size: 14px; }
                        input, textarea, select { width: 100%; padding: 10px; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 6px; }
                        button { background: #2563eb; color: white; padding: 12px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-top: 20px; width: 100%; font-size: 15px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <span>👤 Agente Activo: <strong>${nombreAgenteActual}</strong></span>
                        <a href="/logout" style="color:#f87171; text-decoration:none; font-weight:bold; font-size:14px;">Cerrar Sesión ✕</a>
                    </div>
                    <div class="container">
                        <div class="box">
                            <h2>Perfil del Colaborador</h2>
                            <div class="field"><strong>Nombre:</strong> ${infoColaborador.nombre}</div>
                            <div class="field"><strong>Cargo:</strong> ${infoColaborador.cargo}</div>
                            <div class="field"><strong>Área:</strong> ${infoColaborador.area}</div>
                            <div class="field"><strong>Teléfono:</strong> ${infoColaborador.telefono}</div>
                            <h3 style="margin-top:35px;">Historial de Casos</h3>
                            ${listaHistorial}
                        </div>
                        <div class="box">
                            <h2>Tipificación del Caso</h2>
                            <form action="/registrar-caso" method="POST">
                                <input type="hidden" name="telefono" value="${infoColaborador.telefono}">
                                <input type="hidden" name="agente" value="${nombreAgenteActual}">

                                <label>Categoría del Problema</label>
                                <select name="categoria" required>
                                    <option value="">-- Seleccione una categoría --</option>
                                    <option value="Cuentas y Accesos">Cuentas y Accesos</option>
                                    <option value="Hardware">Hardware</option>
                                    <option value="Software Corporativo">Software Corporativo</option>
                                    <option value="Redes e Internet">Redes e Internet</option>
                                </select>

                                <label>Asunto Breve</label>
                                <input type="text" name="titulo" required>

                                <label>Notas de la Solución</label>
                                <textarea name="descripcion" rows="5" required></textarea>

                                <button type="submit">Guardar Registro de Llamada</button>
                            </form>
                        </div>
                    </div>
                </body>
                </html>
            `);
        });
    });
});

// (La Ruta POST /registrar-caso se mantiene igual que antes...)
app.post('/registrar-caso', (req, res) => {
    const { telefono, agente, categoria, titulo, descripcion } = req.body;
    db.run(`INSERT INTO historial_tickets (telefono, agente, categoria, titulo, descripcion) VALUES (?, ?, ?, ?, ?)`,
        [telefono, agente, categoria, titulo, descripcion], 
        function(err) {
            if (err) return res.status(500).send("Error al guardar.");
            res.send(`
                <div style="font-family:sans-serif; text-align:center; padding:60px; background:#f8fafc; height:100vh;">
                    <div style="background:white; padding:40px; border-radius:12px; display:inline-block; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
                        <h2 style="color: #16a34a; margin-top:0;">✔️ ¡Llamada Guardada con Éxito!</h2>
                        <a href="/atencion?telefono=${telefono}" style="color:#2563eb; font-weight:600; text-decoration:none;">← Volver al perfil</a>
                    </div>
                </div>
            `);
        }
    );
});
app.get('/admin', verificarSesion, (req, res) => {
    // Consulta para traer TODOS los tickets ordenados del más reciente al más antiguo
    db.all(`SELECT * FROM historial_tickets ORDER BY fecha DESC`, [], (err, rows) => {
        if (err) return res.status(500).send("Error al cargar el reporte.");

        // Contamos el total de casos registrados
        const totalCasos = rows.length;

        // Construimos las filas de la tabla dinámicamente
        let filasTabla = rows.map(r => `
            <tr>
                <td>${r.fecha}</td>
                <td><strong>${r.agente}</strong></td>
                <td>${r.telefono}</td>
                <td><span class="badge">${r.categoria}</span></td>
                <td><strong>${r.titulo}</strong></td>
                <td>${r.descripcion}</td>
            </tr>
        `).join('') || `<tr><td colspan="6" style="text-align:center; color:#94a3b8;">No hay llamadas registradas en el sistema aún.</td></tr>`;

        // Enviamos la interfaz del Panel de Control
        res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Panel Admin - Control de Casos</title>
                <style>
                    body { font-family: system-ui, sans-serif; background: #f8fafc; margin: 0; padding: 30px; color: #0f172a; }
                    .header-admin { max-width: 1300px; margin: 0 auto 20px; display: flex; justify-content: space-between; align-items: center; }
                    h1 { margin: 0; font-size: 24px; color: #1e293b; }
                    .stats-card { background: white; padding: 15px 25px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: inline-block; margin-bottom: 20px; }
                    .stats-card min { font-size: 14px; color: #64748b; block; }
                    .stats-card div { font-size: 28px; font-weight: bold; color: #2563eb; }
                    .btn-excel { background: #16a34a; color: white; padding: 10px 18px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; text-decoration: none; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; }
                    .btn-excel:hover { background: #15803d; }
                    .table-container { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); max-width: 1300px; margin: 0 auto; overflow: hidden; border: 1px solid #e2e8f0; }
                    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
                    th { background: #f1f5f9; padding: 15px; color: #475569; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
                    td { padding: 15px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
                    tr:hover { background: #f8fafc; }
                    .badge { background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; display: inline-block; }
                    .nav-links { display: flex; gap: 15px; }
                    .nav-links a { text-decoration: none; color: #2563eb; font-weight: 600; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="header-admin">
                    <div>
                        <h1>📊 Panel de Control General</h1>
                        <div class="nav-links" style="margin-top: 5px;">
                            <a href="/atencion?telefono=300123456">← Ir a Vista de Agente</a> | 
                            <a href="/logout" style="color:#f87171;">Cerrar Sesión</a>
                        </div>
                    </div>
                    <button onclick="exportarExcel()" class="btn-excel">📥 Exportar a Excel</button>
                </div>

                <div style="max-width: 1300px; margin: 0 auto;">
                    <div class="stats-card">
                        <span>Total Llamadas Tipificadas</span>
                        <div>${totalCasos}</div>
                    </div>
                </div>

                <div class="table-container">
                    <table id="tabla-casos">
                        <thead>
                            <tr>
                                <th style="width: 150px;">Fecha / Hora</th>
                                <th style="width: 150px;">Agente</th>
                                <th style="width: 120px;">Teléfono</th>
                                <th style="width: 150px;">Categoría</th>
                                <th style="width: 250px;">Asunto</th>
                                <th>Detalles del Soporte</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filasTabla}
                        </tbody>
                    </table>
                </div>

                <script>
                    function exportarExcel() {
                        var tabla = document.getElementById("tabla-casos");
                        var html = tabla.outerHTML;
                        
                        // Agregar metadatos para que Excel reconozca los acentos y eñes (UTF-8)
                        var blob = new Blob(['\\ufeff' + html], {
                            type: "application/vnd.ms-excel"
                        });
                        
                        var url = URL.createObjectURL(blob);
                        var a = document.createElement("a");
                        a.href = url;
                        a.download = "Reporte_Tipificaciones_Carvajal.xls";
                        a.click();
                    }
                </script>
            </body>
            </html>
        `);
    });
});
app.listen(PORT, () => console.log(`Aplicación en http://localhost:${PORT}`));