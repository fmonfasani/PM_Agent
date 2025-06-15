const express = require('express');
const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');

const port = process.env.PORT || 3000;

// Importar rutas
const productsRouter = require('./routes/products').router;
const cartRouter = require('./routes/cart');

// Usar rutas

// Ruta principal que sirve el frontend
app.get('/', (req, res) => {
    res.render('index');
});

app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);


// Base de datos en memoria
let products = [
  { id: 1, name: 'Laptop', price: 999.99, stock: 10 },
  { id: 2, name: 'Smartphone', price: 499.99, stock: 15 }
];

let cart = [];

app.use(express.json());

// GET productos
app.get('/api/products', (req, res) => {
  res.json(products);
});

// GET producto por ID
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({error: 'Producto no encontrado'});
  res.json(product);
});

// POST añadir al carrito
app.post('/api/cart/add', (req, res) => {
  const { productId, quantity } = req.body;
  const product = products.find(p => p.id === productId);
  
  if (!product) return res.status(404).json({error: 'Producto no encontrado'});
  if (product.stock < quantity) return res.status(400).json({error: 'Stock insuficiente'});

  cart.push({ productId, quantity });
  product.stock -= quantity;
  
  res.json(cart);
});

// GET carrito
app.get('/api/cart', (req, res) => {
  res.json(cart);
});

// POST checkout
app.post('/api/checkout', (req, res) => {
  const total = cart.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + (product.price * item.quantity);
  }, 0);
  
  cart = [];
  res.json({ message: 'Compra exitosa', total });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
undefined
// Servir archivos estáticos
app.use(express.static('public'));

// Middleware para parsear JSON
app.use(express.json());