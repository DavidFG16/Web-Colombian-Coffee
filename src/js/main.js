import { login, register, fetchVariedades } from './utils/api.js';
import { initMap } from './utils/mapa.js'; // Importa initMap

// Función de debounce
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Función para calcular porcentaje
function calcularPorcentaje(valor) {
    switch ((valor || '').toLowerCase()) {
        case 'muy bajo': return 10;
        case 'bajo': return 30;
        case 'medio': return 50;
        case 'alto': return 75;
        case 'muy alto': return 90;
        case 'excelente': return 100;
        default: return 50;
    }
}

// Función para determinar el tamaño del grano y devolver la clase correspondiente
function getGrainSizeClass(tamano_grano) {
    switch ((tamano_grano || '').toLowerCase()) {
        case 'pequeño': return 'grain-small';
        case 'mediano': return 'grain-medium';
        case 'grande': return 'grain-large';
        case 'muy grande': return 'grain-extra-large';
        default: return 'grain-medium'; // Valor por defecto
    }
}

// Definir loadVariedades fuera del DOMContentLoaded
let allVarieties = []; // Variable para almacenar todas las variedades
async function loadVariedades(searchTerm = '') {
    const variedadesList = document.getElementById('variedades-list');
    const popupMessage = document.getElementById('popup-message');
    const popup = document.getElementById('popup');

    if (!localStorage.getItem('correo') || !localStorage.getItem('contrasena')) {
        variedadesList.innerHTML = '<li class="list-group-item text-danger">No has iniciado sesión</li>';
        return;
    }

    try {
        if (allVarieties.length === 0) {
            const response = await fetchVariedades();
            if (response.success) {
                allVarieties = response.data.data || response.data; // Cargar datos solo una vez
                console.log('Datos de variedades cacheados:', allVarieties.length);
            } else {
                variedadesList.innerHTML = `<li class="list-group-item text-danger">Error: ${response.message || 'Fallo al cargar variedades'}</li>`;
                return;
            }
        }

        const filteredVarieties = searchTerm
            ? allVarieties.filter(variedad =>
                variedad.nombre_comun.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (variedad.pais_lanzamiento && variedad.pais_lanzamiento.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (variedad.descripcion && variedad.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
            )
            : allVarieties;

        variedadesList.innerHTML = ''; // Limpiar lista antes de renderizar
        if (filteredVarieties.length > 0) {
            const fragment = document.createDocumentFragment(); // Usar fragmento para optimizar DOM
            filteredVarieties.forEach(variedad => {
                const tarjeta = document.createElement('div');
tarjeta.className = 'bg-white shadow-lg rounded-lg p-4 mb-4 border-l-4 border-coffee-medium transform hover:scale-105 transition duration-300';
const yieldPercentage = calcularPorcentaje(variedad.rendimiento_potencial);
const grainSizeClass = getGrainSizeClass(variedad.tamano_grano);
tarjeta.innerHTML = `
    <div class="flex justify-between items-center mb-2">
        <h3 class="text-2xl font-bold text-coffee-dark">${variedad.nombre_comun}</h3>
        ${variedad.imagen ? `<img src="${variedad.imagen}" alt="${variedad.nombre_comun}" class="w-16 h-16 object-cover rounded-full">` : ''}
    </div>
    <div class="text-gray-600 mb-2">
        <p><strong>Científico:</strong> ${variedad.nombre_cientifico || 'Coffea canephora'}</p>
        <p><strong>Origen:</strong> ${variedad.pais_lanzamiento || 'No especificado'}</p>
    </div>
    <div class="mb-2">
        <p class="font-semibold text-coffee-dark">Rendimiento Potencial</p>
        <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="bg-coffee-medium h-2.5 rounded-full" style="width: ${yieldPercentage}%;"></div>
        </div>
        <p class="text-sm text-gray-500">${variedad.rendimiento_potencial || 'Medio'}</p>
    </div>
    <div class="mb-2">
        <p class="font-semibold text-coffee-dark">Tamaño del Grano</p>
        <div class="flex justify-around items-center grain-size-container">
            <div class="grain-icon ${grainSizeClass === 'grain-small' ? 'grain-active' : 'grain-inactive'} grain-small"></div>
            <div class="grain-icon ${grainSizeClass === 'grain-medium' ? 'grain-active' : 'grain-inactive'} grain-medium"></div>
            <div class="grain-icon ${grainSizeClass === 'grain-large' ? 'grain-active' : 'grain-inactive'} grain-large"></div>
            <div class="grain-icon ${grainSizeClass === 'grain-extra-large' ? 'grain-active' : 'grain-inactive'} grain-extra-large"></div>
        </div>
        <p class="text-sm text-gray-500">${variedad.tamano_grano || 'Mediano'}</p>
    </div>
    <div class="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <p><strong>Hoja:</strong> ${variedad.color_punta_hoja || 'No especificado'}</p>
        <p><strong>Genética:</strong> ${variedad.descripcion_genetica || 'No especificado'}</p>
        <p><strong>Criador:</strong> ${variedad.criador || 'No especificado'}</p>
    </div>
    <p class="mt-2 text-gray-700">${variedad.descripcion || 'Sin descripción'}</p>
                                    ${localStorage.getItem('rol') === 'admin' ? `<button class="delete-variety absolute bottom-2 right-2 bg-red-500 text-white p-1 rounded hover:bg-red-600" data-id="${variedad.id || ''}"><img src="./assets/images/delete.png"></button>` : ''}
`;
fragment.appendChild(tarjeta);
            });
            variedadesList.appendChild(fragment); // Renderizar de una vez

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
                                    allVarieties = allVarieties.filter(v => v.id !== parseInt(varietyId)); // Actualizar caché
                                    loadVariedades(searchTerm); // Recargar con el mismo término
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
    } catch (error) {
        variedadesList.innerHTML = '<li class="list-group-item text-danger">Error al cargar variedades</li>';
        console.error('Error en loadVariedades:', error);
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
    const searchInput = document.getElementById('search-variety');
    const addVarietyModal = document.getElementById('add-variety-modal');
    const openAddVarietyModal = document.getElementById('open-add-variety-modal');
    const closeAddVarietyModal = document.getElementById('close-add-variety-modal');
    const addVarietyForm = document.getElementById('add-variety-form');
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
        const nombre_cientifico = document.getElementById('variety-scientific-name').value || 'Coffea canephora';
        const pais_lanzamiento = document.getElementById('variety-origin').value;
        const rendimiento_potencial = document.getElementById('variety-yield').value;
        const tamano_grano = document.getElementById('variety-grain-size').value;
        const color_punta_hoja = document.getElementById('variety-leaf-color').value;
        const descripcion_genetica = document.getElementById('variety-genetic-desc').value;
        const criador = document.getElementById('variety-breeder').value;
        const descripcion = document.getElementById('variety-description').value;
        const imagen = document.getElementById('variety-image').value;

        try {
            const response = await fetch('http://localhost:8080/variedades', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${btoa(`${localStorage.getItem('correo')}:${localStorage.getItem('contrasena')}`)}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nombre_comun, nombre_cientifico, pais_lanzamiento, rendimiento_potencial, tamano_grano, color_punta_hoja, descripcion_genetica, criador, descripcion, imagen })
            });
            if (response.ok) {
                addVarietyModal.classList.add('hidden');
                addVarietyForm.reset();
                allVarieties = []; // Forzar recarga de datos
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

    // Manejar búsqueda dinámica con debounce
    const debouncedSearch = debounce((searchTerm) => {
        loadVariedades(searchTerm);
    }, 300); // Espera 300ms tras el último cambio

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim();
        debouncedSearch(searchTerm); // Llamar a la función debounced
    });
});