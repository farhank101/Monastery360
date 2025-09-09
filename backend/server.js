const express = require('express');
require('dotenv').config();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../frontend')));

// Load monastery data
let monasteries = [];
let events = [];

try {
  const monasteriesData = fs.readFileSync(path.join(__dirname, '../data/monasteries.json'), 'utf8');
  monasteries = JSON.parse(monasteriesData);
} catch (err) {
  console.log('Monasteries data file not found, using empty array');
}

try {
  const eventsData = fs.readFileSync(path.join(__dirname, '../data/events.json'), 'utf8');
  events = JSON.parse(eventsData);
} catch (err) {
  console.log('Events data file not found, using empty array');
}

// Routes

// Public config endpoint to expose safe client config
app.get('/api/config', (req, res) => {
  res.json({
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || null,
    googleMapsMapId: process.env.GOOGLE_MAPS_MAP_ID || 'YOUR_MAP_ID_HERE'
  });
});

// Get all monasteries
app.get('/api/monasteries', (req, res) => {
  res.json(monasteries);
});

// Get single monastery by ID
app.get('/api/monasteries/:id', (req, res) => {
  const monastery = monasteries.find(m => m.id === parseInt(req.params.id));
  if (monastery) {
    res.json(monastery);
  } else {
    res.status(404).json({ message: 'Monastery not found' });
  }
});

// Get monasteries by region
app.get('/api/monasteries/region/:region', (req, res) => {
  const regionMonasteries = monasteries.filter(m => 
    m.region.toLowerCase() === req.params.region.toLowerCase()
  );
  res.json(regionMonasteries);
});

// Get all events
app.get('/api/events', (req, res) => {
  res.json(events);
});

// Get upcoming events
app.get('/api/events/upcoming', (req, res) => {
  const currentDate = new Date();
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= currentDate;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));
  res.json(upcomingEvents);
});

// Get events by monastery
app.get('/api/events/monastery/:monasteryId', (req, res) => {
  const monasteryEvents = events.filter(e => 
    e.monasteryId === parseInt(req.params.monasteryId)
  );
  res.json(monasteryEvents);
});

// Search monasteries
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.json(monasteries);
  }
  
  const searchTerm = q.toLowerCase();
  const results = monasteries.filter(m => 
    m.name.toLowerCase().includes(searchTerm) ||
    m.description.toLowerCase().includes(searchTerm) ||
    m.region.toLowerCase().includes(searchTerm)
  );
  res.json(results);
});

// Get monastery statistics
app.get('/api/stats', (req, res) => {
  const stats = {
    totalMonasteries: monasteries.length,
    totalEvents: events.length,
    regions: [...new Set(monasteries.map(m => m.region))],
    upcomingEvents: events.filter(e => new Date(e.date) >= new Date()).length
  };
  res.json(stats);
});

// Serve the main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Monastery360 server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});
