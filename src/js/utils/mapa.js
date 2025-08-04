// js/utils/mapa.js
import { fetchVariedades } from './api.js'; // Importa fetchVariedades desde api.js

let map = null;

// Mapeo de países y regiones a coordenadas aproximadas
const originCoords = {
    'Colombia': [4.5709, -74.2973], // Centro aproximado
    'Etiopía': [9.1450, 40.4897],
    'Brasil': [-14.2350, -51.9253],
    'Zona Norte': [7.1254, -73.1207], // Aproximado (norte, como Antioquia)
    'Zona Centro': [4.6097, -74.0817], // Aproximado (centro, como Cundinamarca)
    // Agrega más regiones o países según necesites
};

export function initMap() {
    if (map) return; // Evita reinicialización
    const mapElement = document.getElementById('map');
    if (!mapElement || mapElement.offsetHeight === 0) {
        console.warn('El contenedor del mapa no está listo. Asegúrate de definir un tamaño en CSS (ej. height: 400px).');
        return;
    }

    map = L.map('map').setView([4.5709, -74.2973], 3); // Zoom más amplio para abarcar más países

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    console.log('Mapa inicializado correctamente en initMap.');
    loadVariedadesOnMap(); // Cargar marcadores después de inicializar
}

async function loadVariedadesOnMap() {
    if (!map) {
        console.error('El mapa no está inicializado. Asegúrate de que initMap() se haya ejecutado primero.');
        return;
    }

    console.log('Iniciando carga de variedades en el mapa...');
    try {
        const response = await fetchVariedades(); // Usar la función importada
        console.log('Datos recibidos de fetchVariedades:', response);

        if (response.success && response.data && Array.isArray(response.data.data)) {
            const markerPositions = new Map(); // Para rastrear posiciones y evitar superposiciones exactas
            response.data.data.forEach(variedad => {
                let origin = variedad.pais_lanzamiento || 'Colombia'; // Fallback a Colombia si no hay origen
                if (variedad.nombre_comun && variedad.nombre_comun.includes('Zona Norte')) origin = 'Zona Norte';
                else if (variedad.nombre_comun && variedad.nombre_comun.includes('Zona Centro')) origin = 'Zona Centro';

                const baseCoords = originCoords[origin];
                if (baseCoords) {
                    // Generar un pequeño desplazamiento si ya existe un marcador en esta posición
                    let coords = [...baseCoords];
                    let positionKey = `${coords[0]},${coords[1]}`;
                    let offsetCount = markerPositions.get(positionKey) || 0;

                    if (offsetCount > 0) {
                        // Desplazamiento aleatorio pequeño (en grados)
                        const offset = (Math.random() - 0.5) * 0.02; // ±0.01 grados
                        coords[0] += offset; // Latitud
                        coords[1] += offset; // Longitud
                        positionKey = `${coords[0]},${coords[1]}`;
                    }

                    markerPositions.set(positionKey, (markerPositions.get(positionKey) || 0) + 1);
                    console.log(`Creando marcador para ${variedad.nombre_comun} en ${origin}:`, coords);

                    const marker = L.marker(coords).addTo(map);
                    marker.bindPopup(`
                        <div>
                            <img src="${variedad.imagen || 'https://via.placeholder.com/150'}" alt="${variedad.nombre_comun}" style="max-width: 150px; max-height: 150px;">
                            <h3>${variedad.nombre_comun || 'Sin nombre'}</h3>
                            <p><strong>Origen:</strong> ${origin}</p>
                            <p><strong>Descripción:</strong> ${variedad.descripcion || 'Sin descripción'}</p>
                        </div>
                    `);

                    // Mostrar popup al pasar el mouse
                    marker.on('mouseover', function (e) {
                        this.openPopup();
                    });
                    marker.on('mouseout', function (e) {
                        this.closePopup();
                    });
                } else {
                    console.warn(`No se encontraron coordenadas para ${origin} de ${variedad.nombre_comun}`);
                }
            });
            // Ajustar el mapa para incluir todos los marcadores
            const bounds = L.latLngBounds(Object.values(originCoords).filter(coord => coord));
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
                console.log('Mapa ajustado a los límites de los marcadores.');
            } else {
                console.warn('No se pudieron ajustar los límites del mapa; verifica las coordenadas.');
            }
        } else {
            console.error('Error al cargar variedades para el mapa:', response.message || 'El formato de datos no contiene un array válido en response.data.data');
        }
    } catch (error) {
        console.error('Error en la solicitud de variedades:', error.message);
    }
}

// Exporta loadVariedadesOnMap si necesitas llamarla manualmente
export { loadVariedadesOnMap };