import { getAllProducts } from './apiService.js';

// These functions are expected to be globally available from data.js and app.js
// A full refactor would turn them into modules.
const money = (n) => `€${Number(n || 0).toFixed(2)}`;

// --- Cart Badge & Animation ---
function updateCartBadge() {
    const cart = window.store?.loadCart?.() || [];
    const count = cart.reduce((a, i) => a + (i.qty || 0), 0);
    const badge = document.getElementById("cartCount");
    if (badge) badge.textContent = String(count);
    const navLink = document.getElementById('navCartLink');
    if (navLink) navLink.textContent = `Carrito (${count})`;
}

// --- Product Rendering & Logic ---
let allProducts = []; // Cache products to avoid re-fetching on filter change

const renderProducts = () => {
    const grid = document.getElementById('productGrid');
    if (!grid) {
        console.error('Product grid container not found.');
        return;
    }

    grid.className = 'store-grid';
    grid.innerHTML = ''; 

    const urlParams = new URLSearchParams(window.location.search);
    const cat = urlParams.get('cat');
    const filtered = allProducts.filter(p => !cat || p.category === cat || p.gender === cat);

    if (filtered.length === 0) {
        grid.innerHTML = '<p>No products found for this category.</p>';
        return;
    }

    filtered.forEach(p => {
        const card = document.createElement("article");
        card.className = "store-card card";
        const img = (p.images && p.images.length) ? p.images[0] : '../fotos_principales/principal.jpg';

        card.innerHTML = `
            <div class="store-media" style="background-image:url('${img}')"></div>
            <div class="store-overlay">
                <div>
                    <div class="badge">${p.category} • ${p.gender}</div>
                    <h3 class="h-title">${p.name}</h3>
                    <p class="small">${p.desc}</p>
                </div>
                <div class="store-actions">
                    <strong class="price">${money(p.price)}</strong>
                    <div class="row">
                        <a class="btn" href="product.html?id=${p.id}">Ver</a>
                        <button class="btn secondary add-quick" data-id="${p.id}">Añadir</button>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    // Re-bind quick add buttons
    bindQuickAddButtons();
};

const bindQuickAddButtons = () => {
    document.querySelectorAll('.add-quick').forEach(b => {
        if (b.dataset.bound) return;
        b.dataset.bound = '1';
        b.addEventListener('click', () => {
            const pid = Number(b.getAttribute('data-id'));
            const prod = allProducts.find(x => x.id === pid);
            if (!prod) return;

            const cart = window.store.loadCart();
            const key = `${prod.id}_M`; // Default to size 'M' for quick add
            const item = cart.find(x => x.key === key);

            if (item) item.qty += 1;
            else cart.push({ key, productId: prod.id, size: 'M', qty: 1 });

            window.store.saveCart(cart);
            updateCartBadge();
            window.animateCartLink?.();
            window.showToastMini?.('Añadido al carrito');
        });
    });
};

const bindCategoryFilters = () => {
    const chips = document.querySelectorAll("[data-cat]");
    chips.forEach(ch => {
        if (ch.dataset.bound) return;
        ch.dataset.bound = "1";
        ch.addEventListener("click", () => {
            const cat = ch.getAttribute("data-cat");
            const url = new URL(window.location.href);
            if (cat) {
                url.searchParams.set("cat", cat);
            } else {
                url.searchParams.delete("cat");
            }
            window.location.href = url.toString();
        });
    });
}

const loadStore = async () => {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    grid.innerHTML = '<p>Loading products...</p>';

    try {
        allProducts = await getAllProducts();
        renderProducts();
        bindCategoryFilters();
        updateCartBadge(); // Initial cart count
    } catch (error) {
        console.error('Failed to load products:', error);
        grid.innerHTML = '<p style="color: red;">Could not load products. Please try again later.</p>';
    }
};

document.addEventListener('DOMContentLoaded', loadStore);
