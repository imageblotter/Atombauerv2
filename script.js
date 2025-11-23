console.log("Script initializing...");

window.onload = () => {
    const p = document.getElementById('proton-source');
    const ps = document.querySelector('.particle-sources');
    const ac = document.querySelector('.app-container');

    console.log("Proton pointer-events:", window.getComputedStyle(p).pointerEvents);
    console.log("Source container pointer-events:", window.getComputedStyle(ps).pointerEvents);
    console.log("App container pointer-events:", window.getComputedStyle(ac).pointerEvents);
};


document.addEventListener('click', (e) => {
    console.log("Global click target:", e.target);
    console.log("Target ID:", e.target.id);
    console.log("Target Class:", e.target.className);
    console.log("Target Tag:", e.target.tagName);
    console.log("Target OuterHTML:", e.target.outerHTML.substring(0, 100));
});


const elements = [
    { atomicNumber: 1, symbol: 'H', name: 'Wasserstoff', mass: 1 },
    { atomicNumber: 2, symbol: 'He', name: 'Helium', mass: 4 },
    { atomicNumber: 3, symbol: 'Li', name: 'Lithium', mass: 7 },
    { atomicNumber: 4, symbol: 'Be', name: 'Beryllium', mass: 9 },
    { atomicNumber: 5, symbol: 'B', name: 'Bor', mass: 11 },
    { atomicNumber: 6, symbol: 'C', name: 'Kohlenstoff', mass: 12 },
    { atomicNumber: 7, symbol: 'N', name: 'Stickstoff', mass: 14 },
    { atomicNumber: 8, symbol: 'O', name: 'Sauerstoff', mass: 16 },
    { atomicNumber: 9, symbol: 'F', name: 'Fluor', mass: 19 },
    { atomicNumber: 10, symbol: 'Ne', name: 'Neon', mass: 20 },
    { atomicNumber: 11, symbol: 'Na', name: 'Natrium', mass: 23 },
    { atomicNumber: 12, symbol: 'Mg', name: 'Magnesium', mass: 24 },
    { atomicNumber: 13, symbol: 'Al', name: 'Aluminium', mass: 27 },
    { atomicNumber: 14, symbol: 'Si', name: 'Silicium', mass: 28 },
    { atomicNumber: 15, symbol: 'P', name: 'Phosphor', mass: 31 },
    { atomicNumber: 16, symbol: 'S', name: 'Schwefel', mass: 32 },
    { atomicNumber: 17, symbol: 'Cl', name: 'Chlor', mass: 35 },
    { atomicNumber: 18, symbol: 'Ar', name: 'Argon', mass: 40 },
    { atomicNumber: 19, symbol: 'K', name: 'Kalium', mass: 39 },
    { atomicNumber: 20, symbol: 'Ca', name: 'Calcium', mass: 40 }
];

let currentElement = null;
let particles = {
    protons: 0,
    neutrons: 0,
    electrons: 0
};

// DOM Elements
const protonSource = document.getElementById('proton-source');
const neutronSource = document.getElementById('neutron-source');
const electronSource = document.getElementById('electron-source');
const nucleusDropZone = document.getElementById('nucleus-drop-zone');
const atomDropZone = document.getElementById('atom-drop-zone');
const checkBtn = document.getElementById('check-btn');
const resetBtn = document.getElementById('reset-btn');
const feedbackMsg = document.getElementById('feedback-message');

// Counts
const protonCountDisplay = document.getElementById('proton-count');
const neutronCountDisplay = document.getElementById('neutron-count');
const electronCountDisplay = document.getElementById('electron-count');

// Target Info
const targetMass = document.getElementById('target-mass');
const targetSymbol = document.getElementById('target-symbol');
const targetAtomic = document.getElementById('target-atomic');
const targetName = document.getElementById('target-name');

// Physics constants
const CENTER_X = 60;
const CENTER_Y = 60;
const NUCLEUS_RADIUS = 60;
const PARTICLE_RADIUS = 7.5; // 15px / 2
const ATTRACTION_STRENGTH = 0.05;
const REPULSION_STRENGTH = 2.0;
const REPULSION_DISTANCE = 16; // Slightly more than diameter
const MAX_SPEED = 0.5;
const DAMPING = 0.95;

let animationFrameId = null;

function initGame() {
    console.log("Initializing game");
    // Pick random element
    const randomIndex = Math.floor(Math.random() * elements.length);
    currentElement = elements[randomIndex];

    // Update UI
    targetMass.textContent = currentElement.mass;
    targetSymbol.textContent = currentElement.symbol;
    targetAtomic.textContent = currentElement.atomicNumber;
    targetName.textContent = currentElement.name;

    // Reset particles
    particles = { protons: 0, neutrons: 0, electrons: 0 };
    updateCounts();

    // Clear board
    nucleusDropZone.innerHTML = '';
    const existingElectrons = document.querySelectorAll('.atom-container > .electron');
    existingElectrons.forEach(el => el.remove());

    feedbackMsg.classList.add('hidden');
    feedbackMsg.className = 'feedback hidden';

    startNucleusAnimation();
}

