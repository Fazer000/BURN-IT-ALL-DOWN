const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0xffffff, 0);

const container = document.getElementById('model-container');
container.appendChild(renderer.domElement);

const canvasWidth = 400;
const canvasHeight = 400;
renderer.setSize(canvasWidth, canvasHeight);
camera.aspect = canvasWidth / canvasHeight;
camera.updateProjectionMatrix();

// Освещение
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

const loader = new THREE.GLTFLoader();
let planet;
let spheres;

loader.load('untitled.glb', (gltf) => {
    planet = gltf.scene;
    scene.add(planet);
    planet.position.set(0, 0, 0);

    spheres = createSpheres();

    container.addEventListener('click', (event) => handleClick(event, spheres));
    container.addEventListener('mousemove', (event) => checkMouseOver(event, spheres));
    setupDragEvents();

}, undefined, (error) => {
    console.error(error);
});

camera.position.z = 5;

let scaleSpeed = 0.1; // Скорость изменения масштаба

let targetRotation = { x: 0, y: 0 };
let currentRotation = { x: 0, y: 0 };
const rotationSpeed = 0.1;

function createSpheres() {
    const spherePositions = [
        { position: [-0.2, 1.04, 0.54], message: "Сфера 1 нажата!" },
        { position: [0.48, 1.02, -0.44], message: "Сфера 2 нажата!" },
        { position: [-0.35, 0.74, -0.87], message: "Сфера 3 нажата!" }
    ];

    return spherePositions.map(({ position, message }) => {
        const buttonGeometry = new THREE.SphereGeometry(0.05);
        const buttonMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
        button.position.set(...position);
        planet.add(button);
        button.callback = () => alert(message);

        const torusGeometry = new THREE.TorusGeometry(0.1, 0.02, 16, 100);
        const torusMaterial = new THREE.MeshBasicMaterial({ color: 0xFF7E3E, side: THREE.DoubleSide });
        const torus = new THREE.Mesh(torusGeometry, torusMaterial);
        torus.scale.set(1, 1, 1);
        torus.targetScale = 1;
        button.add(torus);

        return button;
    });
}

function handleClick(event, spheres) {
    const mouse = getMousePosition(event);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(spheres);
    if (intersects.length > 0) {
        intersects[0].object.callback();
    }
}

function checkMouseOver(event, spheres) {
    const mouse = getMousePosition(event);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(spheres);

    spheres.forEach(sphere => {
        const torus = sphere.children[0];
        torus.targetScale = 1;
    });

    if (intersects.length > 0) {
        const intersectedSphere = intersects[0].object;
        const torus = intersectedSphere.children[0];
        torus.position.set(0, 0, 0);
        torus.targetScale = 1.5;
    }
}

function getMousePosition(event) {
    const rect = container.getBoundingClientRect();
    return new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
}

function setupDragEvents() {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    container.addEventListener('mousedown', (event) => {
        isDragging = true;
        previousMousePosition = { x: event.clientX, y: event.clientY };
    });

    container.addEventListener('mousemove', (event) => {
        if (isDragging) {
            const deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y
            };

            targetRotation.y += deltaMove.x * 0.01;
            targetRotation.x += deltaMove.y * 0.01;

            previousMousePosition = { x: event.clientX, y: event.clientY };
        }
    });

    container.addEventListener('mouseup', () => {
        isDragging = false;
    });

    container.addEventListener('mouseleave', () => {
        isDragging = false;
    });
}

// Анимация
function animate() {
    requestAnimationFrame(animate);

    spheres.forEach(sphere => {
        const torus = sphere.children[0];
        torus.scale.x += (torus.targetScale - torus.scale.x) * scaleSpeed;
        torus.scale.y += (torus.targetScale - torus.scale.y) * scaleSpeed;
        torus.scale.z += (torus.targetScale - torus.scale.z) * scaleSpeed;

        torus.lookAt(camera.position);
    });

    currentRotation.x += (targetRotation.x - currentRotation.x) * rotationSpeed;
    currentRotation.y += (targetRotation.y - currentRotation.y) * rotationSpeed;

    planet.rotation.x = currentRotation.x;
    planet.rotation.y = currentRotation.y;

    renderer.render(scene, camera);
}

animate();
