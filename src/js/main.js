// js/main.js
import { login, register, fetchVariedades } from './utils/api.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginMessage = document.getElementById('login-message');
    const registerMessage = document.getElementById('register-message');
    const variedadesSection = document.getElementById('variedades-section');
    const variedadesList = document.getElementById('variedades-list');
    const logoutButton = document.getElementById('logout');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const popup = document.getElementById('popup');
    const popupMessage = document.getElementById('popup-message');
    const closePopup = document.getElementById('close-popup');
    let userId = null;

    if (!registerMessage) {
        console.error('Elemento register-message no encontrado en el DOM');
        return;
    }

    // Mostrar registro y ocultar login
    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });

    // Mostrar login y ocultar registro
    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    // Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            console.log('Intentando login con:', { email, password });
            const data = await login(email, password);
            console.log('Respuesta del login:', data);
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('correo', email);
                localStorage.setItem('contrasena', password);
                console.log('Credenciales almacenadas:', { correo: email, contrasena: password });
                userId = data.user_id || null;
                loginMessage.innerHTML = '';
                localStorage.setItem('nombre', data.nombre);
                localStorage.setItem('rol', data.rol);
                await loadVariedades();
                variedadesSection.classList.remove('hidden');
                loginForm.classList.add('hidden');
                registerForm.classList.add('hidden');
                logoutButton.classList.remove('hidden');
                loginForm.reset();
                // Mostrar popup de login exitoso
                popupMessage.textContent = '¡Inicio de sesión exitoso!';
                popup.classList.remove('hidden');
                setTimeout(() => popup.classList.add('hidden'), 3000); // Ocultar después de 3 segundos
            } else {
                loginMessage.innerHTML = `<div class="alert alert-danger">${data.error || 'Error al iniciar sesión'}</div>`;
            }
        } catch (error) {
            console.error('Error en login:', error);
            loginMessage.innerHTML = `<div class="alert alert-danger">Error al procesar el login: ${error.message}</div>`;
        }
    });

    // Register
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        try {
            console.log('Intentando registrar con:', { nombre, email, password });
            const data = await register(nombre, email, password);
            console.log('Respuesta del registro:', data);
            if (data.id) {
                registerMessage.innerHTML = '';
                registerForm.reset();
                registerForm.classList.add('hidden');
                loginForm.classList.remove('hidden');
                // Mostrar popup de registro exitoso
                popupMessage.textContent = '¡Cuenta creada exitosamente!';
                popup.classList.remove('hidden');
                setTimeout(() => popup.classList.add('hidden'), 3000); // Ocultar después de 3 segundos
            } else {
                registerMessage.innerHTML = `<div class="alert alert-danger">${data.error || 'Error al registrar'}</div>`;
            }
        } catch (error) {
            console.error('Error en register:', error);
            registerMessage.innerHTML = `<div class="alert alert-danger">Error al procesar el registro: ${error.message}</div>`;
        }
    });

    // Cargar variedades
    async function loadVariedades() {
        console.log('Iniciando loadVariedades');
        if (localStorage.getItem('correo') && localStorage.getItem('contrasena')) {
            console.log('Credenciales encontradas:', localStorage.getItem('correo'), localStorage.getItem('contrasena'));
            try {
                const response = await fetchVariedades();
                console.log('Respuesta de fetchVariedades:', response);
                if (response.success) {
                    variedadesList.innerHTML = '';
                    const variedades = response.data.data || response.data;
                    console.log('Variedades a renderizar:', variedades);
                    if (variedades && Array.isArray(variedades) && variedades.length > 0) {
                        variedades.forEach(variedad => {
                            const tarjeta = document.createElement('div');
                            tarjeta.className = 'card bg-white shadow-md rounded-lg overflow-hidden mb-4 transform hover:scale-105 transition duration-300';
                            tarjeta.innerHTML = `
                                <img src="${variedad.imagen || 'https://via.placeholder.com/300'}" alt="${variedad.nombre_comun}" class="w-full h-48 object-cover">
                                <div class="p-4">
                                    <h3 class="text-xl font-bold text-gray-800">${variedad.nombre_comun}</h3>
                                    <p class="text-gray-600"><strong>Científico:</strong> ${variedad.nombre_cientifico}</p>
                                    <p class="text-gray-600"><strong>País:</strong> ${variedad.pais_lanzamiento || 'No especificado'}</p>
                                    <p class="text-gray-600"><strong>Tamaño grano:</strong> ${variedad.tamano_grano || 'No especificado'}</p>
                                    <p class="text-gray-600"><strong>Color hoja:</strong> ${variedad.color_punta_hoja || 'No especificado'}</p>
                                    <p class="text-gray-600"><strong>Genética:</strong> ${variedad.descripcion_genetica || 'No especificado'}</p>
                                    <p class="text-gray-600"><strong>Criador:</strong> ${variedad.criador || 'No especificado'}</p>
                                    <p class="text-gray-700">${variedad.descripcion || 'Sin descripción'}</p>
                                </div>
                            `;
                            variedadesList.appendChild(tarjeta);
                        });
                    } else {
                        variedadesList.innerHTML = '<li class="list-group-item text-warning">No se encontraron variedades</li>';
                    }
                } else {
                    variedadesList.innerHTML = `<li class="list-group-item text-danger">Error: ${response.message || 'Fallo al cargar variedades'}</li>`;
                }
            } catch (error) {
                variedadesList.innerHTML = '<li class="list-group-item text-danger">Error al cargar variedades</li>';
                console.error('Error en loadVariedades:', error);
            }
        } else {
            console.log('No hay credenciales almacenadas');
            variedadesList.innerHTML = '<li class="list-group-item text-danger">No has iniciado sesión</li>';
        }
    }

    // Cerrar sesión
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('correo');
        localStorage.removeItem('contrasena');
        userId = null;
        variedadesSection.classList.add('hidden');
        variedadesList.innerHTML = '';
        loginMessage.innerHTML = '<div class="alert alert-info">Sesión cerrada</div>';
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        logoutButton.classList.add('hidden');
    });

    // Cargar variedades si ya hay credenciales
    if (localStorage.getItem('correo') && localStorage.getItem('contrasena')) {
        loadVariedades();
        variedadesSection.classList.remove('hidden');
        loginForm.classList.add('hidden');
        registerForm.classList.add('hidden');
        logoutButton.classList.remove('hidden');
    }

    // Cerrar popup al hacer clic en el botón
    closePopup.addEventListener('click', () => {
        popup.classList.add('hidden');
    });
});