function updateCounts() {
    protonCountDisplay.textContent = particles.protons;
    neutronCountDisplay.textContent = particles.neutrons;
    electronCountDisplay.textContent = particles.electrons;
}

// Drag and Drop Logic
let draggedType = null;

console.log("Proton source:", protonSource);
console.log("Neutron source:", neutronSource);
console.log("Electron source:", electronSource);

[protonSource, neutronSource, electronSource].forEach(source => {
    if (!source) return;

    // Drag Start
    source.addEventListener('dragstart', (e) => {
        console.log("Drag start", e.target);
        draggedType = e.target.classList.contains('proton') ? 'proton' :
            e.target.classList.contains('neutron') ? 'neutron' : 'electron';
        console.log("Dragged type:", draggedType);
        if (e.dataTransfer) {
            e.dataTransfer.setData('text/plain', draggedType);
            e.dataTransfer.effectAllowed = 'copy';
        }
    });

    // Click to Add (Fallback & Accessibility)
    source.addEventListener('click', (e) => {
        console.log("Source clicked", e.currentTarget);
        const target = e.currentTarget;
        const type = target.classList.contains('proton') ? 'proton' :
            target.classList.contains('neutron') ? 'neutron' : 'electron';

        if (type === 'proton' || type === 'neutron') {
            addParticle(type, 'nucleus');
        } else {
            // Random position in shells
            const rect = atomDropZone.getBoundingClientRect();
            const angle = Math.random() * Math.PI * 2;
            const minR = rect.width * 0.15;
            const maxR = rect.width * 0.4;
            const r = minR + Math.random() * (maxR - minR);

            const x = (rect.width / 2) + r * Math.cos(angle);
            const y = (rect.height / 2) + r * Math.sin(angle);

            addParticle(type, 'shell', x, y);
        }
    });
});

// Helper to handle dragover
function handleDragOver(e) {
    e.preventDefault();
    if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
    }
}

// Add listeners to both main container and nucleus
atomDropZone.addEventListener('dragover', handleDragOver);
nucleusDropZone.addEventListener('dragover', handleDragOver);

atomDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    console.log("Drop event on atomDropZone");
    let type = e.dataTransfer ? e.dataTransfer.getData('text/plain') : null;
    if (!type) type = draggedType;
    console.log("Drop type:", type);
    if (!type) return;

    const rect = atomDropZone.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const isNucleusDrop = e.target.closest('.nucleus') || e.target === nucleusDropZone;
    console.log("Is nucleus drop:", isNucleusDrop);

    if (isNucleusDrop && (type === 'proton' || type === 'neutron')) {
        addParticle(type, 'nucleus');
    } else if (type === 'electron') {
        // Calculate nearest shell
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Shell radii factors (matching CSS sizes: 30%, 50%, 70%, 90%)
        // Radii are half of width: 15%, 25%, 35%, 45%
        const shellRadii = [0.15, 0.25, 0.35, 0.45].map(f => rect.width * f);

        // Find closest shell
        let closestR = shellRadii[0];
        let minDiff = Math.abs(dist - closestR);

        shellRadii.forEach(r => {
            const diff = Math.abs(dist - r);
            if (diff < minDiff) {
                minDiff = diff;
                closestR = r;
            }
        });

        // Snap to shell
        const finalX = centerX + closestR * Math.cos(angle);
        const finalY = centerY + closestR * Math.sin(angle);

        addParticle(type, 'shell', finalX, finalY);
    } else {
        if (type === 'proton' || type === 'neutron') {
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            if (dist < 60) {
                addParticle(type, 'nucleus');
            }
        }
    }
    draggedType = null;
});

nucleusDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    let type = e.dataTransfer ? e.dataTransfer.getData('text/plain') : null;
    if (!type) type = draggedType;

    if (type === 'proton' || type === 'neutron') {
        addParticle(type, 'nucleus');
    }
    draggedType = null;
});

