// API Base URL
const API_BASE = "http://localhost:3000/api";

// Global variables
let monasteries = [];
let events = [];
let map = null;
let markers = [];
let currentRegionFilter = "all";

// Initialize app on page load
document.addEventListener("DOMContentLoaded", async () => {
  await loadMonasteries();
  await loadEvents();
  await loadStats();
  initializeMap();
  setupEventListeners();
  renderMonasteries();
  renderEvents();
  renderVirtualTours();
  setup3DViewer(); // <-- ADD THIS LINE
});

// Setup event listeners
function setupEventListeners() {
  // Mobile menu toggle
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");

  navToggle?.addEventListener("click", () => {
    navMenu.classList.toggle("active");
  });

  // Search input
  const searchInput = document.getElementById("searchInput");
  searchInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchMonasteries();
    }
  });

  // Smooth scrolling for navigation links
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").substring(1);
      scrollToSection(targetId);

      // Update active nav link
      document
        .querySelectorAll(".nav-link")
        .forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
    });
  });
}

// Load monasteries from API
async function loadMonasteries() {
  try {
    const response = await fetch(`${API_BASE}/monasteries`);
    monasteries = await response.json();
  } catch (error) {
    console.error("Error loading monasteries:", error);
    monasteries = [];
  }
}

// Load events from API
async function loadEvents() {
  try {
    const response = await fetch(`${API_BASE}/events`);
    events = await response.json();
  } catch (error) {
    console.error("Error loading events:", error);
    events = [];
  }
}

// Load statistics
async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/stats`);
    const stats = await response.json();

    // Update stats display with animation
    animateNumber("totalMonasteries", stats.totalMonasteries || 6);
    animateNumber("upcomingEvents", stats.upcomingEvents || 8);
    animateNumber("virtualTours", stats.totalMonasteries || 6);
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

// Animate numbers
function animateNumber(elementId, targetNumber) {
  const element = document.getElementById(elementId);
  if (!element) return;

  let current = 0;
  const increment = targetNumber / 50;
  const timer = setInterval(() => {
    current += increment;
    if (current >= targetNumber) {
      current = targetNumber;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current);
  }, 30);
}

// Render monasteries grid
function renderMonasteries(filteredMonasteries = null) {
  const grid = document.getElementById("monasteriesGrid");
  if (!grid) return;

  const dataToRender = filteredMonasteries || monasteries;

  grid.innerHTML = dataToRender
    .map(
      (monastery) => `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="card h-100 shadow-sm" onclick="showMonasteryDetail(${
              monastery.id
            })" style="cursor: pointer; transition: transform 0.3s;">
                <div class="card-img-top position-relative" style="height: 200px; background: linear-gradient(45deg, #ddd, #bbb);">
                    ${
                      monastery.audioGuideAvailable
                        ? '<span class="badge bg-warning position-absolute top-0 end-0 m-2">Audio Guide</span>'
                        : ""
                    }
                    <img src="${
                      monastery.images && monastery.images[0]
                        ? monastery.images[0]
                        : ""
                    }" alt="${
        monastery.name
      }" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title text-primary">${monastery.name}</h5>
                    <p class="card-text text-muted small">
                        <i class="fas fa-map-marker-alt me-1"></i> ${
                          monastery.region
                        } • ${monastery.altitude}
                    </p>
                    <p class="card-text flex-grow-1">
                    ${monastery.description.substring(0, 150)}...
                </p>
                    <div class="mt-auto">
                        <div class="d-flex flex-wrap gap-1">
                            ${
                              monastery.virtualTourUrl
                                ? '<span class="badge bg-info"><i class="fas fa-vr-cardboard me-1"></i> Virtual Tour</span>'
                                : ""
                            }
                            <span class="badge bg-secondary"><i class="fas fa-clock me-1"></i> ${
                              monastery.visitingHours
                            }</span>
                        </div>
                        ${
                          monastery.virtualTourUrl
                            ? `<button class="btn btn-primary mt-3" onclick="launchTour(${monastery.id})">
                                <i class="fas fa-vr-cardboard"></i> Start Virtual Tour
                              </button>`
                            : ""
                        }
                    </div>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

