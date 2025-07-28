import express from 'express';
import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { VehicleTracking, StartTrackingRequest, UpdateLocationRequest } from '@fleet/shared-types';

const router = express.Router();

// Start vehicle tracking
router.post('/start', async (req, res) => {
  try {
    const trackingData: StartTrackingRequest = req.body;
    
    // Check if vehicle is already tracking a route
    const existingQuery = `
      SELECT id FROM vehicle_tracking 
      WHERE vehicle_id = $1 AND is_active = true
    `;
    const existingResult = await pool.query(existingQuery, [trackingData.vehicleId]);
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Vehicle is already tracking a route' 
      });
    }
    
    // Create new tracking session
    const trackingId = uuidv4();
    const insertQuery = `
      INSERT INTO vehicle_tracking (
        id, vehicle_id, route_id, driver_id, is_active, started_at
      ) VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [
      trackingId,
      trackingData.vehicleId,
      trackingData.routeId,
      trackingData.driverId
    ]);
    
    res.status(201).json({
      message: 'Tracking started successfully',
      trackingId: result.rows[0].id
    });
    
  } catch (error) {
    console.error('Error starting tracking:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update vehicle location
router.put('/location', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const locationData: UpdateLocationRequest = req.body;
    
    await client.query('BEGIN');
    
    // Get active tracking session
    const trackingQuery = `
      SELECT id FROM vehicle_tracking 
      WHERE vehicle_id = $1 AND route_id = $2 AND is_active = true
    `;
    const trackingResult = await client.query(trackingQuery, [
      locationData.vehicleId,
      locationData.routeId
    ]);
    
    if (trackingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        message: 'Active tracking session not found' 
      });
    }
    
    const trackingId = trackingResult.rows[0].id;
    
    // Update current location in tracking table
    const updateTrackingQuery = `
      UPDATE vehicle_tracking 
      SET 
        current_location = ST_Point($1, $2),
        location_timestamp = $3,
        location_accuracy = $4
      WHERE id = $5
    `;
    
    await client.query(updateTrackingQuery, [
      locationData.location.longitude,
      locationData.location.latitude,
      locationData.location.timestamp,
      locationData.location.accuracy,
      trackingId
    ]);
    
    // Insert into tracking history
    const historyQuery = `
      INSERT INTO tracking_history (
        tracking_id, location, timestamp, accuracy
      ) VALUES ($1, ST_Point($2, $3), $4, $5)
    `;
    
    await client.query(historyQuery, [
      trackingId,
      locationData.location.longitude,
      locationData.location.latitude,
      locationData.location.timestamp,
      locationData.location.accuracy
    ]);
    
    await client.query('COMMIT');
    
    res.json({ message: 'Location updated successfully' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Stop tracking
router.post('/stop', async (req, res) => {
  try {
    const { vehicleId, routeId } = req.body;
    
    const updateQuery = `
      UPDATE vehicle_tracking 
      SET is_active = false, completed_at = CURRENT_TIMESTAMP
      WHERE vehicle_id = $1 AND route_id = $2 AND is_active = true
    `;
    
    const result = await pool.query(updateQuery, [vehicleId, routeId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ 
        message: 'Active tracking session not found' 
      });
    }
    
    res.json({ message: 'Tracking stopped successfully' });
    
  } catch (error) {
    console.error('Error stopping tracking:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all active vehicles
router.get('/active', async (req, res) => {
  try {
    const query = `
      SELECT 
        vt.id,
        vt.vehicle_id,
        vt.route_id,
        r.name as route_name,
        d.name as driver_name,
        ST_Y(vt.current_location::geometry) as current_lat,
        ST_X(vt.current_location::geometry) as current_lng,
        vt.location_timestamp,
        vt.location_accuracy,
        vt.started_at,
        vt.progress,
        vt.estimated_arrival
      FROM vehicle_tracking vt
      JOIN routes r ON vt.route_id = r.id
      JOIN drivers d ON vt.driver_id = d.id
      WHERE vt.is_active = true
      ORDER BY vt.started_at DESC
    `;
    
    const result = await pool.query(query);
    
    const activeVehicles = result.rows.map(row => ({
      id: row.id,
      vehicleId: row.vehicle_id,
      routeId: row.route_id,
      routeName: row.route_name,
      driverName: row.driver_name,
      currentLocation: row.current_lat && row.current_lng ? {
        latitude: parseFloat(row.current_lat),
        longitude: parseFloat(row.current_lng),
        timestamp: row.location_timestamp,
        accuracy: row.location_accuracy ? parseFloat(row.location_accuracy) : undefined
      } : null,
      startedAt: row.started_at,
      progress: parseFloat(row.progress),
      estimatedArrival: row.estimated_arrival,
      isActive: true
    }));
    
    res.json(activeVehicles);
    
  } catch (error) {
    console.error('Error fetching active vehicles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get tracking history for a vehicle
router.get('/history/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { routeId } = req.query;
    
    let query = `
      SELECT 
        th.id,
        ST_Y(th.location::geometry) as latitude,
        ST_X(th.location::geometry) as longitude,
        th.timestamp,
        th.accuracy,
        th.speed,
        th.bearing
      FROM tracking_history th
      JOIN vehicle_tracking vt ON th.tracking_id = vt.id
      WHERE vt.vehicle_id = $1
    `;
    
    const params = [vehicleId];
    
    if (routeId) {
      query += ' AND vt.route_id = $2';
      params.push(routeId as string);
    }
    
    query += ' ORDER BY th.timestamp DESC LIMIT 100';
    
    const result = await pool.query(query, params);
    
    const history = result.rows.map(row => ({
      id: row.id,
      location: {
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude)
      },
      timestamp: row.timestamp,
      accuracy: row.accuracy ? parseFloat(row.accuracy) : undefined,
      speed: row.speed ? parseFloat(row.speed) : undefined,
      bearing: row.bearing ? parseFloat(row.bearing) : undefined
    }));
    
    res.json(history);
    
  } catch (error) {
    console.error('Error fetching tracking history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;