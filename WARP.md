# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Monastery360 is a digital heritage platform showcasing Sikkim's 200+ monasteries through an interactive web application. This is an MVP implementation for the Government of Sikkim's Department of Higher & Technical Education (Problem ID: 25061).

## Development Commands

### Start Development Server
```bash
npm run dev
```
Runs the server with nodemon for auto-reload on file changes at http://localhost:3000

### Start Production Server
```bash
npm start
```
Runs the server normally at http://localhost:3000

### Install Dependencies
```bash
npm install
```
Installs Express.js, CORS, body-parser, and nodemon (dev dependency)

### Test API Endpoints
```bash
# Test all monasteries endpoint
curl http://localhost:3000/api/monasteries

# Test search functionality
curl "http://localhost:3000/api/search?q=rumtek"

# Test upcoming events
curl http://localhost:3000/api/events/upcoming

# Test statistics
curl http://localhost:3000/api/stats
```

## Architecture Overview

### Three-Tier Architecture

1. **Frontend Layer** (`frontend/`)
   - Single Page Application using vanilla JavaScript
   - `index.html`: Main HTML structure with sections for map, monasteries, events, and virtual tours
   - `app.js`: Handles all client-side logic, API calls, DOM manipulation, and map interactions
   - `styles.css`: Responsive CSS with mobile-first design
   - Uses Leaflet.js for interactive mapping with OpenStreetMap tiles

2. **Backend Layer** (`backend/server.js`)
   - Express.js server providing RESTful API endpoints
   - Serves static files from `public/` and `frontend/` directories
   - JSON file-based data storage (reads from `data/` directory on startup)
   - No database connection - data is loaded into memory from JSON files
   - CORS enabled for cross-origin requests

3. **Data Layer** (`data/`)
   - `monasteries.json`: Monastery database with geo-coordinates, descriptions, visiting hours
   - `events.json`: Cultural events and festivals database
   - Data is loaded once at server startup and kept in memory

### API Design Pattern

All API endpoints follow RESTful conventions:
- Base path: `/api`
- Resources: `/monasteries`, `/events`, `/stats`, `/search`
- Filtering: `/monasteries/region/:region`, `/events/monastery/:id`
- Query parameters: `/search?q=query`

### Frontend-Backend Communication Flow

1. Frontend makes fetch requests to API endpoints
2. Server processes requests against in-memory data
3. JSON responses are sent back
4. Frontend renders data dynamically in DOM

### Key Data Structures

**Monastery Object:**
```json
{
  "id": number,
  "name": string,
  "localName": string,
  "established": string,
  "region": "East/West/North/South Sikkim",
  "latitude": number,
  "longitude": number,
  "altitude": string,
  "description": string,
  "significance": string,
  "visitingHours": string,
  "entryFee": string,
  "contactNumber": string,
  "virtualTourUrl": string,
  "audioGuideAvailable": boolean
}
```

**Event Object:**
```json
{
  "id": number,
  "name": string,
  "type": "Festival/Sacred Ritual/Dance Festival/Religious Observance",
  "date": "YYYY-MM-DD",
  "monasteryId": number,
  "monasteryName": string,
  "description": string,
  "duration": string,
  "registrationRequired": boolean,
  "publicAllowed": boolean
}
```

## Important Implementation Details

### Map Integration
- Uses Leaflet.js library loaded from CDN
- Map centered on Sikkim coordinates (27.5330, 88.5122)
- Clickable markers for each monastery with popup information
- OpenStreetMap tiles for base layer

### Search Implementation
- Server-side search in `/api/search` endpoint
- Searches across monastery name, description, and region fields
- Case-insensitive matching using JavaScript's `includes()`

### Event Filtering
- Upcoming events filtered by comparing dates with current date
- Events sorted chronologically
- Client-side filtering for event types (festivals, rituals)

### State Management
- Global variables in `app.js` store monasteries, events, map instance
- No state management library - direct DOM manipulation
- Data loaded once on page load and cached in memory

### Error Handling
- Server gracefully handles missing data files (uses empty arrays)
- Frontend has try-catch blocks around API calls
- 404 responses for invalid monastery/event IDs

## Development Considerations

### Adding New Features
- New API endpoints should be added to `backend/server.js`
- Frontend functionality goes in `frontend/app.js`
- Keep data structure consistent when editing JSON files

### Performance Notes
- All data loaded into memory - suitable for MVP but not scalable
- No pagination implemented - all records returned at once
- Images served as static files from `public/` directory

### Security Considerations for Production
- Currently no authentication or authorization
- No input validation or sanitization
- CORS accepts all origins
- No rate limiting implemented
- Data files are read-only (no write operations)

## Directory Navigation Context
When working with files:
- API logic: `backend/server.js`
- UI logic: `frontend/app.js`
- Styles: `frontend/styles.css`
- Data files: `data/monasteries.json`, `data/events.json`
- Static assets: `public/` directory