// Render events
function renderEvents(filter = "all") {
  const grid = document.getElementById("eventsGrid");
  if (!grid) return;

  let filteredEvents = [...events];

  if (filter === "upcoming") {
    const today = new Date();
    filteredEvents = events.filter((event) => new Date(event.date) >= today);
  } else if (filter === "festivals") {
    filteredEvents = events.filter(
      (event) => event.type === "Festival" || event.type === "Dance Festival"
    );
  } else if (filter === "rituals") {
    filteredEvents = events.filter(
      (event) =>
        event.type === "Sacred Ritual" || event.type === "Religious Observance"
    );
  }

  // Sort by date
  filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  grid.innerHTML = filteredEvents
    .map(
      (event) => `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="card h-100 shadow-sm border-start border-warning border-4">
                <div class="card-body">
                    <div class="text-primary fw-bold mb-2">
                        <i class="fas fa-calendar me-2"></i> ${formatDate(
                          event.date
                        )}
                    </div>
                    <h5 class="card-title">${event.name}</h5>
                    <p class="card-text text-muted small">
                        <i class="fas fa-map-marker-alt me-1"></i> ${
                          event.monasteryName
                        }
                    </p>
                    <p class="card-text">${event.description}</p>
                    <div class="mt-auto">
                        ${
                          event.registrationRequired
                            ? '<a href="#" class="btn btn-primary btn-sm">Registration Required</a>'
                            : '<span class="badge bg-success">Open to Public</span>'
                        }
                    </div>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

// Render virtual tours
function renderVirtualTours() {
  const grid = document.getElementById("toursGrid");
  if (!grid) return;

  const toursAvailable = monasteries.filter((m) => m.virtualTourUrl);

  grid.innerHTML = toursAvailable
    .map(
      (monastery) => `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="card h-100 shadow-sm">
                <div class="card-img-top d-flex align-items-center justify-content-center text-white" style="height: 200px; background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));">
                    <i class="fas fa-play-circle" style="font-size: 4rem;"></i>
            </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title text-primary">${monastery.name}</h5>
                    <ul class="list-unstyled flex-grow-1">
                        <li class="mb-1"><i class="fas fa-check text-success me-2"></i>360° Panoramic Views</li>
                        <li class="mb-1"><i class="fas fa-check text-success me-2"></i>${
                          monastery.audioGuideAvailable
                            ? "Multi-language Audio Guide"
                            : "Visual Tour"
                        }</li>
                        <li class="mb-1"><i class="fas fa-check text-success me-2"></i>Interactive Hotspots</li>
                        <li class="mb-1"><i class="fas fa-check text-success me-2"></i>Historical Information</li>
                </ul>
                    <div class="mt-auto">
                        <a href="#" class="btn btn-primary w-100" onclick="startVirtualTour(${
                          monastery.id
                        }); return false;">
                            <i class="fas fa-vr-cardboard me-2"></i> Start Tour
                </a>
                    </div>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

// Initialize Leaflet map
function initializeMap() {
  // Create map centered on Sikkim
  map = L.map("leafletMap").setView([27.533, 88.5122], 9);

  // Add tile layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  // Add monastery markers
  monasteries.forEach((monastery) => {
    const marker = L.marker([monastery.latitude, monastery.longitude]).addTo(
      map
    ).bindPopup(`
                <div style="min-width: 200px;">
                    <h4 style="margin: 0 0 10px 0; color: #8B4513;">${monastery.name}</h4>
                    <p style="margin: 5px 0;"><strong>Region:</strong> ${monastery.region}</p>
                    <p style="margin: 5px 0;"><strong>Established:</strong> ${monastery.established}</p>
                    <p style="margin: 5px 0;"><strong>Altitude:</strong> ${monastery.altitude}</p>
                    <button onclick="showMonasteryDetail(${monastery.id})" 
                            style="background: #8B4513; color: white; border: none; 
                                   padding: 5px 15px; border-radius: 15px; cursor: pointer; margin-top: 10px;">
                        View Details
                    </button>
                </div>
            `);
    markers.push(marker);
  });
}

