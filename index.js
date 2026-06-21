const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Permitir que el servidor entienda datos de formularios y JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 1. RUTA DE PRUEBA: Para verificar que el portal responda
app.get('/', (req, res) => {
    res.send('¡El portal intermedio está vivo y corriendo!');
});

// 2. RUTA PARA GOCONTACT: Aquí llegará el agente cuando entre la llamada
app.get('/atencion', (req, res) => {
    // Capturamos el teléfono que GoContact nos envía por la URL
    const telefonoCliente = req.query.telefono || 'No provisto';
    
    // De momento, mostraremos una pantalla simple de prueba
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Portal de Tipificación</title>
            <style>
                body { font-family: sans-serif; text-align: center; padding: 50px; background: #f0f2f5; }
                .card { background: white; padding: 30px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                h1 { color: #1c1e21; }
                span { color: #1877f2; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>Llamada Recibida</h1>
                <p>El teléfono del colaborador es: <span>${telefonoCliente}</span></p>
                <p>Pronto aquí cargaremos su historial y el formulario de GLPI.</p>
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});