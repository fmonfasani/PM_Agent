const express = require('express');
const router = express.Router();
const { products } = require('./products');

let cart = [];

// GET carrito
router.get('/', (req, res) => {
  res.json(cart);
});

// POST agregar al carrito
router.post('/', (req, res) => {
  const product = products.find(p => p.id == req.body.productId);
  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  if (product.stock < req.body.quantity) {
    return res.status(400).json({ error: 'Stock insuficiente' });
  }
  
  const cartItem = {
    productId: product.id,
    name: product.name,
    price: product.price,
    quantity: req.body.quantity
  };
  
  cart.push(cartItem);
  product.stock -= req.body.quantity;
  
  res.status(201).json(cartItem);
});

module.exports = router;