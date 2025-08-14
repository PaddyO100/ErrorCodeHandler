import * as THREE from 'three';

// --- Three.js setup ---
const container = document.getElementById('three-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0x00aaff, 1.5, 200);
pointLight.position.set(0, 0, 25);
scene.add(pointLight);

const geometry = new THREE.TorusKnotGeometry(8, 1.5, 150, 20);
const material = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, metalness: 0.7, roughness: 0.4 });
const torusKnot = new THREE.Mesh(geometry, material);
scene.add(torusKnot);

const particlesGeometry = new THREE.BufferGeometry();
const particlesCnt = 5000;
const posArray = new Float32Array(particlesCnt * 3);
for (let i = 0; i < particlesCnt * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * (Math.random() * 50);
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({ size: 0.02, color: 0x40916c });
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

camera.position.z = 25;

let mouseX = 0;
let mouseY = 0;
document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - window.innerWidth / 2) / 100;
    mouseY = (event.clientY - window.innerHeight / 2) / 100;
});

const clock = new THREE.Clock();
function animate() {
    const elapsedTime = clock.getElapsedTime();
    torusKnot.rotation.y = .5 * elapsedTime;
    particlesMesh.rotation.y = -.1 * elapsedTime;
    camera.position.x += (mouseX - camera.position.x) * .05;
    camera.position.y += (-mouseY - camera.position.y) * .05;
    camera.lookAt(scene.position);
    pointLight.position.x = Math.sin(elapsedTime * 0.5) * 20;
    pointLight.position.y = Math.cos(elapsedTime * 0.5) * 20;
    renderer.render(scene, camera);
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
let allErrors = [];
let uniquePlatforms = new Set();

const searchInput = document.getElementById('search-input');
const platformFilter = document.getElementById('platform-filter');
const resultsContainer = document.getElementById('results-container');
const loadingIndicator = document.getElementById('loading-indicator');

function populatePlatformFilter() {
    allErrors.forEach(error => {
        const platforms = error.Platforms.split(',').map(p => p.trim());
        platforms.forEach(p => {
            if(p) uniquePlatforms.add(p)
        });
    });

    uniquePlatforms.forEach(platform => {
        const option = document.createElement('option');
        option.value = platform;
        option.textContent = platform;
        platformFilter.appendChild(option);
    });
}

function displayResults(results) {
    resultsContainer.innerHTML = '';
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="text-gray-400 col-span-full text-center">Keine Ergebnisse gefunden.</p>';
        return;
    }

    results.forEach((code, index) => {
        const resultElement = document.createElement('div');
        resultElement.className = 'bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg transition-transform transform hover:scale-105';
        resultElement.style.animationDelay = `${index * 50}ms`;
        resultElement.classList.add('fade-in');

        resultElement.innerHTML = `
            <h2 class="text-xl font-bold mb-2 text-green-400">${code.Code}: ${code['HMI Message']}</h2>
            <p class="text-gray-300 mb-2"><strong>Ursache:</strong> ${code.Cause}</p>
            <p class="text-gray-300 mb-2"><strong>Aktion:</strong> ${code.Action}</p>
            <p class="text-gray-500 text-sm mt-4"><strong>Plattformen:</strong> ${code.Platforms}</p>
        `;
        resultsContainer.appendChild(resultElement);
    });
}

function filterAndDisplay() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedPlatform = platformFilter.value;

    let filteredErrors = allErrors;

    if (selectedPlatform) {
        filteredErrors = filteredErrors.filter(error => error.Platforms.includes(selectedPlatform));
    }

    if (searchTerm) {
        filteredErrors = filteredErrors.filter(error => {
            return Object.values(error).some(value =>
                String(value).toLowerCase().includes(searchTerm)
            );
        });
    }

    displayResults(filteredErrors);
}

searchInput.addEventListener('input', filterAndDisplay);
platformFilter.addEventListener('change', filterAndDisplay);

async function loadErrorCodes() {
    loadingIndicator.style.display = 'block';
    resultsContainer.style.display = 'none';
    try {
        const response = await fetch('/api/errors');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allErrors = await response.json();

        populatePlatformFilter();
        filterAndDisplay();

    } catch (error) {
        console.error('Error loading error codes:', error);
        resultsContainer.innerHTML = `<p class="text-red-500 text-center">Fehler beim Laden der Daten.</p>`;
    } finally {
        loadingIndicator.style.display = 'none';
        resultsContainer.style.display = 'grid';
    }
}

loadErrorCodes();
