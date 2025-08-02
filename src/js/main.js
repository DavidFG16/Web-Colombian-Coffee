import { login, register, fetchVariedades } from './utils/api.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginMessage = document.getElementById('login-message');
    const registerMessage = document.getElementById('register-message');
    const variedadesSection = document.getElementById('variedades-section');
    const variedadesList = document.getElementById('variedades-list');
    const logoutButton = document.getElementById('logout');
    let userId = null;

    if (!registerMessage) {
        console.error('Elemento register-message no encontrado en el DOM');
        return;
    }

    // Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const data = await login(email, password);
            if (data.token) {
                localStorage.setItem('token', data.token);
                userId = data.user_id || null;
                loginMessage.innerHTML = `<div class="alert alert-success">${data.message || 'Login exitoso'}</div>`;
                await loadVariedades();
                variedadesSection.style.display = 'block';
                loginForm.reset();
            } else {
                loginMessage.innerHTML = `<div class="alert alert-danger">${data.error || 'Error al iniciar sesión'}</div>`;
            }
        } catch (error) {
            console.error('Error en login:', error);
            loginMessage.innerHTML = `<div class="alert alert-danger">Error al procesar el login</div>`;
        }
    });

    // Register
   registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('register-name').value;
    const correo = document.getElementById('register-email').value;
    const contrasena = document.getElementById('register-password').value;

    try {
        const response = await register(nombre, correo, contrasena);
        console.log('Respuesta recibida:', response);
        const data = await response.json().catch(err => {
            console.error('Error al parsear JSON:', err);
            return { error: 'Error al procesar la respuesta' };
        });
        console.log('Datos parseados:', data);
        if (response.ok && data.id) {
            registerMessage.innerHTML = `<div class="alert alert-success">Registro exitoso</div>`;
            registerForm.reset();
        } else {
            registerMessage.innerHTML = `<div class="alert alert-danger">${data.error || 'Error al registrar'}</div>`;
        }
    } catch (error) {
        console.error('Error en el registro:', error);
        registerMessage.innerHTML = `<div class="alert alert-danger">Error al procesar el registro</div>`;
    }
});

    // Cargar variedades
    async function loadVariedades() {
        if (localStorage.getItem('token')) {
            try {
                const variedades = await fetchVariedades();
                variedadesList.innerHTML = '';
                variedades.forEach(variedad => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item';
                    li.textContent = `${variedad.nombre} - ${variedad.descripcion}`;
                    variedadesList.appendChild(li);
                });
            } catch (error) {
                variedadesList.innerHTML = '<li class="list-group-item text-danger">Error al cargar variedades</li>';
                console.error(error);
            }
        }
    }

    // Cerrar sesión
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        userId = null;
        variedadesSection.style.display = 'none';
        variedadesList.innerHTML = '';
        loginMessage.innerHTML = '<div class="alert alert-info">Sesión cerrada</div>';
    });

    // Cargar variedades si ya hay token
    if (localStorage.getItem('token')) {
        loadVariedades();
        variedadesSection.style.display = 'block';
    }
});