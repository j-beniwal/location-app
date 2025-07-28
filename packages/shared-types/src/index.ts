// Core entities
export interface Route {
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

export interface VehicleTracking {
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

export interface Driver {
  id: string;
  name: string;
  type: 'pathfinder' | 'follower';
  isActive: boolean;
  createdAt: Date;
}

// API Request/Response types
export interface CreateRouteRequest {
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
  createdBy: string;
}

export interface UpdateLocationRequest {
  vehicleId: string;
  routeId: string;
  location: {
    latitude: number;
    longitude: number;
    timestamp: Date;
    accuracy?: number;
  };
}

export interface StartTrackingRequest {
  vehicleId: string;
  routeId: string;
  driverId: string;
}

// Socket.io event types
export interface SocketEvents {
  location_update: VehicleTracking;
  route_deviation: {
    vehicleId: string;
    routeId: string;
    deviation: {
      distance: number; // meters off route
      location: {
        latitude: number;
        longitude: number;
      };
    };
  };
  tracking_started: {
    vehicleId: string;
    routeId: string;
    startedAt: Date;
  };
  tracking_stopped: {
    vehicleId: string;
    routeId: string;
    completedAt: Date;
  };
}

// Utility types
export type DriverType = 'pathfinder' | 'follower';
export type VehicleStatus = 'idle' | 'active' | 'off_route' | 'completed';

// Error types
export interface ApiError {
  message: string;
  code: string;
  details?: any;
}

// Location types
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationPoint extends Coordinates {
  timestamp: Date;
  accuracy?: number;
}

// Navigation types
export interface NavigationInstruction {
  distance: number; // meters to next instruction
  instruction: string;
  type: 'turn_left' | 'turn_right' | 'continue' | 'arrive';
}

export interface RouteProgress {
  completed: number; // percentage
  remaining: number; // meters
  estimatedTimeRemaining: number; // minutes
}