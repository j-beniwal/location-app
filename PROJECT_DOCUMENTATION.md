# Fleet Route Management System - Project Documentation

## Project Overview

A logistics platform that enables experienced drivers (path finders) to record optimal routes, which are then distributed to follower fleet vehicles for consistent navigation and real-time tracking.

## System Architecture

### Applications Structure (Monorepo)
```
fleet-route-management/
├── apps/
│   ├── pathfinder-mobile/     # React Native app for route recording
│   ├── follower-mobile/       # React Native app for route following
│   ├── admin-web/             # React web platform for management
│   └── backend/               # Node.js API server
├── packages/
│   ├── shared-types/          # TypeScript types shared across apps
│   ├── ui-components/         # Shared UI components
│   └── utils/                 # Shared utility functions
└── docs/                      # Additional documentation
```

## Core Features (MVP)

### 1. Path Finder Mobile App
- **Route Recording**: Start/stop functionality with GPS tracking every 10 seconds
- **Route Review**: Preview recorded route before saving
- **Route Management**: View previously recorded routes
- **Simple UI**: Clean interface focused on functionality

### 2. Follower Fleet Mobile App
- **Route Selection**: Browse and select routes by route ID
- **Navigation**: Follow recorded path with visual guidance
- **Real-time Tracking**: Send location updates every 10-15 seconds
- **Deviation Alerts**: Notifications when off the designated path

### 3. Admin Web Platform
- **Route Visualization**: View all recorded routes on map
- **Fleet Monitoring**: Real-time tracking of all active vehicles
- **Route Management**: Basic CRUD operations for routes
- **Dashboard**: Overview of active routes and vehicles

### 4. Backend API
- **Route Storage**: PostgreSQL with PostGIS for geospatial data
- **Real-time Updates**: Socket.io for live vehicle tracking
- **RESTful API**: Standard endpoints for all operations
- **Local File Storage**: Route data and logs stored locally

## Technical Specifications

### Technology Stack

#### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with PostGIS extension
- **Real-time**: Socket.io
- **File Storage**: Local filesystem
- **Validation**: Joi or Zod for request validation

#### Mobile Apps (Android Focus)
- **Framework**: React Native
- **Maps**: React Native Maps with Google Maps
- **Location**: React Native Geolocation Service
- **State Management**: Zustand (lighter than Redux for MVP)
- **Navigation**: React Navigation

#### Web Admin Platform
- **Framework**: React with TypeScript
- **UI Library**: Material-UI (consistent design system)
- **Maps**: Google Maps JavaScript API
- **HTTP Client**: Axios
- **State Management**: Zustand

### Design System

#### Color Palette
```css
/* Primary Colors */
--primary-blue: #2563eb      /* Main brand color */
--primary-dark: #1d4ed8      /* Dark variant */
--primary-light: #3b82f6     /* Light variant */

/* Secondary Colors */
--secondary-green: #059669   /* Success/Active states */
--secondary-orange: #ea580c  /* Warnings/Alerts */
--secondary-red: #dc2626     /* Errors/Danger */

/* Neutral Colors */
--gray-50: #f9fafb
--gray-100: #f3f4f6
--gray-200: #e5e7eb
--gray-300: #d1d5db
--gray-500: #6b7280
--gray-700: #374151
--gray-900: #111827

/* Semantic Colors */
--success: var(--secondary-green)
--warning: var(--secondary-orange)
--error: var(--secondary-red)
--info: var(--primary-blue)
```

#### Typography
- **Font Family**: Inter (web), System fonts (mobile)
- **Font Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Font Sizes**: 12px, 14px, 16px, 18px, 20px, 24px, 32px

#### Component Guidelines
- **Border Radius**: 8px for cards, 4px for buttons
- **Shadows**: Subtle shadows for elevation
- **Spacing**: 8px base unit (8px, 16px, 24px, 32px)
- **Button Heights**: 40px (small), 48px (medium), 56px (large)

## Data Models

