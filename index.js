const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Conexión a la Base de Datos MySQL
const db = mysql.createPool({
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || 'root',
  database: process.env.MYSQLDATABASE || 'persilux_db',
  port: process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

db.query('SELECT 1')
  .then(() => console.log('✅ Conectado exitosamente a MySQL'))
  .catch(err => console.error('❌ Error conectando a BD:', err));

// ==========================================
// RUTAS DE LA API (Endpoints)
// ==========================================

// 1. LEER: Obtener todos los clientes
app.get('/api/clientes', (req, res) => {
  const sql = 'SELECT * FROM clientes';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// CREAR producto (Sin stock)
app.post('/api/productos', (req, res) => {
  const { nombre, descripcion, precio } = req.body;
  const sql = 'INSERT INTO productos (nombre, descripcion, precio) VALUES (?, ?, ?)';
  db.query(sql, [nombre, descripcion, precio], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Producto guardado', id: result.insertId });
  });
});

// ACTUALIZAR Producto (Sin stock)
app.put('/api/productos/:id', (req, res) => {
  const { nombre, descripcion, precio } = req.body;
  const sql = 'UPDATE productos SET nombre=?, descripcion=?, precio=? WHERE id=?';
  db.query(sql, [nombre, descripcion, precio, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Producto actualizado' });
  });
});

// ELIMINAR Cliente (DELETE)
app.delete('/api/clientes/:id', (req, res) => {
  db.query('DELETE FROM clientes WHERE id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Cliente eliminado' });
  });
});

// ====== AGREGAR ESTO DEBAJO DEL POST DE PRODUCTOS ======

// ACTUALIZAR Producto (PUT)
app.put('/api/productos/:id', (req, res) => {
  const { nombre, descripcion, precio, stock } = req.body;
  const sql = 'UPDATE productos SET nombre=?, descripcion=?, precio=?, stock=? WHERE id=?';
  db.query(sql, [nombre, descripcion, precio, stock, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Producto actualizado' });
  });
});

