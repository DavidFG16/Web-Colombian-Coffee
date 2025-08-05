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

// Custom marker icon (optional - replace with your own image)
const customIcon = L.icon({
    iconUrl: 'https://png.pngtree.com/png-clipart/20221231/original/pngtree-coffee-shop-location-pin-with-cup-symbol-in-brown-and-white-png-image_8837371.png',
    iconSize: [40, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
export function initMap() {
    if (map) return; // Evita reinicialización
    const mapElement = document.getElementById('map');
    if (!mapElement || mapElement.offsetHeight === 0) {
        console.warn('El contenedor del mapa no está listo. Asegúrate de definir un tamaño en CSS (ej. height: 400px).');
        return;
    }

    // Inicializar el mapa con una vista inicial
    map = L.map('map', {
        center: [4.5709, -74.2973],
        zoom: 3,
        zoomControl: true,
        fullscreenControl: true
    });

    // Añadir capa de tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Añadir barra de escala
    L.control.scale({ imperial: false }).addTo(map);

    // Añadir leyenda
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'legend');
        div.innerHTML = `
            <div class="legend-content p-2 bg-white rounded shadow-lg">
                <h4 class="text-lg font-bold mb-2">Leyenda</h4>
                <p><span style="display:inline-block; width: 10px; height: 10px; background-color: #4a1904; margin-right: 5px;"></span> Marcador de variedad</p>
                <p>Orígenes representados: Colombia, Etiopía, Brasil, Zona Norte, Zona Centro</p>
                <p>Nota: Los marcadores indican el lugar de lanzamiento de cada variedad de café.</p>
            </div>
        `;
        return div;
    };
    legend.addTo(map);

    // Añadir información importante
    const info = L.control({ position: 'topright' });
    info.onAdd = function () {
        const div = L.DomUtil.create('div', 'info');
        div.innerHTML = `
            <div class="info-content p-2 bg-blue-100 rounded shadow-lg text-sm">
                <p><strong>Explora las variedades de café</strong></p>
                <p>Descubre los orígenes y características de más de 10 variedades únicas.</p>
            </div>
        `;
        return div;
    };
    info.addTo(map);

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
            const markersLayer = L.layerGroup().addTo(map); // Agrupar marcadores

            response.data.data.forEach(variedad => {
                let origin = variedad.pais_lanzamiento || 'Colombia'; // Fallback a Colombia
                if (variedad.nombre_comun && variedad.nombre_comun.includes('Zona Norte')) origin = 'Zona Norte';
                else if (variedad.nombre_comun && variedad.nombre_comun.includes('Zona Centro')) origin = 'Zona Centro';

                const baseCoords = originCoords[origin];
                if (baseCoords) {
                    let coords = [...baseCoords];
                    let positionKey = `${coords[0]},${coords[1]}`;
                    let offsetCount = markerPositions.get(positionKey) || 0;

                    if (offsetCount > 0) {
                        const offset = (Math.random() - 0.5) * 0.02; // ±0.01 grados
                        coords[0] += offset;
                        coords[1] += offset;
                        positionKey = `${coords[0]},${coords[1]}`;
                    }

                    markerPositions.set(positionKey, (markerPositions.get(positionKey) || 0) + 1);
                    console.log(`Creando marcador para ${variedad.nombre_comun} en ${origin}:`, coords);

                    const marker = L.marker(coords, { icon: customIcon }).addTo(markersLayer);
                    marker.bindPopup(`
                        <div class="p-2">
                            <img src="${variedad.imagen || 'https://via.placeholder.com/150'}" alt="${variedad.nombre_comun}" style="max-width: 150px; max-height: 150px; border-radius: 5px;">
                            <h3 class="text-lg font-bold mt-2">${variedad.nombre_comun || 'Sin nombre'}</h3>
                            <p class="mt-1"><strong>Origen:</strong> ${origin}</p>
                            <p class="mt-1"><strong>Descripción:</strong> ${variedad.descripcion || 'Sin descripción'}</p>
                        </div>
                    `, { className: 'custom-popup' });

                    marker.on('mouseover', function (e) {
                        this.openPopup();
                    });
                    marker.on('mouseout', function (e) {
                        this.closePopup();
                    });

                    marker.on('click', function (e) {
                        map.setView(coords, 6, { animate: true, duration: 0.5 });
                        this.openPopup();
                    });
                } else {
                    console.warn(`No se encontraron coordenadas para ${origin} de ${variedad.nombre_comun}`);
                }
            });

            const bounds = L.latLngBounds(Object.values(originCoords).filter(coord => coord));
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 0.5 });
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