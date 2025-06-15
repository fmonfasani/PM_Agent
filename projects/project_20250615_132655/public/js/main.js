document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        
        const productsContainer = document.getElementById('products-container');
        
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'bg-white rounded-lg shadow-md p-6';
            productCard.innerHTML = `
                <h2 class="text-xl font-semibold mb-2">${product.name}</h2>
                <p class="text-gray-600 mb-4">${product.description}</p>
                <p class="text-lg font-bold mb-4">$${product.price.toFixed(2)}</p>
                <button 
                    onclick="addToCart(${product.id})"
                    class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Add to Cart
                </button>
            `;
            productsContainer.appendChild(productCard);
        });
    } catch (error) {
        console.error('Error loading products:', error);
    }
});

async function addToCart(productId) {
    try {
        const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId })
        });
        
        if (response.ok) {
            alert('Product added to cart!');
        } else {
            alert('Error adding product to cart');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Error adding product to cart');
    }
}