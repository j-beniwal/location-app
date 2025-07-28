import express from 'express';
import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { Driver, DriverType } from '@fleet/shared-types';

const router = express.Router();

// Get all drivers
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    
    let query = `
      SELECT id, name, type, is_active, created_at
      FROM drivers
      WHERE is_active = true
    `;
    
    const params: any[] = [];
    
    if (type) {
      query += ' AND type = $1';
      params.push(type);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    
    const drivers: Driver[] = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type as DriverType,
      isActive: row.is_active,
      createdAt: row.created_at
    }));
    
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get specific driver
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT id, name, type, is_active, created_at
      FROM drivers
      WHERE id = $1 AND is_active = true
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    const driver: Driver = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      type: result.rows[0].type as DriverType,
      isActive: result.rows[0].is_active,
      createdAt: result.rows[0].created_at
    };
    
    res.json(driver);
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new driver
router.post('/', async (req, res) => {
  try {
    const { name, type } = req.body;
    
    // Validate driver type
    if (!['pathfinder', 'follower'].includes(type)) {
      return res.status(400).json({ 
        message: 'Invalid driver type. Must be "pathfinder" or "follower"' 
      });
    }
    
    const driverId = uuidv4();
    const query = `
      INSERT INTO drivers (id, name, type)
      VALUES ($1, $2, $3)
      RETURNING id, name, type, is_active, created_at
    `;
    
    const result = await pool.query(query, [driverId, name, type]);
    
    const driver: Driver = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      type: result.rows[0].type as DriverType,
      isActive: result.rows[0].is_active,
      createdAt: result.rows[0].created_at
    };
    
    res.status(201).json({
      message: 'Driver created successfully',
      driver
    });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update driver
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type } = req.body;
    
    // Validate driver type if provided
    if (type && !['pathfinder', 'follower'].includes(type)) {
      return res.status(400).json({ 
        message: 'Invalid driver type. Must be "pathfinder" or "follower"' 
      });
    }
    
    let query = 'UPDATE drivers SET ';
    const params: any[] = [];
    const updates: string[] = [];
    
    if (name) {
      updates.push(`name = $${params.length + 1}`);
      params.push(name);
    }
    
    if (type) {
      updates.push(`type = $${params.length + 1}`);
      params.push(type);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    query += updates.join(', ');
    query += ` WHERE id = $${params.length + 1} AND is_active = true RETURNING *`;
    params.push(id);
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    const driver: Driver = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      type: result.rows[0].type as DriverType,
      isActive: result.rows[0].is_active,
      createdAt: result.rows[0].created_at
    };
    
    res.json({
      message: 'Driver updated successfully',
      driver
    });
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete driver (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      UPDATE drivers 
      SET is_active = false 
      WHERE id = $1 AND is_active = true
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get driver statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if driver exists
    const driverQuery = `
      SELECT type FROM drivers 
      WHERE id = $1 AND is_active = true
    `;
    const driverResult = await pool.query(driverQuery, [id]);
    
    if (driverResult.rows.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    const driverType = driverResult.rows[0].type;
    let stats: any = {};
    
    if (driverType === 'pathfinder') {
      // Get pathfinder statistics
      const routesQuery = `
        SELECT 
          COUNT(*) as total_routes,
          AVG(distance) as avg_distance,
          AVG(estimated_duration) as avg_duration
        FROM routes 
        WHERE created_by = $1 AND is_active = true
      `;
      const routesResult = await pool.query(routesQuery, [id]);
      
      stats = {
        type: 'pathfinder',
        totalRoutes: parseInt(routesResult.rows[0].total_routes),
        averageDistance: routesResult.rows[0].avg_distance ? 
          parseFloat(routesResult.rows[0].avg_distance) : 0,
        averageDuration: routesResult.rows[0].avg_duration ? 
          parseFloat(routesResult.rows[0].avg_duration) : 0
      };
    } else {
      // Get follower statistics
      const trackingQuery = `
        SELECT 
          COUNT(*) as total_trips,
          COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_trips
        FROM vehicle_tracking 
        WHERE driver_id = $1
      `;
      const trackingResult = await pool.query(trackingQuery, [id]);
      
      stats = {
        type: 'follower',
        totalTrips: parseInt(trackingResult.rows[0].total_trips),
        completedTrips: parseInt(trackingResult.rows[0].completed_trips),
        completionRate: trackingResult.rows[0].total_trips > 0 ? 
          (trackingResult.rows[0].completed_trips / trackingResult.rows[0].total_trips) * 100 : 0
      };
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching driver stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;