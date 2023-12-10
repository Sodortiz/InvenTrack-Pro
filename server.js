const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(session({
    secret: 'tu_secreto',
    resave: false,
    saveUninitialized: true
}));

const db = new sqlite3.Database('./Usuarios.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos SQLite:', err.message);
        process.exit(1);
    }
    console.log('Conectado a la base de datos SQLite.');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err) {
            res.status(500).send('Error interno del servidor');
            return;
        }
        if (row) {
            req.session.user = { username: row.username, name: row.name };
            res.redirect('/dashboard');
        } else {
            res.redirect('/?error=invalid_credentials');
        }
    });
});

app.get('/dashboard', (req, res) => {
    if (req.session.user) {
        db.all("SELECT * FROM productos", [], (err, rows) => {
            if (err) {
                res.status(500).send('Error al obtener los productos de la base de datos.');
            } else {
                res.render('dashboard', { name: req.session.user.name, productos: rows });
            }
        });
    } else {
        res.redirect('/login');
    }
});

app.post('/registrarProducto', (req, res) => {
    const { codigo, nombre, descripcion, fecha_ingreso, nombre_cliente, id_proyecto, comentarios, estatus } = req.body;

    if (!codigo.trim() || !nombre.trim() || !descripcion.trim() || !fecha_ingreso.trim() || !estatus.trim()) {
        res.status(400).send('Todos los campos son requeridos excepto comentarios e ID del proyecto.');
        return;
    }

    const query = `INSERT INTO productos (codigo, nombre, descripcion, fecha_ingreso, nombre_cliente, id_proyecto, comentarios, estatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [codigo, nombre, descripcion, fecha_ingreso, nombre_cliente, id_proyecto, comentarios, estatus], function(err) {
        if (err) {
            console.error('Error al insertar en la base de datos:', err.message);
            res.status(500).send('Error al registrar el producto');
            return;
        }
        console.log(`Producto registrado con éxito con el ID: ${this.lastID}`);
        res.redirect('/dashboard?success=true');
    });
});

app.get('/producto/:codigo', (req, res) => {
    const codigo = req.params.codigo;
    console.log("Código del producto:", codigo); // Línea de depuración
    db.get("SELECT * FROM productos WHERE codigo = ?", [codigo], (err, row) => {
        if (err) {
            res.status(500).send('Error al obtener el producto de la base de datos');
            return;
        }
        if (row) {
            res.json(row);
        } else {
            res.status(404).send('Producto no encontrado');
        }
    });
});

app.post('/actualizarTarea', (req, res) => {
    try {
        const { codigo, estatus, nuevosComentarios } = req.body;
        if (!codigo) {
            res.status(400).send('El código del producto es requerido.');
            return;
        }
        const fechaActual = new Date().toISOString().slice(0, 19).replace('T', ' ');
        let comentarioActualizado = nuevosComentarios ? fechaActual + ": " + nuevosComentarios : "";

        db.run(`UPDATE productos SET estatus = ?, comentarios = CASE WHEN LENGTH(comentarios) > 0 THEN comentarios || '\n' || ? ELSE ? END WHERE codigo = ?`, 
            [estatus, comentarioActualizado, comentarioActualizado, codigo], 
            function(err) {
                if (err) {
                    console.error('Error al actualizar el producto:', err.message);
                    res.status(500).send('Error al actualizar el producto');
                    return;
                }
                if (this.changes === 0) {
                    res.send(`No se encontró un producto con el código ${codigo}.`);
                } else {
                    res.send(`Producto con código ${codigo} actualizado con éxito.`);
                }
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
