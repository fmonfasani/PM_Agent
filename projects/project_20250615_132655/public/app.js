document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupCartLink();
});

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function displayProducts(products) {
    const container = document.getElementById('products-container');
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <h3>${product.name}</h3>
            <p>$${product.price}</p>
            <p>Stock: ${product.stock}</p>
            <button onclick="addToCart(${product.id})">Add to Cart</button>
        </div>
    `).join('');
}

async function addToCart(productId) {
    try {
        const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId, quantity: 1 })
        });
        updateCartCount();
    } catch (error) {
        console.error('Error adding to cart:', error);
    }
}

async function updateCartCount() {
    try {
        const response = await fetch('/api/cart');
        const cart = await response.json();
        document.getElementById('cart-count').textContent = cart.length;
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

function setupCartLink() {
    document.getElementById('cart-link').addEventListener('click', async (e) => {
        e.preventDefault();
        const productsContainer = document.getElementById('products-container');
        const cartContainer = document.getElementById('cart-container');
        
        if (cartContainer.style.display === 'none') {
            productsContainer.style.display = 'none';
            cartContainer.style.display = 'block';
            await loadCart();
        } else {
            productsContainer.style.display = 'grid';
            cartContainer.style.display = 'none';
        }
    });
}

async function loadCart() {
    try {
        const response = await fetch('/api/cart');
        const cart = await response.json();
        displayCart(cart);
    } catch (error) {
        console.error('Error loading cart:', error);
    }
}

function displayCart(cart) {
    const container = document.getElementById('cart-items');
    let total = 0;
    
    container.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
        return `
            <div class="cart-item">
                <span>${item.name}</span>
                <span>$${item.price} x ${item.quantity}</span>
                <button onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        `;
    }).join('');
    
    document.getElementById('total-amount').textContent = total.toFixed(2);
}

async function removeFromCart(productId) {
    try {
        await fetch(`/api/cart/${productId}`, {
            method: 'DELETE'
        });
        await loadCart();
        updateCartCount();
    } catch (error) {
        console.error('Error removing from cart:', error);
    }
}