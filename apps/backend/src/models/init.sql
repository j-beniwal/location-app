-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('pathfinder', 'follower')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    start_point GEOGRAPHY(POINT, 4326) NOT NULL,
    start_address TEXT,
    end_point GEOGRAPHY(POINT, 4326) NOT NULL,
    end_address TEXT,
    created_by UUID NOT NULL REFERENCES drivers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    estimated_duration INTEGER, -- in minutes
    distance DECIMAL -- in meters
);

-- Route coordinates table (stores the path points)
CREATE TABLE IF NOT EXISTS route_coordinates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    accuracy DECIMAL,
    sequence_order INTEGER NOT NULL,
    UNIQUE(route_id, sequence_order)
);

-- Vehicle tracking table
CREATE TABLE IF NOT EXISTS vehicle_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id VARCHAR(255) NOT NULL,
    route_id UUID NOT NULL REFERENCES routes(id),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    current_location GEOGRAPHY(POINT, 4326),
    location_timestamp TIMESTAMP WITH TIME ZONE,
    location_accuracy DECIMAL,
    is_active BOOLEAN DEFAULT true,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_arrival TIMESTAMP WITH TIME ZONE,
    progress DECIMAL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100)
);

-- Tracking history table (stores all location updates)
CREATE TABLE IF NOT EXISTS tracking_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_id UUID NOT NULL REFERENCES vehicle_tracking(id) ON DELETE CASCADE,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    accuracy DECIMAL,
    speed DECIMAL, -- km/h
    bearing DECIMAL -- degrees from north
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_routes_active ON routes(is_active);
CREATE INDEX IF NOT EXISTS idx_routes_created_by ON routes(created_by);
CREATE INDEX IF NOT EXISTS idx_route_coordinates_route_id ON route_coordinates(route_id);
CREATE INDEX IF NOT EXISTS idx_route_coordinates_sequence ON route_coordinates(route_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_vehicle_tracking_active ON vehicle_tracking(is_active);
CREATE INDEX IF NOT EXISTS idx_vehicle_tracking_vehicle ON vehicle_tracking(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_tracking_history_tracking_id ON tracking_history(tracking_id);
CREATE INDEX IF NOT EXISTS idx_tracking_history_timestamp ON tracking_history(timestamp);

-- Spatial indexes for geographic queries
CREATE INDEX IF NOT EXISTS idx_routes_start_point ON routes USING GIST(start_point);
CREATE INDEX IF NOT EXISTS idx_routes_end_point ON routes USING GIST(end_point);
CREATE INDEX IF NOT EXISTS idx_route_coordinates_location ON route_coordinates USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_vehicle_tracking_location ON vehicle_tracking USING GIST(current_location);
CREATE INDEX IF NOT EXISTS idx_tracking_history_location ON tracking_history USING GIST(location);

-- Insert some sample drivers for testing
INSERT INTO drivers (name, type) VALUES 
    ('John Pathfinder', 'pathfinder'),
    ('Alice Follower', 'follower'),
    ('Bob Follower', 'follower')
ON CONFLICT DO NOTHING;