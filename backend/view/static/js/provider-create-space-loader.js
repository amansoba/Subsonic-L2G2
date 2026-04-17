import { authFetch, config } from './apiService.js';

// --- Auth Check ---
const checkAuth = () => {
    const session = JSON.parse(localStorage.getItem('subsonic_session') || 'null');
    if (!session || session.role !== 'provider') {
        window.location.href = '../auth/login.html';
        return null;
    }
    return session;
};

// --- Load Events ---
const loadEvents = async () => {
    try {
        const response = await authFetch(`${config.API_BASE_URL}/events`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const events = await response.json();
        const select = document.getElementById('eventId');
        events.forEach(event => {
            const option = document.createElement('option');
            option.value = event.id;
            option.textContent = event.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar eventos:', error);
        document.getElementById('message').textContent = 'Error al cargar eventos.';
        document.getElementById('message').style.color = 'var(--accent-red)';
    }
};

// --- Form Submit ---
const handleFormSubmit = async (event) => {
    event.preventDefault();
    const session = checkAuth();
    if (!session) return;

    const formData = new FormData(event.target);
    const data = {
        eventId: parseInt(formData.get('eventId')),
        type: formData.get('type'),
        size: formData.get('size'),
        location: formData.get('location'),
        pricePerDay: parseFloat(formData.get('pricePerDay')),
        services: formData.get('services') || '',
        notes: formData.get('notes') || ''
    };

    try {
        const response = await authFetch(`${config.API_BASE_URL}/spaces`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        document.getElementById('message').textContent = 'Espacio creado exitosamente.';
        document.getElementById('message').style.color = 'var(--accent-green)';
        setTimeout(() => {
            window.location.href = 'provider-manage-spaces.html';
        }, 2000);
    } catch (error) {
        console.error('Error al crear espacio:', error);
        document.getElementById('message').textContent = `Error al crear espacio: ${error.message}`;
        document.getElementById('message').style.color = 'var(--accent-red)';
    }
};

// --- Page Load ---
document.addEventListener('DOMContentLoaded', async () => {
    const session = checkAuth();
    if (!session) return;

    await loadEvents();

    const form = document.getElementById('createSpaceForm');
    form.addEventListener('submit', handleFormSubmit);
});