// ELIMINAR Producto (DELETE)
app.delete('/api/productos/:id', (req, res) => {
  db.query('DELETE FROM productos WHERE id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Producto eliminado' });
  });
});
// ==========================================
// RUTAS PARA PRODUCTOS
// ==========================================
// LEER productos
app.get('/api/productos', (req, res) => {
  db.query('SELECT * FROM productos', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// CREAR producto
app.post('/api/productos', (req, res) => {
  const { nombre, descripcion, precio, stock } = req.body;
  const sql = 'INSERT INTO productos (nombre, descripcion, precio, stock) VALUES (?, ?, ?, ?)';
  db.query(sql, [nombre, descripcion, precio, stock], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Producto guardado', id: result.insertId });
  });
});

// ==========================================
// RUTAS PARA EMPLEADOS
// ==========================================
// LEER empleados
app.get('/api/empleados', (req, res) => {
  db.query('SELECT * FROM empleados', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// CREAR empleado
app.post('/api/empleados', (req, res) => {
  const { id, nombre, rol, telefono } = req.body;
  // Ojo: En empleados usamos tu ID (matrícula ZS...) en vez de autoincrementable
  const sql = 'INSERT INTO empleados (id, nombre, rol, telefono) VALUES (?, ?, ?, ?)';
  db.query(sql, [id, nombre, rol, telefono], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Empleado guardado' });
  });
});

// ACTUALIZAR Empleado (PUT)
app.put('/api/empleados/:id', (req, res) => {
  const { nombre, rol, telefono } = req.body;
  const sql = 'UPDATE empleados SET nombre=?, rol=?, telefono=? WHERE id=?';
  db.query(sql, [nombre, rol, telefono, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Empleado actualizado' });
  });
});

// ELIMINAR Empleado (DELETE)
app.delete('/api/empleados/:id', (req, res) => {
  db.query('DELETE FROM empleados WHERE id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Empleado eliminado' });
  });
});

// ==========================================
// RUTA DE PEDIDOS (CON POLÍTICA 50/50)
// ==========================================

app.get('/api/pedidos', (req, res) => {
  const sql = `
    SELECT p.id, c.nombre AS cliente_nombre, pr.nombre AS producto_nombre, 
           p.medidas, p.cantidad, p.total, p.anticipo, p.saldo, p.estatus, p.fecha_registro 
    FROM pedidos p
    JOIN clientes c ON p.cliente_id = c.id
    JOIN productos pr ON p.producto_id = pr.id
    ORDER BY p.id DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/pedidos', (req, res) => {
  const { cliente_id, producto_id, medidas, cantidad, total, anticipo, estatus, vendedor_id } = req.body;
  
  const numTotal = Number(total) || 0;
  let numAnticipo = Number(anticipo) || 0;
  
  // 🔥 LA REGLA DE NEGOCIO: Si el anticipo viene en 0 (porque no lo escribiste a mano), 
  // el sistema automáticamente cobra el 50% del total.
  if (numAnticipo === 0) {
    numAnticipo = numTotal / 2;
  }
  
  const numSaldo = numTotal - numAnticipo;

  const sql = 'INSERT INTO pedidos (cliente_id, producto_id, medidas, cantidad, total, anticipo, saldo, estatus, vendedor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  
  db.query(sql, [cliente_id, producto_id, medidas, cantidad, numTotal, numAnticipo, numSaldo, estatus, vendedor_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Pedido guardado con éxito', id: result.insertId });
  });
});

// Ruta para liquidar el pedido (cambia saldo a 0 y estatus a Liquidado)
app.put('/api/pedidos/:id/liquidar', (req, res) => {
  const sql = "UPDATE pedidos SET saldo = 0, estatus = 'Liquidado' WHERE id = ?";
  db.query(sql, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Pedido liquidado exitosamente' });
  });
});

// ELIMINAR Pedido (DELETE)
app.delete('/api/pedidos/:id', (req, res) => {
  db.query('DELETE FROM pedidos WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Pedido eliminado exitosamente' });
  });
});

// ==========================================
// RUTA DE COTIZACIONES
// ==========================================

// Leer cotizaciones
app.get('/api/pedidos', (req, res) => {
  const sql = `
    SELECT p.id, c.nombre AS cliente_nombre, c.direccion AS cliente_direccion, pr.nombre AS producto_nombre, 
           p.medidas, p.cantidad, p.total, p.anticipo, p.saldo, p.estatus, p.fecha_registro 
    FROM pedidos p
    JOIN clientes c ON p.cliente_id = c.id
    JOIN productos pr ON p.producto_id = pr.id
    ORDER BY p.id DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Crear cotización
app.post('/api/cotizaciones', (req, res) => {
  const { cliente_id, producto_id, medidas, cantidad, total } = req.body;
  const sql = 'INSERT INTO cotizaciones (cliente_id, producto_id, medidas, cantidad, total) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [cliente_id, producto_id, medidas, cantidad, total], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Cotización guardada', id: result.insertId });
  });
});

// Actualizar cotización (PUT)
app.put('/api/cotizaciones/:id', (req, res) => {
  const { cliente_id, producto_id, medidas, cantidad, total } = req.body;
  const sql = 'UPDATE cotizaciones SET cliente_id=?, producto_id=?, medidas=?, cantidad=?, total=? WHERE id=?';
  db.query(sql, [cliente_id, producto_id, medidas, cantidad, total, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Cotización actualizada' });
  });
});

// Eliminar cotización (Útil para cuando se convierte a pedido o se cancela)
app.delete('/api/cotizaciones/:id', (req, res) => {
  db.query('DELETE FROM cotizaciones WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Cotización eliminada' });
  });
});
// ==========================================
// RUTAS PARA INSTALACIONES
// ==========================================

