import { getProductById } from './apiService.js';

const populateForm = (product) => {
    const form = document.getElementById('edit-product-form');
    if (!form || !product) return;

    form.elements['id'].value = product.id;
    form.elements['name'].value = product.name;
    form.elements['price'].value = product.price;
    form.elements['category'].value = product.category;
    form.elements['gender'].value = product.gender;
    form.elements['sizes'].value = product.sizes.join(', ');
    form.elements['desc'].value = product.desc;
    form.elements['images'].value = product.images.join(', ');
};

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const productId = parseInt(params.get('id'), 10);

    if (!productId) {
        document.getElementById('form-container').innerHTML = '<h1>ID de producto no especificado</h1><a href="manage-products.html" class="btn">Volver a la lista</a>';
        return;
    }

    try {
        const product = await getProductById(productId);
        populateForm(product);
    } catch (error) {
        console.error('Error al cargar el producto:', error);
        document.getElementById('form-container').innerHTML = '<h1>Producto no encontrado</h1><a href="manage-products.html" class="btn">Volver a la lista</a>';
    }

    const form = document.getElementById('edit-product-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const updatedProduct = Object.fromEntries(formData.entries());
            // Convert comma-separated strings back to arrays for simulation
            updatedProduct.sizes = updatedProduct.sizes.split(',').map(s => s.trim());
            updatedProduct.images = updatedProduct.images.split(',').map(s => s.trim());
            
            console.log('Producto actualizado (simulación):', updatedProduct);
            alert('Producto actualizado con éxito (simulación). Revisa la consola para ver los datos.');
        });
    }
});
