import { getUserProfile } from './apiService.js';

// --- Auth Check ---
const checkAuth = () => {
    const session = JSON.parse(localStorage.getItem('subsonic_session') || 'null');
    if (!session) {
        window.location.href = '../auth/login.html';
        return null;
    }
    return session.id;
};


// --- UI Rendering ---

const renderProfile = (user) => {
    if (!user) {
        document.getElementById('profileBox').innerHTML = '<p class="error-message">No se pudo cargar la información del perfil.</p>';
        return;
    }
    document.getElementById('name').value = user.name;
    document.getElementById('email').value = user.email;
    document.getElementById('username').value = user.email; // Use email as username
    
    const joinDate = new Date(user.joinDate);
    document.getElementById('joinDate').value = joinDate.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const handleFormSubmit = (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const updatedData = {
        name: formData.get('name'),
        email: formData.get('email'),
    };

    // In a real app, you would send this data to the backend.
    // For now, we just log it and show an alert.
    console.log('Guardando perfil:', updatedData);
    alert('Perfil guardado con éxito (simulación).');
};


// --- Page Load ---

const loadProfilePage = async () => {
    const userId = checkAuth();
    if (userId === null) return; // Stop execution if not authenticated

    const profileBox = document.getElementById('profileBox');
    
    try {
        const user = await getUserProfile(userId);
        renderProfile(user);
    } catch (error) {
        console.error('Error al cargar el perfil:', error);
        profileBox.innerHTML = `<p class="error-message">Hubo un problema al cargar tu perfil. ${error.message}</p>`;
    }
    
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleFormSubmit);
    }
};

document.addEventListener('DOMContentLoaded', loadProfilePage);