### Route
```typescript
interface Route {
  id: string;
  name: string;
  startPoint: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  endPoint: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  pathCoordinates: Array<{
    latitude: number;
    longitude: number;
    timestamp: Date;
    accuracy?: number;
  }>;
  createdBy: string; // pathfinder ID
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  version: number;
  estimatedDuration: number; // in minutes
  distance: number; // in meters
}
```

### Vehicle Tracking
```typescript
interface VehicleTracking {
  id: string;
  vehicleId: string;
  routeId: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    timestamp: Date;
    accuracy?: number;
  };
  isActive: boolean;
  startedAt: Date;
  estimatedArrival?: Date;
  progress: number; // percentage of route completed
}
```

### Driver
```typescript
interface Driver {
  id: string;
  name: string;
  type: 'pathfinder' | 'follower';
  isActive: boolean;
  createdAt: Date;
}
```

## API Endpoints

### Routes
- `GET /api/routes` - List all routes
- `POST /api/routes` - Create new route
- `GET /api/routes/:id` - Get specific route
- `PUT /api/routes/:id` - Update route
- `DELETE /api/routes/:id` - Delete route

### Tracking
- `POST /api/tracking/start` - Start vehicle tracking
- `PUT /api/tracking/location` - Update vehicle location
- `POST /api/tracking/stop` - Stop vehicle tracking
- `GET /api/tracking/active` - Get all active vehicles

### Real-time Events (Socket.io)
- `location_update` - Vehicle location updates
- `route_deviation` - When vehicle goes off route
- `tracking_started` - When vehicle starts following route
- `tracking_stopped` - When vehicle completes route

## Development Setup Requirements

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ with PostGIS extension
- Android Studio (for mobile development)
- Google Maps API key

### Environment Variables
```
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/fleet_routes
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=fleet_routes
POSTGRES_USER=username
POSTGRES_PASSWORD=password

# Google Maps
GOOGLE_MAPS_API_KEY=your_api_key_here

# Server
PORT=3000
NODE_ENV=development

# File Storage
UPLOAD_DIR=./uploads
```

## Implementation Phases

### Phase 1: Backend Setup
1. Initialize Node.js backend with Express
2. Set up PostgreSQL with PostGIS
3. Create database schemas and models
4. Implement core API endpoints
5. Add Socket.io for real-time features

### Phase 2: Path Finder Mobile App
1. Initialize React Native project
2. Implement GPS tracking functionality
3. Add route recording features
4. Create route review interface
5. Integrate with backend API

### Phase 3: Admin Web Platform
1. Initialize React web application
2. Create dashboard with route visualization
3. Implement real-time fleet monitoring
4. Add route management features
5. Style with consistent design system

### Phase 4: Follower Mobile App
1. Clone and modify path finder app structure
2. Implement route selection interface
3. Add navigation functionality
4. Create real-time tracking
5. Add deviation detection and alerts

### Phase 5: Integration & Testing
1. End-to-end testing of all components
2. Performance optimization
3. Bug fixes and refinements
4. Documentation updates

## Assumptions & Constraints

### MVP Scope
- Android-only mobile apps
- Google Maps integration
- Local file storage
- Simple role-based access (no complex auth)
- Basic UI focused on functionality
- Real-time tracking with 10-15 second intervals
- Route recording every 10 seconds
- Fleet size under 100 vehicles

### Future Enhancements (Not in MVP)
- iOS support
- Offline capabilities
- Voice navigation
- Advanced analytics
- Route optimization
- Vehicle management
- Complex user permissions
- Cloud deployment
- Advanced alerting system

## Success Criteria

### MVP Success Metrics
1. Path finders can successfully record routes
2. Routes are accurately stored and retrievable
3. Follower vehicles can select and navigate routes
4. Real-time tracking works reliably
5. Admin can monitor all activities on web platform
6. System handles up to 50 concurrent users
7. GPS accuracy within 10 meters in open areas

This documentation will serve as the foundation for implementation and will be updated as the project evolves.