// Filter by region
function filterByRegion(region) {
  currentRegionFilter = region;

  // Update active badge
  document.querySelectorAll(".badge").forEach((badge) => {
    badge.classList.remove("bg-primary");
    badge.classList.add("bg-secondary");
  });
  event.target.classList.remove("bg-secondary");
  event.target.classList.add("bg-primary");

  // Filter monasteries
  if (region === "all") {
    renderMonasteries();
  } else {
    const filtered = monasteries.filter((m) => m.region === region);
    renderMonasteries(filtered);
  }
}

// Search monasteries
async function searchMonasteries() {
  const searchTerm = document.getElementById("searchInput").value;

  if (!searchTerm) {
    renderMonasteries();
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE}/search?q=${encodeURIComponent(searchTerm)}`
    );
    const results = await response.json();
    renderMonasteries(results);

    // Scroll to monasteries section
    scrollToSection("monasteries");
  } catch (error) {
    console.error("Search error:", error);
  }
}

// Filter events
function filterEvents(filter) {
  // Update active button
  document.querySelectorAll(".btn").forEach((btn) => {
    if (
      btn.textContent.includes("Events") ||
      btn.textContent.includes("Upcoming") ||
      btn.textContent.includes("Festivals") ||
      btn.textContent.includes("Rituals")
    ) {
      btn.classList.remove("btn-primary");
      btn.classList.add("btn-outline-primary");
    }
  });
  event.target.classList.remove("btn-outline-primary");
  event.target.classList.add("btn-primary");

  renderEvents(filter);
}

// Show monastery detail modal
function showMonasteryDetail(monasteryId) {
  const monastery = monasteries.find((m) => m.id === monasteryId);
  if (!monastery) return;

  const modal = new bootstrap.Modal(document.getElementById("monasteryModal"));
  const modalTitle = document.getElementById("monasteryModalLabel");
  const modalBody = document.getElementById("modalBody");

  modalTitle.textContent = monastery.name;

  modalBody.innerHTML = `
        <p class="text-muted mb-4">${monastery.localName || ""}</p>
        
        <div class="row mb-4">
            <div class="col-md-6">
                <h6 class="text-primary">Basic Information</h6>
                <p><strong>Established:</strong> ${monastery.established}</p>
                <p><strong>Region:</strong> ${monastery.region}</p>
                <p><strong>Altitude:</strong> ${monastery.altitude}</p>
                <p><strong>Visiting Hours:</strong> ${
                  monastery.visitingHours
                }</p>
                <p><strong>Entry Fee:</strong> ${monastery.entryFee}</p>
            </div>
            <div class="col-md-6">
                <h6 class="text-primary">Contact & Services</h6>
                <p><strong>Accessibility:</strong> ${
                  monastery.accessibility
                }</p>
                <p><strong>Audio Guide:</strong> ${
                  monastery.audioGuideAvailable ? "Available" : "Not Available"
                }</p>
                <p><strong>Contact:</strong></p>
                <p>${monastery.contactInfo.phone}</p>
                <p>${monastery.contactInfo.email}</p>
            </div>
        </div>
        
        <h6 class="text-primary mb-3">About</h6>
        <p class="mb-4">${monastery.description}</p>
        
        <div class="row">
            <div class="col-md-6">
                <h6 class="text-primary mb-3">Highlights</h6>
                <ul class="list-unstyled">
                    ${monastery.highlights
                      .map(
                        (h) =>
                          `<li><i class="fas fa-star text-warning me-2"></i>${h}</li>`
                      )
                      .join("")}
        </ul>
            </div>
            <div class="col-md-6">
                <h6 class="text-primary mb-3">Nearby Attractions</h6>
                <ul class="list-unstyled">
                    ${monastery.nearbyAttractions
                      .map(
                        (a) =>
                          `<li><i class="fas fa-map-marker-alt text-primary me-2"></i>${a}</li>`
                      )
                      .join("")}
        </ul>
            </div>
        </div>
        
        ${
          monastery.virtualTourUrl
            ? `
            <div class="text-center mt-4">
                <button class="btn btn-primary btn-lg" onclick="startVirtualTour(${monastery.id})">
                    <i class="fas fa-vr-cardboard me-2"></i> Start Virtual Tour
            </button>
            </div>
        `
            : ""
        }
    `;

  modal.show();
}

// Close modal (Bootstrap handles this automatically, but keeping for compatibility)
function closeModal() {
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("monasteryModal")
  );
  if (modal) {
    modal.hide();
  }
}

// Start virtual tour
function startVirtualTour(monasteryId) {
  const monastery = monasteries.find((m) => m.id === monasteryId);
  alert(
    `Virtual tour for ${monastery.name} would open here.\n\nIn a full implementation, this would launch an immersive 360° tour experience with:\n- Panoramic views\n- Interactive hotspots\n- Audio narration\n- Historical information`
  );
}

// Reset map view
function resetMap() {
  if (map) {
    map.setView([27.533, 88.5122], 9);
  }
}

// Toggle cluster view (placeholder)
function toggleClusters() {
  alert(
    "Cluster view would toggle monastery grouping on the map for better visualization at different zoom levels."
  );
}

// Smooth scroll to section
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Format date
function formatDate(dateString) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString("en-IN", options);
}

// Bootstrap handles modal closing automatically, so this is no longer needed

// --- 3D MODEL VIEWER ---
function setup3DViewer() {
  const container = document.getElementById("3d-viewer-container");
  if (!container) return;

  // 1. Scene: The virtual world
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0); // A light grey background

  // 2. Camera: Our viewpoint
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  // 3. Renderer: The engine that draws the scene
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // --- ADD THESE LINES ---
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // Makes the movement feel smoother
  controls.dampingFactor = 0.05; // Controls the smoothness of the movement
  controls.enableZoom = true; // Enable zooming with mouse wheel
  controls.enablePan = true; // Enable panning with right mouse button
  controls.autoRotate = false; // Disable auto-rotation so user has full control
  controls.minDistance = 2; // Minimum zoom distance
  controls.maxDistance = 10; // Maximum zoom distance
  // -------------------------

  // 4. Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  // 5. Model Loader
  const loader = new THREE.GLTFLoader();
  let model;
  loader.load(
    "assets/prayer-wheel.glb", // IMPORTANT: Make sure this path is correct!
    function (gltf) {
      model = gltf.scene;
      scene.add(model);
    },
    undefined, // We don't need progress updates
    function (error) {
      console.error("An error happened while loading the model:", error);
    }
  );

  // 6. Animation Loop: Makes the model spin
  function animate() {
    requestAnimationFrame(animate);
    if (model) {
      model.rotation.y += 0.01; // Rotate the model slightly each frame
    }

    // --- ADD THIS LINE ---
    controls.update(); // Updates the controls every frame
    // --------------------

    renderer.render(scene, camera);
  }

  animate();

  // Handle window resizing
  window.addEventListener("resize", () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}

// --- VIRTUAL TOUR FUNCTIONS ---
function launchTour(monasteryId) {
  const monastery = monasteries.find((m) => m.id === monasteryId);
  if (!monastery || !monastery.virtualTourUrl || monastery.virtualTourUrl.startsWith('/')) {
    alert("Virtual tour for this monastery is not available yet.");
    return;
  }

  const tourContainer = document.getElementById("panorama-container");
  tourContainer.style.display = "flex";

  pannellum.viewer("panorama", {
    type: "equirectangular",
    panorama: monastery.virtualTourUrl,
    autoLoad: true,
    showControls: true,
  });
}

function closeTour() {
  const tourContainer = document.getElementById("panorama-container");
  if (tourContainer) tourContainer.style.display = "none";
}
// --- VIRTUAL TOUR FUNCTIONS ---
function launchTour(monasteryId) {
  const monastery = monasteries.find((m) => m.id === monasteryId);
  if (!monastery || !monastery.virtualTourUrl) {
    alert("Virtual tour for this monastery is not available yet.");
    return;
  }

  const tourContainer = document.getElementById("panorama-container");
  if (!tourContainer) {
    console.error("Panorama container not found in DOM.");
    return;
  }
  tourContainer.style.display = "flex";

  pannellum.viewer("panorama", {
    type: "equirectangular",
    panorama: monastery.virtualTourUrl,
    autoLoad: true,
    showControls: true,
  });
}

function closeTour() {
  const tourContainer = document.getElementById("panorama-container");
  if (tourContainer) tourContainer.style.display = "none";
}
