import { getExperiences } from './apiService.js';

const renderExperiences = (experiences, container) => {
    container.innerHTML = ''; // Clear loading message

    if (!experiences || experiences.length === 0) {
        container.innerHTML = '<p>No hay experiencias disponibles en este momento.</p>';
        return;
    }

    experiences.forEach(exp => {
        const card = document.createElement('div');
        card.className = 'exp-card';
        if (exp.featured) {
            card.classList.add('exp-card-featured');
        }
        if (exp.premium) {
            card.classList.add('exp-card-premium');
        }

        const featuresList = exp.features.map(feature => `<li>${feature}</li>`).join('');

        let btnStyle = '';
        if (exp.premium) {
            btnStyle = 'style="background: linear-gradient(135deg, #f7d37b, #ff4fd8);"';
        }

        card.innerHTML = `
            <div class="exp-card-header">
                <h2>${exp.title}</h2>
                <span class="exp-badge">${exp.badge}</span>
            </div>
            <p>${exp.description}</p>
            <ul class="exp-features">
                ${featuresList}
            </ul>
            <a href="${exp.link}" class="btn" ${btnStyle} aria-label="Explorar ${exp.title}">${exp.linkLabel}</a>
        `;

        container.appendChild(card);
    });
};

const loadExperiences = async () => {
    const grid = document.getElementById('experiences-grid');
    if (!grid) {
        console.error('El contenedor #experiences-grid no fue encontrado.');
        return;
    }

    grid.innerHTML = '<p class="loading-message">Cargando experiencias...</p>';

    try {
        const experiences = await getExperiences();
        renderExperiences(experiences, grid);
    } catch (error) {
        console.error('Error al cargar las experiencias:', error);
        grid.innerHTML = '<p class="error-message">No se pudieron cargar las experiencias. Inténtalo de nuevo más tarde.</p>';
    }
};

document.addEventListener('DOMContentLoaded', loadExperiences);
