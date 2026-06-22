const db = require('../config/database');
const adminView = require('../views/adminView');

// Carga todas las interacciones guardadas en el sistema
exports.showAdmin = (req, res) => {
    db.all(`SELECT * FROM historial_tickets ORDER BY fecha DESC`, [], (err, rows) => {
        if (err) return res.status(500).send("Error al cargar el reporte global.");

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

        res.send(adminView(rows.length, filasTabla));
    });
};