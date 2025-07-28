# Fleet Route Management System

A comprehensive logistics platform that enables experienced drivers (path finders) to record optimal routes, which are then distributed to follower fleet vehicles for consistent navigation and real-time tracking.

## 🏗️ System Architecture

This monorepo contains:

- **Backend API** (`apps/backend`) - Node.js/Express server with PostgreSQL
- **Admin Web Platform** (`apps/admin-web`) - React web application for route management
- **Pathfinder Mobile** (`apps/pathfinder-mobile`) - React Native app for route recording
- **Follower Mobile** (`apps/follower-mobile`) - React Native app for route following
- **Shared Types** (`packages/shared-types`) - TypeScript interfaces
- **UI Components** (`packages/ui-components`) - Shared components
- **Utils** (`packages/utils`) - Shared utilities

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ with PostGIS extension
- Android Studio (for mobile development)
- Google Maps API key

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd fleet-route-management
npm install
```

### 2. Database Setup

```bash
# Install PostgreSQL and PostGIS
sudo apt-get install postgresql postgresql-contrib postgis

# Create database
sudo -u postgres createdb fleet_routes
sudo -u postgres psql -d fleet_routes -c "CREATE EXTENSION postgis;"

# Run database schema
psql -U username -d fleet_routes -f apps/backend/src/models/init.sql
```

### 3. Environment Configuration

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env
# Edit with your database credentials and Google Maps API key

# Admin Web
cp apps/admin-web/.env.example apps/admin-web/.env
# Edit with your Google Maps API key
```

### 4. Start Development Servers

```bash
# Terminal 1 - Backend API
npm run dev:backend

# Terminal 2 - Admin Web Platform  
npm run dev:admin

# Terminal 3 & 4 - Mobile Apps (requires Android Studio setup)
cd apps/pathfinder-mobile && npm run android
cd apps/follower-mobile && npm run android
```

## 📱 Application Features

### Path Finder Mobile App
- **Route Recording**: GPS tracking every 10 seconds during route recording
- **Route Review**: Preview and validate recorded routes before saving
- **Route Management**: View and manage previously recorded routes
- **Real-time GPS**: High-accuracy location tracking

### Follower Fleet Mobile App
- **Route Selection**: Browse and select routes by ID
- **Turn-by-turn Navigation**: Visual guidance following recorded paths
- **Real-time Tracking**: Location updates every 10-15 seconds
- **Deviation Alerts**: Notifications when straying from designated route

### Admin Web Platform
- **Route Visualization**: Interactive map showing all recorded routes
- **Fleet Monitoring**: Real-time tracking of all active vehicles
- **Route Management**: CRUD operations for route data
- **Dashboard**: Overview of system status and active operations

## 🎨 Design System

### Color Palette
- **Primary Blue**: `#2563eb` (Main brand color)
- **Success Green**: `#059669` (Active states)
- **Warning Orange**: `#ea580c` (Alerts)
- **Error Red**: `#dc2626` (Danger states)
- **Gray Scale**: `#f9fafb` to `#111827`

### Typography
- **Font**: Inter (web), System fonts (mobile)
- **Sizes**: 12px, 14px, 16px, 18px, 20px, 24px, 32px
- **Weights**: 400, 500, 600, 700

## 🔧 Development

### Project Structure
```
fleet-route-management/
├── apps/
│   ├── backend/              # Node.js API server
│   ├── admin-web/            # React admin platform
│   ├── pathfinder-mobile/    # React Native recorder app
│   └── follower-mobile/      # React Native follower app
├── packages/
│   ├── shared-types/         # TypeScript definitions
│   ├── ui-components/        # Shared UI components
│   └── utils/               # Shared utilities
└── docs/                    # Additional documentation
```

### Available Scripts

```bash
# Development
npm run dev:backend          # Start backend server
npm run dev:admin           # Start admin web app

# Building
npm run build:backend       # Build backend
npm run build:admin        # Build admin web app

# Testing & Linting
npm run test               # Run all tests
npm run lint              # Lint all packages

# Mobile Development
npm run install:mobile     # Install mobile dependencies
```

### Adding New Features

1. **Backend**: Add routes in `apps/backend/src/routes/`
2. **Frontend**: Add components in respective app directories
3. **Shared Types**: Update `packages/shared-types/src/index.ts`
4. **Database**: Add migrations in `apps/backend/src/models/`

## 📊 API Documentation

### Core Endpoints

#### Routes
- `GET /api/routes` - List all routes
- `POST /api/routes` - Create new route
- `GET /api/routes/:id` - Get specific route
- `PUT /api/routes/:id` - Update route
- `DELETE /api/routes/:id` - Delete route

#### Tracking
- `POST /api/tracking/start` - Start vehicle tracking
- `PUT /api/tracking/location` - Update vehicle location
- `POST /api/tracking/stop` - Stop vehicle tracking
- `GET /api/tracking/active` - Get all active vehicles

#### Real-time Events (Socket.io)
- `location_update` - Vehicle location updates
- `route_deviation` - Vehicle deviation alerts
- `tracking_started` - Vehicle starts route
- `tracking_stopped` - Vehicle completes route

## 🗄️ Database Schema

### Key Tables
- **drivers** - Pathfinder and follower driver information
- **routes** - Recorded route metadata
- **route_coordinates** - GPS points for each route
- **vehicle_tracking** - Active vehicle tracking sessions
- **tracking_history** - Historical location data

### PostGIS Integration
The system uses PostgreSQL with PostGIS extension for:
- Efficient geospatial queries
- Route proximity calculations
- Geographic indexing for performance

## 🔒 Security Considerations

### MVP Security
- Basic input validation with Joi
- CORS configuration
- Helmet.js security headers
- Environment variable protection

### Future Security Enhancements
- JWT authentication
- Role-based access control
- API rate limiting
- Data encryption at rest

## 🚦 Performance

### Optimization Features
- Database indexing on geographic data
- Real-time updates optimized for <100 concurrent users
- Efficient route coordinate storage
- Mobile app GPS optimization

### Monitoring
- Health check endpoint: `GET /health`
- Server uptime tracking
- Error logging and handling

## 🧪 Testing

### Test Structure
```bash
# Backend tests
cd apps/backend && npm test

# Frontend tests  
cd apps/admin-web && npm test

# Mobile tests
cd apps/pathfinder-mobile && npm test
cd apps/follower-mobile && npm test
```

## 📚 Additional Documentation

- [API Documentation](docs/api.md)
- [Mobile Setup Guide](docs/mobile-setup.md)
- [Database Schema](docs/database.md)
- [Deployment Guide](docs/deployment.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in the `docs/` folder

---

**Built with ❤️ for efficient fleet management**