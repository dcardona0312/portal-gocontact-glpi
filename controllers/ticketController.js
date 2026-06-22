const db = require('../config/database');
const atencionView = require('../views/atencionView');

// Procesa las búsquedas y renderiza el repositorio
exports.showAtencion = (req, res) => {
    const nombreAgenteActual = req.session.nombreAgente;
    const queryBusqueda = req.query.buscar ? req.query.buscar.trim() : '';

    let resultadoColaborador = null;
    let resultadosTickets = [];

    const enviar = () => {
        res.send(atencionView(nombreAgenteActual, queryBusqueda, resultadoColaborador, resultadosTickets));
    };

    if (!queryBusqueda) return enviar();

    // 1. Intentar buscar por Cédula o Teléfono
    db.get(`SELECT * FROM colaboradores WHERE cedula = ? OR telefono = ?`, [queryBusqueda, queryBusqueda], (err, col) => {
        if (col) {
            resultadoColaborador = col;
            db.all(`SELECT * FROM historial_tickets WHERE telefono = ? ORDER BY fecha DESC`, [col.telefono], (err, tickets) => {
                resultadosTickets = tickets || [];
                enviar();
            });
        } else {
            // 2. Si no es colaborador, verificar si es un ID de Caso numérico exacto
            db.get(`SELECT * FROM historial_tickets WHERE id = ?`, [queryBusqueda], (err, ticketUnico) => {
                if (ticketUnico) {
                    resultadosTickets = [ticketUnico];
                    db.get(`SELECT * FROM colaboradores WHERE telefono = ?`, [ticketUnico.telefono], (err, colDueno) => {
                        if (colDueno) resultadoColaborador = colDueno;
                        enviar();
                    });
                } else {
                    enviar(); // No se encontró nada con ese criterio
                }
            });
        }
    });
};

// Registra la nueva tipificación en la base de datos
exports.registrarCaso = (req, res) => {
    const { telefono, agente, categoria, titulo, descripcion } = req.body;
    db.run(`INSERT INTO historial_tickets (telefono, agente, categoria, titulo, descripcion) VALUES (?, ?, ?, ?, ?)`,
        [telefono, agente, categoria, titulo, descripcion],
        function (err) {
            if (err) return res.status(500).send("Error al guardar el caso.");
            res.send(`
                <script>
                    alert('✔️ ¡Caso Guardado con Éxito!');
                    window.location.href = '/atencion?buscar=${telefono}';
                </script>
            `);
        }
    );
};