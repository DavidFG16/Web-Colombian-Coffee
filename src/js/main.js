import { login, register, fetchVariedades } from './utils/api.js';
import { initMap } from './utils/mapa.js'; // Importa initMap

// Definir loadVariedades fuera del DOMContentLoaded
async function loadVariedades() {
    const body = document.getElementById('body');
    const variedadesSection = document.getElementById('variedades-section');
    const variedadesList = document.getElementById('variedades-list');
    const logoutButton = document.getElementById('logout');
    const popupMessage = document.getElementById('popup-message');
    const popup = document.getElementById('popup');

    console.log('Iniciando loadVariedades');
    if (localStorage.getItem('correo') && localStorage.getItem('contrasena')) {
        try {
            const response = await fetchVariedades();
            console.log('Respuesta de fetchVariedades:', response);
            if (response.success) {
                variedadesList.innerHTML = '';
                const variedades = response.data.data || response.data;
                if (variedades && Array.isArray(variedades) && variedades.length > 0) {
                    variedades.forEach(variedad => {
                        const tarjeta = document.createElement('div');
                        tarjeta.className = 'card bg-white shadow-md rounded-lg overflow-hidden mb-4 transform hover:scale-105 transition duration-300';
                        const imageUrl = variedad.imagen ? variedad.imagen : 'https://via.placeholder.com/300';
                        console.log(`Imagen para ${variedad.nombre_comun}: ${imageUrl}`); // Depuración de imagen
                        tarjeta.innerHTML = `
                            <img src="${imageUrl}" alt="${variedad.nombre_comun}" class="w-full h-48 object-cover">
                            <div class="p-4 relative">
                                <h3 class="text-xl font-bold text-gray-800">${variedad.nombre_comun}</h3>
                                <p class="text-gray-600"><strong>Científico:</strong> ${variedad.nombre_cientifico}</p>
                                <p class="text-gray-600"><strong>País:</strong> ${variedad.pais_lanzamiento || 'No especificado'}</p>
                                <p class="text-gray-600"><strong>Tamaño grano:</strong> ${variedad.tamano_grano || 'No especificado'}</p>
                                <p class="text-gray-600"><strong>Color hoja:</strong> ${variedad.color_punta_hoja || 'No especificado'}</p>
                                <p class="text-gray-600"><strong>Genética:</strong> ${variedad.descripcion_genetica || 'No especificado'}</p>
                                <p class="text-gray-600"><strong>Criador:</strong> ${variedad.criador || 'No especificado'}</p>
                                <p class="text-gray-700">${variedad.descripcion || 'Sin descripción'}</p>
                                ${localStorage.getItem('rol') === 'admin' ? `<button class="delete-variety absolute top-2 right-2 bg-red-500 text-white p-1 rounded hover:bg-red-600" data-id="${variedad.id || ''}"><img src="./assets/images/delete.png"></button>` : ''}
                            </div>
                        `;
                        variedadesList.appendChild(tarjeta);
                    });
                    // Añadir evento para eliminar variedades
                    if (localStorage.getItem('rol') === 'admin') {
                        document.querySelectorAll('.delete-variety').forEach(button => {
                            button.addEventListener('click', async (e) => {
                                const varietyId = e.target.getAttribute('data-id');
                                if (varietyId && confirm('¿Estás seguro de eliminar esta variedad?')) {
                                    try {
                                        const response = await fetch(`http://localhost:8080/variedades/${varietyId}`, {
                                            method: 'DELETE',
                                            headers: {
                                                'Authorization': `Basic ${btoa(`${localStorage.getItem('correo')}:${localStorage.getItem('contrasena')}`)}`,
                                                'Content-Type': 'application/json'
                                            }
                                        });
                                        if (response.ok) {
                                            loadVariedades(); // Recargar variedades después de eliminar
                                            popupMessage.textContent = 'Variedad eliminada exitosamente!';
                                            popup.classList.remove('hidden');
                                            setTimeout(() => popup.classList.add('hidden'), 3000);
                                        } else {
                                            const errorData = await response.json();
                                            alert('Error al eliminar: ' + (errorData.error || 'Inténtalo de nuevo'));
                                        }
                                    } catch (error) {
                                        console.error('Error en la eliminación:', error);
                                        alert('Error al eliminar la variedad');
                                    }
                                } else {
                                    console.warn('ID de variedad no encontrado para eliminar:', varietyId);
                                }
                            });
                        });
                    }
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
        variedadesList.innerHTML = '<li class="list-group-item text-danger">No has iniciado sesión</li>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const body = document.getElementById('body');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const registerAdminForm = document.getElementById('registerAdminForm');
    const loginMessage = document.getElementById('login-message');
    const registerMessage = document.getElementById('register-message');
    const registerAdminMessage = document.getElementById('register-admin-message');
    const variedadesSection = document.getElementById('variedades-section');
    const mapaSection = document.getElementById('mapa-section');
    const variedadesList = document.getElementById('variedades-list');
    const logoutButton = document.getElementById('logout');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const backToLogin = document.getElementById('backToLogin');
    const popup = document.getElementById('popup');
    const popupMessage = document.getElementById('popup-message');
    const closePopup = document.getElementById('close-popup');
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const registerAdminLink = document.getElementById('register-admin-link');
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
        registerAdminForm.classList.add('hidden');
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
                localStorage.setItem('rol', data.rol); // Almacenar el rol del usuario
                await loadVariedades();
                variedadesSection.classList.remove('hidden');
                mapaSection.classList.add('hidden');
                loginForm.classList.add('hidden');
                registerForm.classList.add('hidden');
                logoutButton.classList.remove('hidden');
                navbar.classList.remove('hidden'); // Mostrar navbar
                if (data.rol === 'admin') {
                    registerAdminLink.classList.remove('hidden'); // Mostrar "Registrar admin" solo para admin
                }
                loginForm.reset();
                // Mostrar popup de login exitoso
                popupMessage.textContent = '¡Inicio de sesión exitoso!';
                popup.classList.remove('hidden');
                setTimeout(() => popup.classList.add('hidden'), 3000);
            } else {
                loginMessage.innerHTML = `<div class="alert alert-danger">${data.error || 'Error al iniciar sesión'}</div>`;
            }
        } catch (error) {
            console.error('Error en login:', error);
            loginMessage.innerHTML = `<div class="alert alert-danger">Error al procesar el login: ${error.message}</div>`;
        }
    });

    // Register (rol 'user' por defecto)
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        try {
            console.log('Intentando registrar con:', { nombre, email, password });
            const data = await register(nombre, email, password, 'user'); // Rol 'user' por defecto
            console.log('Respuesta del registro:', data);
            if (data.id) {
                registerMessage.innerHTML = '';
                registerForm.reset();
                registerForm.classList.add('hidden');
                loginForm.classList.remove('hidden');
                // Mostrar popup de registro exitoso
                popupMessage.textContent = '¡Cuenta creada exitosamente!';
                popup.classList.remove('hidden');
                setTimeout(() => popup.classList.add('hidden'), 3000);
            } else {
                registerMessage.innerHTML = `<div class="alert alert-danger">${data.error || 'Error al registrar'}</div>`;
            }
        } catch (error) {
            console.error('Error en register:', error);
            registerMessage.innerHTML = `<div class="alert alert-danger">Error al procesar el registro: ${error.message}</div>`;
        }
    });

    // Register Admin (rol 'admin')
    registerAdminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('register-admin-name').value;
        const email = document.getElementById('register-admin-email').value;
        const password = document.getElementById('register-admin-password').value;
        try {
            console.log('Intentando registrar admin con:', { nombre, email, password });
            const data = await register(nombre, email, password, 'admin'); // Rol 'admin'
            console.log('Respuesta del registro admin:', data);
            if (data.id) {
                registerAdminMessage.innerHTML = '';
                registerAdminForm.reset();
                // Mostrar popup de registro exitoso
                popupMessage.textContent = '¡Administrador registrado exitosamente!';
                popup.classList.remove('hidden');
                setTimeout(() => popup.classList.add('hidden'), 3000);
            } else {
                registerAdminMessage.innerHTML = `<div class="alert alert-danger">${data.error || 'Error al registrar administrador'}</div>`;
            }
        } catch (error) {
            console.error('Error en register admin:', error);
            registerAdminMessage.innerHTML = `<div class="alert alert-danger">Error al procesar el registro: ${error.message}</div>`;
        }
    });

    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('correo');
        localStorage.removeItem('contrasena');
        localStorage.removeItem('rol'); // Limpiar rol al cerrar sesión
        userId = null;
        variedadesSection.classList.add('hidden');
        mapaSection.classList.add('hidden');
        variedadesList.innerHTML = '';
        loginMessage.innerHTML = '<div class="alert alert-info">Sesión cerrada</div>';
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        registerAdminForm.classList.add('hidden');
        logoutButton.classList.add('hidden');
        navbar.classList.add('hidden');
        registerAdminLink.classList.add('hidden'); // Ocultar "Registrar admin" al cerrar sesión
        body.classList.add('background');
    });
    // Cargar variedades si ya hay credenciales
    if (localStorage.getItem('correo') && localStorage.getItem('contrasena')) {
        loadVariedades();
        body.classList.remove('background');
        variedadesSection.classList.remove('hidden');
        mapaSection.classList.add('hidden');
        loginForm.classList.add('hidden');
        registerForm.classList.add('hidden');
        logoutButton.classList.remove('hidden');
        navbar.classList.remove('hidden');
        if (localStorage.getItem('rol') === 'admin') {
            registerAdminLink.classList.remove('hidden'); // Mostrar "Registrar admin" si es admin
        }
    }

    // Cerrar popup al hacer clic en el botón
    closePopup.addEventListener('click', () => {
        popup.classList.add('hidden');
    });

    // Navegación entre secciones
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            if (section === 'variedades') {
                variedadesSection.classList.remove('hidden');
                mapaSection.classList.add('hidden');
                registerAdminForm.classList.add('hidden');
                loadVariedades(); // Recargar variedades al entrar
            } else if (section === 'mapa') {
                variedadesSection.classList.add('hidden');
                mapaSection.classList.remove('hidden');
                registerAdminForm.classList.add('hidden');
                initMap(); // Inicializar el mapa cuando se muestra la sección
            } else if (section === 'register-admin') {
                variedadesSection.classList.add('hidden');
                mapaSection.classList.add('hidden');
                registerAdminForm.classList.remove('hidden');
            }
        });
    });

    // Mostrar/Ocultar botón de agregar variedad según rol
    if (localStorage.getItem('rol') === 'admin') {
        document.getElementById('add-variety-button').classList.remove('hidden');
    }

    // Manejar popup de agregar variedad
    const addVarietyModal = document.getElementById('add-variety-modal');
    const openAddVarietyModal = document.getElementById('open-add-variety-modal');
    const closeAddVarietyModal = document.getElementById('close-add-variety-modal');
    const addVarietyForm = document.getElementById('add-variety-form');

    openAddVarietyModal.addEventListener('click', () => {
        addVarietyModal.classList.remove('hidden');
    });

    closeAddVarietyModal.addEventListener('click', () => {
        addVarietyModal.classList.add('hidden');
        addVarietyForm.reset();
    });

    addVarietyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre_comun = document.getElementById('variety-name').value;
        const pais_lanzamiento = document.getElementById('variety-origin').value;
        const imagen = document.getElementById('variety-image').value;
        const descripcion = document.getElementById('variety-description').value;

        try {
            const response = await fetch('http://localhost:8080/variedades', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${btoa(`${localStorage.getItem('correo')}:${localStorage.getItem('contrasena')}`)}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nombre_comun, pais_lanzamiento, imagen, descripcion })
            });
            if (response.ok) {
                addVarietyModal.classList.add('hidden');
                addVarietyForm.reset();
                await loadVariedades(); // Asegurar que se recargue correctamente
                popupMessage.textContent = 'Variedad agregada exitosamente!';
                popup.classList.remove('hidden');
                setTimeout(() => popup.classList.add('hidden'), 3000);
            } else {
                const errorData = await response.json();
                alert('Error al agregar: ' + (errorData.error || 'Inténtalo de nuevo'));
            }
        } catch (error) {
            console.error('Error al agregar variedad:', error);
            alert('Error al agregar la variedad');
        }
    });
});