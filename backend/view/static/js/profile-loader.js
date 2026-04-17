import { getCurrentUserProfile, updateCurrentUserProfile } from './apiService.js?v=profile-fix-2';

const SESSION_KEY = 'subsonic_session';

// --- Auth Check ---
const checkAuth = () => {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (!session) {
        window.location.href = '../auth/login.html';
        return null;
    }
    return session;
};

const redirectToLogin = () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = '../auth/login.html';
};

const isAuthError = (error) => {
    return error?.status === 401 || error?.status === 403 || /status:\s*(401|403)/.test(error?.message || '');
};

const syncSessionProfile = (user) => {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (!session || !user) return;

    localStorage.setItem(SESSION_KEY, JSON.stringify({
        ...session,
        id: user.id ?? session.id,
        email: user.email ?? session.email,
        role: user.role ?? session.role,
        name: user.name ?? session.name,
    }));
};


// --- UI Rendering ---

const renderProfile = (user) => {
    if (!user) {
        document.getElementById('profileBox').innerHTML = '<p class="error-message">No se pudo cargar la informacion del perfil.</p>';
        return;
    }

    document.getElementById('name').value = user.name || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('username').value = user.email || ''; // Use email as username

    const joinDate = user.joinDate ? new Date(user.joinDate) : null;
    document.getElementById('joinDate').value = joinDate && !Number.isNaN(joinDate.valueOf()) ? joinDate.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : '';
};

const handleFormSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');

    const updatedData = {
        name: formData.get('name'),
        email: formData.get('email'),
    };

    if (submitButton) submitButton.disabled = true;

    try {
        const user = await updateCurrentUserProfile(updatedData);
        syncSessionProfile(user);
        renderProfile(user);
        alert('Perfil guardado con exito.');
    } catch (error) {
        console.error('Error al guardar el perfil:', error);
        if (isAuthError(error)) {
            redirectToLogin();
            return;
        }
        alert(`No se pudo guardar el perfil. ${error.message}`);
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
};


// --- Page Load ---

const loadProfilePage = async () => {
    const session = checkAuth();
    if (session === null) return; // Stop execution if not authenticated

    const profileBox = document.getElementById('profileBox');

    try {
        const user = await getCurrentUserProfile();
        syncSessionProfile(user);
        renderProfile(user);
    } catch (error) {
        console.error('Error al cargar el perfil:', error);
        if (isAuthError(error)) {
            redirectToLogin();
            return;
        }
        profileBox.innerHTML = `<p class="error-message">No se pudo cargar tu perfil ahora mismo. ${error.message}</p>`;
    }

    const profileForm = document.getElementById('profileForm');
    if (profileForm && !profileForm.dataset.profileLoaderBound) {
        profileForm.dataset.profileLoaderBound = '1';
        profileForm.addEventListener('submit', handleFormSubmit);
    }
};

document.addEventListener('DOMContentLoaded', loadProfilePage);
