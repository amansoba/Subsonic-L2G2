import { getUserProfile } from './apiService.js';

// --- Auth Simulation ---
/**
 * Checks for a logged-in user.
 * In a real app, this would be a more robust check (e.g., against a session token).
 * For now, we'll check for a 'userId' in localStorage.
 * If not found, redirect to the login page.
 */
const checkAuth = () => {
    // For simulation purposes, let's log in user 1 if no one is logged in.
    if (!localStorage.getItem('loggedInUserId')) {
        console.log('No user logged in. Simulating login for user with ID 1.');
        localStorage.setItem('loggedInUserId', '1');
    }

    const userId = localStorage.getItem('loggedInUserId');
    if (!userId) {
        console.log('Redirecting to login page.');
        window.location.href = '../auth/login.html';
        return null;
    }
    return parseInt(userId, 10);
};


// --- UI Rendering ---

const renderProfile = (user) => {
    if (!user) {
        document.getElementById('profileBox').innerHTML = '<p class="error-message">No se pudo cargar la información del perfil.</p>';
        return;
    }
    document.getElementById('name').value = user.name;
    document.getElementById('email').value = user.email;
    document.getElementById('username').value = user.username;
    
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
