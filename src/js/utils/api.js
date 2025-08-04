// js/utils/api.js
export async function login(correo, contrasena) {
    const response = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en el login');
    }
    return response.json();
}

export async function register(nombre, correo, contrasena, rol = 'user') {
    const endpoint = rol === 'admin' ? 'http://localhost:8080/register/admin' : 'http://localhost:8080/register/user';
    const token = localStorage.getItem('token'); // Obtener token del login
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token && rol === 'admin') {
        headers['Authorization'] = `Bearer ${token}`; // Añadir token para admin
    }
    const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ nombre, correo, contrasena }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en el registro');
    }
    return response.json();
}

export async function fetchVariedades() {
    const correo = localStorage.getItem('correo');
    const contrasena = localStorage.getItem('contrasena');
    if (!correo || !contrasena) {
        throw new Error('Credenciales no disponibles');
    }

    const credentials = btoa(`${correo}:${contrasena}`);
    const response = await fetch('http://localhost:8080/variedades', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`
        },
    });
    if (!response.ok) {
        const errorData = await response.json();
        return {
            success: false,
            error: errorData.error || 'Error desconocido',
            message: errorData.message || 'Fallo al cargar variedades'
        };
    }
    const data = await response.json();
    return {
        success: true,
        data: data,
        message: 'Variedades cargadas exitosamente'
    };
}