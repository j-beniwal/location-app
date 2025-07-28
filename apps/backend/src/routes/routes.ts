import express from 'express';
import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { Route, CreateRouteRequest } from '@fleet/shared-types';

const router = express.Router();

// Get all routes
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        r.id,
        r.name,
        ST_Y(r.start_point::geometry) as start_lat,
        ST_X(r.start_point::geometry) as start_lng,
        r.start_address,
        ST_Y(r.end_point::geometry) as end_lat,
        ST_X(r.end_point::geometry) as end_lng,
        r.end_address,
        r.created_by,
        r.created_at,
        r.updated_at,
        r.is_active,
        r.version,
        r.estimated_duration,
        r.distance,
        d.name as created_by_name
      FROM routes r
      JOIN drivers d ON r.created_by = d.id
      WHERE r.is_active = true
      ORDER BY r.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    const routes = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      startPoint: {
        latitude: parseFloat(row.start_lat),
        longitude: parseFloat(row.start_lng),
        address: row.start_address
      },
      endPoint: {
        latitude: parseFloat(row.end_lat),
        longitude: parseFloat(row.end_lng),
        address: row.end_address
      },
      createdBy: row.created_by,
      createdByName: row.created_by_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isActive: row.is_active,
      version: row.version,
      estimatedDuration: row.estimated_duration,
      distance: parseFloat(row.distance)
    }));
    
    res.json(routes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get specific route with coordinates
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get route details
    const routeQuery = `
      SELECT 
        r.id,
        r.name,
        ST_Y(r.start_point::geometry) as start_lat,
        ST_X(r.start_point::geometry) as start_lng,
        r.start_address,
        ST_Y(r.end_point::geometry) as end_lat,
        ST_X(r.end_point::geometry) as end_lng,
        r.end_address,
        r.created_by,
        r.created_at,
        r.updated_at,
        r.is_active,
        r.version,
        r.estimated_duration,
        r.distance
      FROM routes r
      WHERE r.id = $1 AND r.is_active = true
    `;
    
    const routeResult = await pool.query(routeQuery, [id]);
    
    if (routeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Route not found' });
    }
    
    // Get route coordinates
    const coordsQuery = `
      SELECT 
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude,
        timestamp,
        accuracy
      FROM route_coordinates
      WHERE route_id = $1
      ORDER BY sequence_order ASC
    `;
    
    const coordsResult = await pool.query(coordsQuery, [id]);
    
    const route = routeResult.rows[0];
    const pathCoordinates = coordsResult.rows.map(row => ({
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      timestamp: row.timestamp,
      accuracy: row.accuracy ? parseFloat(row.accuracy) : undefined
    }));
    
    const routeData: Route = {
      id: route.id,
      name: route.name,
      startPoint: {
        latitude: parseFloat(route.start_lat),
        longitude: parseFloat(route.start_lng),
        address: route.start_address
      },
      endPoint: {
        latitude: parseFloat(route.end_lat),
        longitude: parseFloat(route.end_lng),
        address: route.end_address
      },
      pathCoordinates,
      createdBy: route.created_by,
      createdAt: route.created_at,
      updatedAt: route.updated_at,
      isActive: route.is_active,
      version: route.version,
      estimatedDuration: route.estimated_duration,
      distance: parseFloat(route.distance)
    };
    
    res.json(routeData);
  } catch (error) {
    console.error('Error fetching route:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new route
router.post('/', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const routeData: CreateRouteRequest = req.body;
    
    await client.query('BEGIN');
    
    // Calculate estimated duration and distance (simplified)
    const estimatedDuration = Math.round(routeData.pathCoordinates.length * 0.5); // rough estimate
    const distance = routeData.pathCoordinates.length * 50; // rough estimate in meters
    
    // Insert route
    const routeId = uuidv4();
    const insertRouteQuery = `
      INSERT INTO routes (
        id, name, start_point, start_address, end_point, end_address,
        created_by, estimated_duration, distance
      ) VALUES (
        $1, $2, ST_Point($3, $4), $5, ST_Point($6, $7), $8, $9, $10, $11
      )
    `;
    
    await client.query(insertRouteQuery, [
      routeId,
      routeData.name,
      routeData.startPoint.longitude,
      routeData.startPoint.latitude,
      routeData.startPoint.address,
      routeData.endPoint.longitude,
      routeData.endPoint.latitude,
      routeData.endPoint.address,
      routeData.createdBy,
      estimatedDuration,
      distance
    ]);
    
    // Insert route coordinates
    for (let i = 0; i < routeData.pathCoordinates.length; i++) {
      const coord = routeData.pathCoordinates[i];
      const insertCoordQuery = `
        INSERT INTO route_coordinates (
          route_id, location, timestamp, accuracy, sequence_order
        ) VALUES ($1, ST_Point($2, $3), $4, $5, $6)
      `;
      
      await client.query(insertCoordQuery, [
        routeId,
        coord.longitude,
        coord.latitude,
        coord.timestamp,
        coord.accuracy,
        i
      ]);
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({ 
      message: 'Route created successfully',
      routeId 
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating route:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Delete route (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'UPDATE routes SET is_active = false WHERE id = $1';
    await pool.query(query, [id]);
    
    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;