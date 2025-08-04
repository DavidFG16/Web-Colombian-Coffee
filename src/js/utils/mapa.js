// js/utils/mapa.js
let map = null;

// Mapeo de países y regiones a coordenadas aproximadas
const originCoords = {
    'Colombia': [4.5709, -74.2973], // Centro aproximado
    'Etiopía': [9.1450, 40.4897],
    'Brasil': [-14.2350, -51.9253],
    'Zona Norte': [7.1254, -73.1207], // Aproximado (norte, como Antioquia)
    'Zona Centro': [4.6097, -74.0817], // Aproximado (centro, como Cundinamarca)
    // Agrega más regiones o países según necesites (por ejemplo, 'Etiopía', 'Brasil')
};

export function initMap() {
    if (map) return; // Evita reinicialización
    const mapElement = document.getElementById('map');
    if (!mapElement || mapElement.offsetHeight === 0) {
        console.warn('El contenedor del mapa no está listo.');
        return;
    }

    map = L.map('map').setView([4.5709, -74.2973], 5); // Zoom más amplio

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    console.log('Mapa inicializado correctamente.');
    loadVariedadesOnMap(); // Cargar marcadores al inicializar
}

async function loadVariedadesOnMap() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No hay token de autenticación.');
        return;
    }

    try {
        const response = await fetch('http://localhost:8080/variedades', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        console.log('Respuesta de la API:', data); // Depuración
        if (data.success && Array.isArray(data.data)) {
            data.data.forEach(variedad => {
                let origin = variedad.pais_lanzamiento;
                if (variedad.nombre_comun.includes('Zona Norte')) origin = 'Zona Norte';
                else if (variedad.nombre_comun.includes('Zona Centro')) origin = 'Zona Centro';
                const coords = originCoords[origin];
                console.log(`Variedad: ${variedad.nombre_comun}, Origen: ${origin}, Coordenadas: ${coords}`);
                if (coords) {
                    const marker = L.marker(coords).addTo(map);
                    marker.bindPopup(`
                        <b>${variedad.nombre_comun}</b><br>
                        Origen: ${origin || 'No especificado'}<br>
                        Descripción: ${variedad.descripcion || 'Sin descripción'}
                    `).openPopup(); // Depuración: abre automáticamente
                } else {
                    console.warn(`No se encontraron coordenadas para ${origin} de ${variedad.nombre_comun}`);
                }
            });
            const bounds = L.latLngBounds(Object.values(originCoords));
            map.fitBounds(bounds, { padding: [50, 50] });
        } else {
            console.error('Error al cargar variedades para el mapa:', data.message || 'Formato de datos inválido');
        }
    } catch (error) {
        console.error('Error en la solicitud de variedades:', error);
    }
}

// Exporta loadVariedadesOnMap si necesitas llamarla manualmente
export { loadVariedadesOnMap };