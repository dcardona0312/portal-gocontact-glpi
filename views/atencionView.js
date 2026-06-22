module.exports = (nombreAgenteActual, queryBusqueda, resultadoColaborador, resultadosTickets) => {
    let listaTickets = resultadosTickets.map(t => `
        <div style="background:#f1f5f9; padding:15px; margin-bottom:12px; border-radius:8px; border-left:4px solid #2563eb;">
            <div style="display:flex; justify-content:space-between; font-size:12px; color:#64748b; margin-bottom:5px;">
                <span><strong>Caso ID: # ${t.id}</strong> | ${t.categoria}</span>
                <span>${t.fecha}</span>
            </div>
            <strong style="font-size:15px; color:#0f172a;">${t.titulo}</strong>
            <p style="margin:6px 0; color:#334155; font-size:14px;">${t.descripcion}</p>
            <small style="color:#94a3b8;">Asociado al Tel: ${t.telefono} | Atendido por: ${t.agente}</small>
        </div>
    `).join('');

    if (queryBusqueda && resultadosTickets.length === 0 && !resultadoColaborador) {
        listaTickets = '<p style="color:#94a3b8; text-align:center; padding:20px;">No hay historial de casos previos para este criterio.</p>';
    }

    // Determinar si la búsqueda parece una cédula o teléfono para precargarla
    const esNumerico = /^\d+$/.test(queryBusqueda);
    const sugerenciaCedula = (esNumerico && queryBusqueda.length >= 6 && queryBusqueda.length <= 11) ? queryBusqueda : '';
    const sugerenciaTelefono = (esNumerico && (queryBusqueda.length === 9 || queryBusqueda.length === 10 || queryBusqueda.startsWith('3'))) ? queryBusqueda : '';

    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Repositorio de Soporte - Carvajal</title>
            <style>
                body { font-family: system-ui, sans-serif; background: #f8fafc; margin: 0; padding: 25px; color: #1e293b; }
                .header { max-width: 1200px; margin: 0 auto 20px; display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: white; padding: 12px 25px; border-radius: 8px; }
                .container { max-width: 1200px; margin: 0 auto; }
                .search-box { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 25px; border: 1px solid #e2e8f0; }
                .search-form { display: flex; gap: 10px; }
                .search-input { flex: 1; padding: 12px 15px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 16px; }
                .btn-search { background: #2563eb; color: white; border: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 16px; }
                .btn-search:hover { background: #1d4ed8; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
                .card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
                h2 { margin-top: 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; color: #0f172a; }
                .field { margin-bottom: 12px; font-size: 15px; }
                label { display: block; margin: 12px 0 4px; font-weight: 600; font-size: 14px; }
                input, textarea, select { width: 100%; padding: 10px; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 5px; }
                .btn-submit { background: #16a34a; color: white; padding: 12px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%; margin-top: 15px; font-size: 15px; }
                .btn-submit:hover { background: #15803d; }
                .btn-new { background: #ea580c; color: white; padding: 12px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 15px; margin-top: 15px; }
                .btn-new:hover { background: #c2410c; }
                .no-found-box { text-align: center; padding: 30px 10px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; color: #92400e; }
            </style>
        </head>
        <body>
            <div class="header">
                <span>👤 Agente Activo: <strong>${nombreAgenteActual}</strong></span>
                <div>
                    <a href="/admin" style="color:#60a5fa; text-decoration:none; font-weight:bold; margin-right:20px;">📊 Ver Panel General</a>
                    <a href="/logout" style="color:#f87171; text-decoration:none; font-weight:bold;">Cerrar Sesión ✕</a>
                </div>
            </div>
            <div class="container">
                <div class="search-box">
                    <h3 style="margin-top:0; color:#475569;">🔍 Repositorio de Consultas Directas</h3>
                    <form action="/atencion" method="GET" class="search-form">
                        <input type="text" name="buscar" class="search-input" placeholder="Digita la Cédula, el Teléfono del colaborador o el número exacto de un Caso (ID)..." value="${queryBusqueda}" required>
                        <button type="submit" class="btn-search">Buscar</button>
                    </form>
                </div>
                
                ${queryBusqueda ? `
                <div class="grid">
                    <div class="card">
                        ${resultadoColaborador ? `
                            <h2>Perfil del Colaborador</h2>
                            <div class="field"><strong>Nombre:</strong> ${resultadoColaborador.nombre}</div>
                            <div class="field"><strong>Cédula:</strong> ${resultadoColaborador.cedula}</div>
                            <div class="field"><strong>Cargo:</strong> ${resultadoColaborador.cargo}</div>
                            <div class="field"><strong>Área:</strong> ${resultadoColaborador.area}</div>
                            <div class="field"><strong>Teléfono:</strong> ${resultadoColaborador.telefono}</div>
                            
                            <h3 style="margin-top:25px; border-top:1px solid #f1f5f9; padding-top:15px;">Registrar una nueva atención</h3>
                            <form action="/registrar-caso" method="POST">
                                <input type="hidden" name="telefono" value="${resultadoColaborador.telefono}">
                                <input type="hidden" name="agente" value="${nombreAgenteActual}">
                                <label>Categoría</label>
                                <select name="categoria" required>
                                    <option value="Cuentas y Accesos">Cuentas y Accesos</option>
                                    <option value="Hardware">Hardware</option>
                                    <option value="Software Corporativo">Software Corporativo</option>
                                    <option value="Redes e Internet">Redes e Internet</option>
                                </select>
                                <label>Asunto</label>
                                <input type="text" name="titulo" placeholder="Ej: Falla en clave de red" required>
                                <label>Notas de Solución</label>
                                <textarea name="descripcion" rows="3" placeholder="Detalles de la solución técnica..." required></textarea>
                                <button type="submit" class="btn-submit">Guardar Caso</button>
                            </form>
                        ` : `
                            <div id="box-no-existe" class="no-found-box">
                                <h3 style="margin-top:0;">⚠️ Colaborador no registrado</h3>
                                <p>No encontramos perfiles asociados a la consulta <strong>"${queryBusqueda}"</strong>.</p>
                                <button type="button" onclick="mostrarFormularioRegistro()" class="btn-new">➕ Crear Colaborador</button>
                            </div>

                            <div id="form-registro-colaborador" style="display: none;">
                                <h2>🆕 Registrar Nuevo Colaborador</h2>
                                <form action="/crear-colaborador" method="POST">
                                    <label>Cédula (Identificación)</label>
                                    <input type="text" name="cedula" value="${sugerenciaCedula}" required>
                                    
                                    <label>Nombre Completo</label>
                                    <input type="text" name="nombre" placeholder="Ej: Juan Pérez" required>
                                    
                                    <label>Cargo</label>
                                    <input type="text" name="cargo" placeholder="Ej: Auxiliar de Archivo" required>
                                    
                                    <label>Área / Proceso</label>
                                    <input type="text" name="area" placeholder="Ej: Gestión Humana" required>
                                    
                                    <label>Número de Teléfono</label>
                                    <input type="text" name="telefono" value="${sugerenciaTelefono}" placeholder="Ej: 3007654321" required>
                                    
                                    <button type="submit" class="btn-submit" style="background:#ea580c;">Guardar Perfil en Repositorio</button>
                                </form>
                            </div>
                        `}
                    </div>
                    <div class="card">
                        <h2>Casos e Historial Encontrados</h2>
                        ${listaTickets}
                    </div>
                </div>` : `<div style="text-align:center; padding:40px; color:#64748b;">💡 Ingrese Cédula, Teléfono o ID del Caso.</div>`}
            </div>

            <script>
                function mostrarFormularioRegistro() {
                    document.getElementById('box-no-existe').style.display = 'none';
                    document.getElementById('form-registro-colaborador').style.display = 'block';
                }
            </script>
        </body>
        </html>
    `;
};