function addParticle(type, zone, x, y) {
    console.log("addParticle called:", type, zone);
    const particle = document.createElement('div');
    particle.classList.add('particle', type);

    // Double-click to remove
    particle.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        particle.remove();
        particles[type + 's']--;
        // rearrangeNucleus(); // Handled by animation loop
        // rearrangeElectrons(); // Disabled for manual placement
        updateCounts();
    });

    if (zone === 'nucleus') {
        nucleusDropZone.appendChild(particle);
        particles[type + 's']++;
        // rearrangeNucleus(); // Handled by animation loop
    } else if (zone === 'shell') {
        atomDropZone.appendChild(particle);
        particles.electrons++;

        // Manual placement
        if (x !== undefined && y !== undefined) {
            particle.style.left = `${x - 10}px`; // Center (20x20)
            particle.style.top = `${y - 10}px`;
        } else {
            // Fallback (e.g. from click): Place on random shell
            const rect = atomDropZone.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const shellRadii = [0.15, 0.25, 0.35, 0.45].map(f => rect.width * f);
            const randomShell = shellRadii[Math.floor(Math.random() * shellRadii.length)];
            const angle = Math.random() * Math.PI * 2;

            particle.style.left = `${centerX + randomShell * Math.cos(angle) - 10}px`;
            particle.style.top = `${centerY + randomShell * Math.sin(angle) - 10}px`;
        }
        // rearrangeElectrons(); // Disabled
    }
    updateCounts();
}

function startNucleusAnimation() {
    if (animationFrameId) return; // Already running

    function animate() {
        const particles = Array.from(nucleusDropZone.querySelectorAll('.particle'));

        particles.forEach(p => {
            // Initialize physics state if missing
            if (typeof p.vx === 'undefined') {
                p.vx = (Math.random() - 0.5) * 0.5;
                p.vy = (Math.random() - 0.5) * 0.5;
                // Start near center if new
                if (!p.style.left) {
                    p.x = CENTER_X + (Math.random() - 0.5) * 20;
                    p.y = CENTER_Y + (Math.random() - 0.5) * 20;
                } else {
                    p.x = parseFloat(p.style.left) + PARTICLE_RADIUS;
                    p.y = parseFloat(p.style.top) + PARTICLE_RADIUS;
                }
            }

            // 1. Attraction to center
            const dx = CENTER_X - p.x;
            const dy = CENTER_Y - p.y;
            p.vx += dx * ATTRACTION_STRENGTH * 0.01;
            p.vy += dy * ATTRACTION_STRENGTH * 0.01;

            // 2. Repulsion from other particles
            particles.forEach(other => {
                if (p === other) return;
                // Use current positions for force calc
                const ox = other.x || parseFloat(other.style.left) + PARTICLE_RADIUS || CENTER_X;
                const oy = other.y || parseFloat(other.style.top) + PARTICLE_RADIUS || CENTER_Y;

                const distDx = p.x - ox;
                const distDy = p.y - oy;
                const dist = Math.sqrt(distDx * distDx + distDy * distDy);

                if (dist < REPULSION_DISTANCE && dist > 0) {
                    const force = (REPULSION_DISTANCE - dist) * REPULSION_STRENGTH;
                    p.vx += (distDx / dist) * force * 0.05;
                    p.vy += (distDy / dist) * force * 0.05;
                }
            });

            // 3. Random Jitter (Brownian motion)
            p.vx += (Math.random() - 0.5) * 0.2;
            p.vy += (Math.random() - 0.5) * 0.2;

            // 4. Damping (Friction)
            p.vx *= DAMPING;
            p.vy *= DAMPING;

            // Limit speed
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (speed > MAX_SPEED) {
                p.vx = (p.vx / speed) * MAX_SPEED;
                p.vy = (p.vy / speed) * MAX_SPEED;
            }

            // Update position
            p.x += p.vx;
            p.y += p.vy;

            // 5. Boundary Constraint (Soft bounce)
            const distFromCenter = Math.sqrt(Math.pow(p.x - CENTER_X, 2) + Math.pow(p.y - CENTER_Y, 2));
            if (distFromCenter > NUCLEUS_RADIUS - PARTICLE_RADIUS) {
                const angle = Math.atan2(p.y - CENTER_Y, p.x - CENTER_X);
                p.x = CENTER_X + Math.cos(angle) * (NUCLEUS_RADIUS - PARTICLE_RADIUS);
                p.y = CENTER_Y + Math.sin(angle) * (NUCLEUS_RADIUS - PARTICLE_RADIUS);
                p.vx *= -0.5; // Bounce back
                p.vy *= -0.5;
            }

            // Apply to DOM
            p.style.left = `${p.x - PARTICLE_RADIUS}px`;
            p.style.top = `${p.y - PARTICLE_RADIUS}px`;
        });

        animationFrameId = requestAnimationFrame(animate);
    }
    animate();
}