// Leer instalaciones programadas
app.get('/api/instalaciones', (req, res) => {
  const sql = `
    SELECT i.id, i.pedido_id, c.nombre AS cliente_nombre, 
           e.nombre AS empleado_nombre, i.fecha_programada, 
           i.direccion_instalacion, i.estatus 
    FROM instalaciones i
    JOIN pedidos p ON i.pedido_id = p.id
    JOIN clientes c ON p.cliente_id = c.id
    JOIN empleados e ON i.empleado_id = e.id
    ORDER BY i.fecha_programada ASC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Programar nueva instalación
app.post('/api/instalaciones', (req, res) => {
  const { pedido_id, empleado_id, fecha_programada, direccion_instalacion, estatus } = req.body;
  const estatusFinal = estatus || 'Pendiente';

  const sql = 'INSERT INTO instalaciones (pedido_id, empleado_id, fecha_programada, direccion_instalacion, estatus) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [pedido_id, empleado_id, fecha_programada, direccion_instalacion, estatusFinal], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Instalación programada exitosamente', id: result.insertId });
  });
});

// Actualizar estatus de instalación (Ej. de Pendiente a Completada)
app.put('/api/instalaciones/:id/estatus', (req, res) => {
  const { estatus } = req.body;
  const sql = 'UPDATE instalaciones SET estatus = ? WHERE id = ?';
  db.query(sql, [estatus, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Estatus de instalación actualizado' });
  });
});

// Eliminar instalación
app.delete('/api/instalaciones/:id', (req, res) => {
  db.query('DELETE FROM instalaciones WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Instalación eliminada' });
  });
});

// ==========================================
// RUTA DE LOGIN (Seguridad)
// ==========================================
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // Buscamos al empleado donde el ID (matrícula) y el password coincidan
  const sql = 'SELECT * FROM empleados WHERE id = ? AND password = ?';
  
  db.query(sql, [username, password], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Si results es mayor a 0, significa que sí encontró al empleado
    if (results.length > 0) {
      const empleado = results[0];
      res.json({ 
        exito: true, 
        rol: empleado.rol, // <--- Aquí le mandamos el rol a Angular
        nombre: empleado.nombre 
      });
    } else {
      // Si no lo encuentra, mandamos error 401 (No Autorizado)
      res.status(401).json({ exito: false, mensaje: 'Credenciales incorrectas' });
    }
  });
});
// ==========================================
// MÓDULO DE REPORTES GERENCIALES
// ==========================================
app.get('/api/reportes/ventas', (req, res) => {
  const { fechaInicio, fechaFin, vendedor_id } = req.query;

  if (!fechaInicio || !fechaFin) {
    return res.status(400).json({ error: 'Faltan las fechas del reporte' });
  }

  // Traemos p.anticipo para poder calcular el flujo de caja real
  let sql = `
    SELECT p.id AS folio, c.nombre AS cliente_nombre, pr.nombre AS producto_nombre, 
           p.total, p.anticipo, p.estatus, p.fecha_registro 
    FROM pedidos p
    JOIN clientes c ON p.cliente_id = c.id
    JOIN productos pr ON p.producto_id = pr.id
    WHERE DATE(p.fecha_registro) BETWEEN ? AND ?
  `;

  let parametros = [fechaInicio, fechaFin];

  if (vendedor_id && vendedor_id !== 'todos') {
    sql += ` AND p.vendedor_id = ?`;
    parametros.push(vendedor_id);
  }

  sql += ` ORDER BY p.fecha_registro DESC`;

  db.query(sql, parametros, (err, resultados) => {
    if (err) return res.status(500).json({ error: err.message });

    // 1. Total de lo pactado en contratos
    const totalVendido = resultados.reduce((suma, ped) => suma + Number(ped.total), 0);
    
    // 2. Caja Real: Si está liquidado sumamos todo el total, si no, sólo sumamos el anticipo que ya pagó
    const totalRecaudado = resultados.reduce((suma, ped) => {
      if (ped.estatus === 'Liquidado') {
        return suma + Number(ped.total);
      } else {
        return suma + Number(ped.anticipo || 0);
      }
    }, 0);

    const totalPedidos = resultados.length;

    res.json({
      resumen: {
        ingresosVendidos: totalVendido,
        ingresosRecaudados: totalRecaudado,
        cantidadVentas: totalPedidos
      },
      detalle: resultados
    });
  });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor backend corriendo en puerto ${PORT}`));