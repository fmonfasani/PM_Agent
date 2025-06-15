const express = require('express');
const router = express.Router();

// Base de datos en memoria (mover aquí desde server.js)
let products = [
  { id: 1, name: 'Laptop', price: 999.99, stock: 10 },
  { id: 2, name: 'Smartphone', price: 499.99, stock: 15 }
];

// GET productos
router.get('/', (req, res) => {
  res.json(products);
});

// GET producto por ID 
router.get('/:id', (req, res) => {
  const product = products.find(p => p.id == req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  res.json(product);
});

// POST nuevo producto
router.post('/', (req, res) => {
  const newProduct = {
    id: products.length + 1,
    name: req.body.name,
    price: req.body.price,
    stock: req.body.stock
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

module.exports = { router, products };