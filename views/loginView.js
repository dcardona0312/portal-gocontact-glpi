module.exports = (telefonoPendiente, error) => `
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
            ${error ? '<p style="color:red; text-align:center;">Usuario o contraseña incorrectos</p>' : ''}
            <form action="/login" method="POST">
                <input type="hidden" name="telefono_pendiente" value="${telefonoPendiente}">
                <label>Usuario</label>
                <input type="text" name="username" placeholder="Ej: diego.cardona" required>
                <label>Contraseña</label>
                <input type="password" name="password" placeholder="••••••••" required>
                <button type="submit">Ingresar al Portal</button>
            </form>
        </div>
    </body>
    </html>
`;