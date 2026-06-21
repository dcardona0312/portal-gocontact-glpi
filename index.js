const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para procesar los datos enviados desde el formulario web
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CONFIGURACIÓN DE LA BASE DE DATOS
const db = new sqlite3.Database('./portal_data.db', (err) => {
    if (err) return console.error("Error al crear la BD:", err.message);
    console.log("Base de datos local conectada.");
});

// Asegurar que las tablas existan
db.serialize(() => {
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

    // Inyectar usuario de prueba si no existe
    db.run(`INSERT OR IGNORE INTO colaboradores (telefono, nombre, cargo, area) 
            VALUES ('300123456', 'Carlos Sotelo', 'Analista de Soporte', 'Tecnología')`);
});

// RUTA 1: Pantalla que se le abre al Agente desde GoContact
app.get('/atencion', (req, res) => {
    const telefonoCliente = req.query.telefono || '';
    const agenteID = req.query.agente || 'Agente_GoContact';

    db.get(`SELECT * FROM colaboradores WHERE telefono = ?`, [telefonoCliente], (err, colaborador) => {
        if (err) return res.status(500).send("Error en la base de datos");

        const infoColaborador = colaborador || { 
            nombre: "Colaborador Desconocido", 
            cargo: "No Registrado", 
            area: "N/A",
            telefono: telefonoCliente 
        };

        db.all(`SELECT * FROM historial_tickets WHERE telefono = ? ORDER BY fecha DESC LIMIT 3`, [telefonoCliente], (err, historial) => {
            
            let listaHistorial = historial.map(h => `
                <div style="background:#f1f5f9; padding:12px; margin-bottom:8px; border-radius:6px; font-size:13px; border-left: 4px solid #2563eb;">
                    <strong>[${h.categoria}]</strong> - ${h.titulo}<br>
                    <p style="margin: 4px 0; color:#475569;">${h.descripcion}</p>
                    <small style="color:#94a3b8;">Atendido por: ${h.agente} | ${h.fecha}</small>
                </div>
            `).join('') || '<p style="color:#94a3b8; font-size:13px;">Sin llamadas previas registradas.</p>';

            // Interfaz Web Estilizada
            res.send(`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <title>Portal de Soporte e Historial</title>
                    <style>
                        body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #1e293b; padding: 30px; margin: 0; }
                        .container { display: flex; gap: 25px; max-width: 1200px; margin: 0 auto; }
                        .box { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); flex: 1; }
                        h2 { border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-top:0; color: #0f172a; }
                        .field { margin-bottom: 15px; font-size: 15px; }
                        .field strong { color: #475569; }
                        label { display: block; margin: 15px 0 5px; font-weight: 600; font-size: 14px; color: #334155; }
                        input, textarea, select { width: 100%; padding: 10px; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; background: #fdfdfd; }
                        input:focus, textarea:focus, select:focus { outline: 2px solid #2563eb; border-color: transparent; }
                        button { background: #2563eb; color: white; padding: 12px 15px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-top: 20px; width: 100%; font-size: 15px; transition: background 0.2s; }
                        button:hover { background: #1d4ed8; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="box">
                            <h2>Perfil del Colaborador</h2>
                            <div class="field"><strong>Nombre:</strong> ${infoColaborador.nombre}</div>
                            <div class="field"><strong>Cargo:</strong> ${infoColaborador.cargo}</div>
                            <div class="field"><strong>Área:</strong> ${infoColaborador.area}</div>
                            <div class="field"><strong>Teléfono:</strong> ${infoColaborador.telefono}</div>
                            
                            <h3 style="margin-top:35px; color: #0f172a;">Historial de Casos Internos</h3>
                            ${listaHistorial}
                        </div>
                        
                        <div class="box">
                            <h2>Tipificación del Caso</h2>
                            <form action="/registrar-caso" method="POST">
                                <input type="hidden" name="telefono" value="${infoColaborador.telefono}">
                                <input type="hidden" name="agente" value="${agenteID}">

                                <label>Categoría del Problema</label>
                                <select name="categoria" required>
                                    <option value="">-- Seleccione una categoría --</option>
                                    <option value="Cuentas y Accesos">Cuentas y Accesos (Contraseñas, VPN)</option>
                                    <option value="Hardware">Hardware (Computador, Mouse, Pantalla)</option>
                                    <option value="Software Corporativo">Software Corporativo (ERP, Correo, CRM)</option>
                                    <option value="Redes e Internet">Redes e Internet (Wifi, Cableado)</option>
                                    <option value="Otros">Otros / Consultas Generales</option>
                                </select>

                                <label>Asunto Breve</label>
                                <input type="text" name="titulo" placeholder="Ej: Bloqueo de usuario en Active Directory" required>

                                <label>Notas de la Solución / Detalles</label>
                                <textarea name="descripcion" rows="5" placeholder="Escribe aquí los detalles del soporte brindado..." required></textarea>

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

// RUTA 2: Procesa el formulario y lo inserta en el historial local
app.post('/registrar-caso', (req, res) => {
    const { telefono, agente, categoria, titulo, descripcion } = req.body;

    db.run(`INSERT INTO historial_tickets (telefono, agente, categoria, titulo, descripcion) VALUES (?, ?, ?, ?, ?)`,
        [telefono, agente, categoria, titulo, descripcion], 
        function(err) {
            if (err) return res.status(500).send("Error al guardar en el historial.");

            res.send(`
                <div style="font-family:system-ui, sans-serif; text-align:center; padding:60px; background:#f8fafc; height:100vh; box-sizing:border-box;">
                    <div style="background:white; padding:40px; border-radius:12px; display:inline-block; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
                        <h2 style="color: #16a34a; margin-top:0;">✔️ ¡Llamada Guardada con Éxito!</h2>
                        <p style="color:#475569;">El caso ha sido registrado en el historial interno de la aplicación web.</p>
                        <br>
                        <a href="/atencion?telefono=${telefono}&agente=${agente}" style="color:#2563eb; font-weight:600; text-decoration:none;">← Volver al perfil</a>
                    </div>
                </div>
            `);
        }
    );
});

app.listen(PORT, () => {
    console.log(`Aplicación corriendo en http://localhost:${PORT}`);
});