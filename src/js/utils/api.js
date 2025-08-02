export async function login(email, password) {
    const response = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    return response.json();
}

export async function register(nombre, correo, contrasena) {
    try {
        const response = await fetch('http://localhost:8080/register/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                nombre: nombre,
                correo: correo, 
                contrasena: contrasena,
                rol: 'user' }),
        });
        console.log('Respuesta cruda dentro de register:', response);
        if (!response) {
            console.error('Fetch devolvió undefined');
            throw new Error('Respuesta inválida del servidor');
        }
        return response; // Devuelve el Response para parseo en main.js
    } catch (error) {
        console.error('Error en fetch:', error);
        throw error; // Propaga el error para que main.js lo maneje
    }
}

export async function fetchVariedades() {
    const response = await fetch('http://localhost:8080/variedades');
    if (!response.ok) throw new Error('Error al cargar variedades');
    return response.json();
}