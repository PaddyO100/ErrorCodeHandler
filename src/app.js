import * as THREE from 'three';
import { translations } from './translations.js';

// Three.js setup
const container = document.getElementById('three-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x00aaff, 1.5, 200);
pointLight.position.set(0, 0, 25);
scene.add(pointLight);

// Main Object
const geometry = new THREE.TorusKnotGeometry(8, 1.5, 150, 20);
const material = new THREE.MeshStandardMaterial({
    color: 0x2d6a4f,
    metalness: 0.7,
    roughness: 0.4,
    wireframe: false
});
const torusKnot = new THREE.Mesh(geometry, material);
scene.add(torusKnot);

// Particle system
const particlesGeometry = new THREE.BufferGeometry();
const particlesCnt = 5000;
const posArray = new Float32Array(particlesCnt * 3);
for (let i = 0; i < particlesCnt * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * (Math.random() * 50);
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.02,
    color: 0x40916c
});
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);


camera.position.z = 25;

// Mouse interaction
let mouseX = 0;
let mouseY = 0;
document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - window.innerWidth / 2) / 100;
    mouseY = (event.clientY - window.innerHeight / 2) / 100;
});

const clock = new THREE.Clock();

function animate() {
    const elapsedTime = clock.getElapsedTime();

    // Update objects
    torusKnot.rotation.y = .5 * elapsedTime;
    particlesMesh.rotation.y = -.1 * elapsedTime;

    // Update camera
    camera.position.x += (mouseX - camera.position.x) * .05;
    camera.position.y += (-mouseY - camera.position.y) * .05;
    camera.lookAt(scene.position);

    // Update light
    pointLight.position.x = Math.sin(elapsedTime * 0.5) * 20;
    pointLight.position.y = Math.cos(elapsedTime * 0.5) * 20;


    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
});

// --- App logic ---

let errorCodes = [];
const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('results-container');
const loadingIndicator = document.getElementById('loading-indicator');

function translate(text) {
    if (typeof text !== 'string') return text;
    const trimmedText = text.trim();
    return translations[trimmedText] || trimmedText;
}

function displayResults(results) {
    resultsContainer.innerHTML = '';
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="text-gray-400">Keine Ergebnisse gefunden.</p>';
        return;
    }

    results.forEach((code, index) => {
        const resultElement = document.createElement('div');
        resultElement.className = 'bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg transition-transform transform hover:scale-105';
        resultElement.style.animationDelay = `${index * 50}ms`;
        resultElement.classList.add('fade-in');

        const hmiMessage = translate(code['HMI Message']);
        const cause = translate(code.Cause);
        const action = translate(code.Action);

        resultElement.innerHTML = `
            <h2 class="text-xl font-bold mb-2 text-green-400">${code.Code}: ${hmiMessage}</h2>
            <p class="text-gray-300 mb-2"><strong>Ursache:</strong> ${cause}</p>
            <p class="text-gray-300 mb-2"><strong>Aktion:</strong> ${action}</p>
            <p class="text-gray-500 text-sm mt-4"><strong>Plattformen:</strong> ${code.Platforms}</p>
        `;
        resultsContainer.appendChild(resultElement);
    });
}

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredCodes = errorCodes.filter(code => {
        const searchableValues = [
            code.Code,
            code['HMI Message'],
            translate(code['HMI Message']),
            code.Cause,
            translate(code.Cause),
            code.Action,
            translate(code.Action),
            code.Platforms
        ];
        return searchableValues.some(value =>
            String(value).toLowerCase().includes(searchTerm)
        );
    });
    displayResults(filteredCodes);
});

async function loadErrorCodes() {
    loadingIndicator.style.display = 'block';
    resultsContainer.style.display = 'none';
    try {
        const response = await fetch('error_codes.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();
        const rows = data.trim().split('\n');
        const headers = rows[0].split(';').map(header => header.trim());

        errorCodes = rows.slice(1).map(row => {
            const parts = row.split(';');
            if (parts.length < 5) return null;

            const code = parts[0].trim();
            const hmiMessage = parts[1].trim();
            const platforms = parts[parts.length - 1].trim();
            const cause = parts[2].trim();
            const action = parts.slice(3, parts.length - 1).join(';').trim();

            return {
                [headers[0]]: code,
                [headers[1]]: hmiMessage,
                [headers[2]]: cause,
                [headers[3]]: action,
                [headers[4]]: platforms,
            };
        }).filter(row => row && row.Code);

        displayResults(errorCodes);
    } catch (error) {
        console.error('Error loading error codes:', error);
        resultsContainer.innerHTML = `<p class="text-red-500 text-center">${translate('Fehler beim Laden der Daten.')}</p>`;
    } finally {
        loadingIndicator.style.display = 'none';
        resultsContainer.style.display = 'grid';
    }
}

loadErrorCodes();
