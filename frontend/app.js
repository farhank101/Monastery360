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
  setup3DViewer(); // restore legacy viewer
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
            <div class="card h-100 shadow-sm" style="cursor: pointer;" onclick="showMonasteryDetail(${
              monastery.id
            })">
                <img src="${monastery.images[0]}" class="card-img-top" alt="${
        monastery.name
      }" style="height: 200px; object-fit: cover;">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title text-primary">${monastery.name}</h5>
                    <p class="card-text text-muted small mb-2">
                        <i class="fas fa-map-marker-alt me-1"></i> ${
                          monastery.region
                        }
                    </p>
                    <p class="card-text flex-grow-1">${monastery.description.substring(
                      0,
                      100
                    )}...</p>
                    <div class="mt-auto">
                        <div class="d-flex flex-wrap gap-2">
                            ${
                              monastery.virtualTourUrl
                                ? `<span class="badge bg-info"><i class="fas fa-vr-cardboard me-1"></i> Virtual Tour</span>`
                                : ""
                            }
                            ${
                              monastery.audioGuideAvailable
                                ? `<span class="badge bg-warning text-dark"><i class="fas fa-headphones me-1"></i> Audio Guide</span>`
                                : ""
                            }
                        </div>
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
                        <a href="#" class="btn btn-primary w-100" onclick="launchTour(${
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
                          `<li><i class=\"fas fa-star text-warning me-2\"></i>${h}</li>`
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
                          `<li><i class=\"fas fa-map-marker-alt text-primary me-2\"></i>${a}</li>`
                      )
                      .join("")}
        </ul>
            </div>
        </div>
        
        ${
          monastery.virtualTourUrl
            ? `
            <div class="text-center mt-4">
                <button class="btn btn-primary btn-lg" onclick="launchTour(${monastery.id})">
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

// --- 3D MODEL VIEWER --- (restored)
function setup3DViewer() {
  const container = document.getElementById("3d-viewer-container");
  if (!container) return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = true;
  controls.enablePan = true;
  controls.autoRotate = false;
  controls.minDistance = 2;
  controls.maxDistance = 10;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  const loader = new THREE.GLTFLoader();
  let model;
  loader.load(
    "assets/prayer-wheel.glb",
    function (gltf) {
      model = gltf.scene;
      scene.add(model);
    },
    undefined,
    function (error) {
      console.error("An error happened while loading the model:", error);
    }
  );

  function animate() {
    requestAnimationFrame(animate);
    if (model) {
      model.rotation.y += 0.01;
    }
    controls.update();
    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener("resize", () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}

// --- VIRTUAL TOUR FUNCTIONS ---
function launchTour(monasteryId) {
  const monastery = monasteries.find((m) => m.id === monasteryId);
  if (!monastery) {
    alert("Virtual tour for this monastery is not available yet.");
    return;
  }

  const tourContainer = document.getElementById("panorama-container");
  const panoDiv = document.getElementById("panorama");
  if (!tourContainer || !panoDiv) {
    console.error("Panorama container not found in DOM.");
    return;
  }

  // Clear any previous viewer content
  panoDiv.innerHTML = "";

  // If the URL is a Google Maps embed link, render it in an iframe inside the modal
  if (
    monastery.virtualTourUrl &&
    monastery.virtualTourUrl.includes("/maps/embed?")
  ) {
    tourContainer.style.display = "flex";
    panoDiv.innerHTML = `
      <iframe src="${monastery.virtualTourUrl}" width="100%" height="100%" style="border:0;" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    `;
    return;
  }

  // If the URL is a Google Maps link, launch Street View panorama
  if (
    monastery.virtualTourUrl &&
    monastery.virtualTourUrl.includes("google.com/maps") &&
    window.google &&
    google.maps
  ) {
    tourContainer.style.display = "flex";
    // Try to parse heading (h) and tilt (t) from the URL if present
    const url = monastery.virtualTourUrl;
    const headingMatch = url.match(/([0-9.]+)h/);
    const tiltMatch = url.match(/([0-9.]+)t/);
    const heading = headingMatch ? parseFloat(headingMatch[1]) : 0;
    // Approximate pitch from tilt value if available (simple mapping)
    const pitch = tiltMatch
      ? Math.max(-90, Math.min(90, 90 - parseFloat(tiltMatch[1])))
      : 0;
    // Try to extract a panoId directly from the URL (pattern: `!1s<id>!2e`)
    const panoIdMatch = url.match(/!1s([A-Za-z0-9_-]+)!2e/);
    const panoIdFromUrl = panoIdMatch ? panoIdMatch[1] : null;

    // Resolve nearest Street View panorama to avoid failures when exact coords lack coverage
    const svService = new google.maps.StreetViewService();
    const location = { lat: monastery.latitude, lng: monastery.longitude };
    svService.getPanorama(
      {
        location,
        radius: 20000,
        preference: google.maps.StreetViewPreference.NEAREST,
        source: google.maps.StreetViewSource.DEFAULT,
      },
      (data, status) => {
        if (
          status === google.maps.StreetViewStatus.OK &&
          data &&
          data.location
        ) {
          const panoId = data.location.pano;
          // eslint-disable-next-line no-new
          new google.maps.StreetViewPanorama(panoDiv, {
            pano: panoId,
            pov: { heading, pitch },
            zoom: 1,
            addressControl: false,
            linksControl: true,
            panControl: true,
            motionTracking: false,
            visible: true,
          });
          return;
        }
        // Fallback: if we have a panoId in the URL, try it directly
        if (panoIdFromUrl) {
          try {
            // eslint-disable-next-line no-new
            new google.maps.StreetViewPanorama(panoDiv, {
              pano: panoIdFromUrl,
              pov: { heading, pitch },
              zoom: 1,
              addressControl: false,
              linksControl: true,
              panControl: true,
              motionTracking: false,
              visible: true,
            });
            return;
          } catch (e) {
            console.warn(
              "Failed to initialize Street View with panoId from URL",
              e
            );
          }
        }
        // Final fallback: show message in modal rather than opening a new tab
        panoDiv.innerHTML =
          '<div style="color:white;text-align:center;padding:20px;">Street View imagery is not available here right now.</div>';
      }
    );
    return;
  }

  // Fallback: use Pannellum if a 360 image URL is available
  if (monastery.virtualTourUrl) {
    tourContainer.style.display = "flex";
    pannellum.viewer("panorama", {
      type: "equirectangular",
      panorama: monastery.virtualTourUrl,
      autoLoad: true,
      showControls: true,
    });
    return;
  }

  alert("Virtual tour for this monastery is not available yet.");
}

function closeTour() {
  const tourContainer = document.getElementById("panorama-container");
  if (tourContainer) tourContainer.style.display = "none";
}

// --- Google Maps 3D Viewer --- (previous async pattern)
async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  const position = { lat: 27.2871, lng: 88.7604 }; // Rumtek Monastery

  const map = new Map(document.getElementById("map-3d-container"), {
    center: position,
    zoom: 17,
    tilt: 65,
    heading: 90,
    mapId:
      (window.__APP_CONFIG__ && window.__APP_CONFIG__.googleMapsMapId) ||
      "YOUR_MAP_ID_HERE",
    mapTypeId: "satellite",
  });

  new AdvancedMarkerElement({
    map,
    position,
    title: "Rumtek Monastery",
  });
}