// Check Answer
checkBtn.addEventListener('click', () => {
    const targetProtons = currentElement.atomicNumber;
    const targetNeutrons = currentElement.mass - currentElement.atomicNumber;
    const targetElectrons = currentElement.atomicNumber;

    // 1. Check Counts
    const countsCorrect =
        particles.protons === targetProtons &&
        particles.neutrons === targetNeutrons &&
        particles.electrons === targetElectrons;

    if (!countsCorrect) {
        feedbackMsg.classList.remove('hidden');
        let msg = '<span class="feedback-icon">❌</span> Falsch. ';
        if (particles.protons !== targetProtons) msg += `Protonen: ${particles.protons}/${targetProtons}. `;
        if (particles.neutrons !== targetNeutrons) msg += `Neutronen: ${particles.neutrons}/${targetNeutrons}. `;
        if (particles.electrons !== targetElectrons) msg += `Elektronen: ${particles.electrons}/${targetElectrons}. `;
        feedbackMsg.innerHTML = msg;
        feedbackMsg.className = 'feedback error';
        return;
    }

    // 2. Check Shell Configuration
    const electrons = Array.from(atomDropZone.querySelectorAll('.electron'));
    const rect = atomDropZone.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const shellRadii = [0.15, 0.25, 0.35, 0.45].map(f => rect.width * f);

    // Count electrons per shell
    const shellCounts = [0, 0, 0, 0];

    electrons.forEach(el => {
        const ex = parseFloat(el.style.left) + 10; // Center of electron
        const ey = parseFloat(el.style.top) + 10;
        const dist = Math.sqrt(Math.pow(ex - centerX, 2) + Math.pow(ey - centerY, 2));

        // Find closest shell index
        let closestIndex = 0;
        let minDiff = Math.abs(dist - shellRadii[0]);

        shellRadii.forEach((r, i) => {
            const diff = Math.abs(dist - r);
            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = i;
            }
        });
        shellCounts[closestIndex]++;
    });

    // Calculate Expected Configuration (2, 8, 8, 18)
    const capacities = [2, 8, 8, 18];
    const expectedCounts = [0, 0, 0, 0];
    let remaining = targetElectrons;

    for (let i = 0; i < capacities.length; i++) {
        const fill = Math.min(remaining, capacities[i]);
        expectedCounts[i] = fill;
        remaining -= fill;
    }

    // Compare
    let shellError = null;
    for (let i = 0; i < 4; i++) {
        if (shellCounts[i] !== expectedCounts[i]) {
            shellError = `Schale ${i + 1} ist falsch. Gefunden: ${shellCounts[i]}, Erwartet: ${expectedCounts[i]}.`;
            break;
        }
    }

    feedbackMsg.classList.remove('hidden');
    if (!shellError) {
        feedbackMsg.innerHTML = '<span class="feedback-icon">✅</span> Richtig! Gut gemacht.';
        feedbackMsg.className = 'feedback success';
    } else {
        feedbackMsg.innerHTML = `<span class="feedback-icon">❌</span> ${shellError} Denke daran, die inneren Schalen zuerst zu füllen!`;
        feedbackMsg.className = 'feedback error';
        updateCounts();
    }
});

// Fullscreen functionality
const fullscreenBtn = document.getElementById('fullscreen-btn');

function toggleFullscreen() {
    const doc = window.document;
    const docEl = doc.documentElement;

    // Check for existing fullscreen element
    const fullscreenElement = doc.fullscreenElement ||
        doc.mozFullScreenElement ||
        doc.webkitFullscreenElement ||
        doc.msFullscreenElement;

    if (!fullscreenElement) {
        // Try to enter fullscreen
        if (docEl.requestFullscreen) {
            docEl.requestFullscreen().catch(err => {
                alert(`Fehler: ${err.message}`);
            });
        } else if (docEl.webkitRequestFullscreen) {
            docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
            docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
            docEl.msRequestFullscreen();
        } else {
            alert("Vollbildmodus wird von diesem Browser nicht unterstützt.");
        }
    } else {
        // Try to exit fullscreen
        if (doc.exitFullscreen) {
            doc.exitFullscreen().catch(err => {
                console.error(err);
            });
        } else if (doc.webkitExitFullscreen) {
            doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
            doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
            doc.msExitFullscreen();
        }
    }
}

fullscreenBtn.addEventListener('click', toggleFullscreen);

const updateFullscreenButton = () => {
    const isFullscreen = document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement;

    if (!isFullscreen) {
        fullscreenBtn.textContent = "Vollbild";
    } else {
        fullscreenBtn.textContent = "Vollbild beenden";
    }
};

document.addEventListener('fullscreenchange', updateFullscreenButton);
document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
document.addEventListener('mozfullscreenchange', updateFullscreenButton);
document.addEventListener('MSFullscreenChange', updateFullscreenButton);

resetBtn.addEventListener('click', initGame);

// Initialize
initGame();

