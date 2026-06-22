module.exports = (totalCasos, filasTabla) => `
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
            .stats-card div { font-size: 28px; font-weight: bold; color: #2563eb; }
            .btn-excel { background: #16a34a; color: white; padding: 10px 18px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; }
            .table-container { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); max-width: 1300px; margin: 0 auto; overflow: hidden; border: 1px solid #e2e8f0; }
            table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
            th { background: #f1f5f9; padding: 15px; color: #475569; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
            td { padding: 15px; border-bottom: 1px solid #f1f5f9; }
            .badge { background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            .nav-links a { text-decoration: none; color: #2563eb; font-weight: 600; }
        </style>
    </head>
    <body>
        <div class="header-admin">
            <div>
                <h1>📊 Panel de Control General</h1>
                <div class="nav-links" style="margin-top: 5px;">
                    <a href="/atencion">← Ir a Vista de Agente</a> | <a href="/logout" style="color:#f87171;">Cerrar Sesión</a>
                </div>
            </div>
            <button onclick="exportarExcel()" class="btn-excel">📥 Exportar a Excel</button>
        </div>
        <div style="max-width: 1300px; margin: 0 auto;">
            <div class="stats-card"><span>Total Llamadas Tipificadas</span><div>${totalCasos}</div></div>
        </div>
        <div class="table-container">
            <table id="tabla-casos">
                <thead>
                    <tr><th>Fecha / Hora</th><th>Agente</th><th>Teléfono</th><th>Categoría</th><th>Asunto</th><th>Detalles</th></tr>
                </thead>
                <tbody>${filasTabla}</tbody>
            </table>
        </div>
        <script>
            function exportarExcel() {
                var html = document.getElementById("tabla-casos").outerHTML;
                var blob = new Blob(['\\ufeff' + html], { type: "application/vnd.ms-excel" });
                var a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = "Reporte_Tipificaciones_Carvajal.xls";
                a.click();
            }
        </script>
    </body>
    </html>
`;