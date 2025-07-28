import { Socket, Server } from 'socket.io';
import { SocketEvents } from '@fleet/shared-types';

export const handleSocketConnection = (socket: Socket, io: Server) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Join a room for specific route tracking
  socket.on('join_route', (routeId: string) => {
    socket.join(`route_${routeId}`);
    console.log(`Client ${socket.id} joined route ${routeId}`);
  });
  
  // Leave a route room
  socket.on('leave_route', (routeId: string) => {
    socket.leave(`route_${routeId}`);
    console.log(`Client ${socket.id} left route ${routeId}`);
  });
  
  // Join admin room for monitoring all vehicles
  socket.on('join_admin', () => {
    socket.join('admin');
    console.log(`Client ${socket.id} joined admin room`);
  });
  
  // Leave admin room
  socket.on('leave_admin', () => {
    socket.leave('admin');
    console.log(`Client ${socket.id} left admin room`);
  });
  
  // Handle location updates from mobile apps
  socket.on('location_update', (data: SocketEvents['location_update']) => {
    // Broadcast to route-specific room
    socket.to(`route_${data.routeId}`).emit('location_update', data);
    
    // Broadcast to admin room
    socket.to('admin').emit('location_update', data);
    
    console.log(`Location update for vehicle ${data.vehicleId} on route ${data.routeId}`);
  });
  
  // Handle route deviation alerts
  socket.on('route_deviation', (data: SocketEvents['route_deviation']) => {
    // Broadcast to route-specific room
    socket.to(`route_${data.routeId}`).emit('route_deviation', data);
    
    // Broadcast to admin room
    socket.to('admin').emit('route_deviation', data);
    
    console.log(`Route deviation alert for vehicle ${data.vehicleId}`);
  });
  
  // Handle tracking started events
  socket.on('tracking_started', (data: SocketEvents['tracking_started']) => {
    // Broadcast to route-specific room
    socket.to(`route_${data.routeId}`).emit('tracking_started', data);
    
    // Broadcast to admin room
    socket.to('admin').emit('tracking_started', data);
    
    console.log(`Tracking started for vehicle ${data.vehicleId} on route ${data.routeId}`);
  });
  
  // Handle tracking stopped events
  socket.on('tracking_stopped', (data: SocketEvents['tracking_stopped']) => {
    // Broadcast to route-specific room
    socket.to(`route_${data.routeId}`).emit('tracking_stopped', data);
    
    // Broadcast to admin room
    socket.to('admin').emit('tracking_stopped', data);
    
    console.log(`Tracking stopped for vehicle ${data.vehicleId} on route ${data.routeId}`);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
  
  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`Socket error for client ${socket.id}:`, error);
  });
};

// Utility function to broadcast to all admin clients
export const broadcastToAdmin = (io: Server, event: string, data: any) => {
  io.to('admin').emit(event, data);
};

// Utility function to broadcast to specific route
export const broadcastToRoute = (io: Server, routeId: string, event: string, data: any) => {
  io.to(`route_${routeId}`).emit(event, data);
};

// Utility function to get connected clients count
export const getConnectedClientsCount = (io: Server): number => {
  return io.engine.clientsCount;
};

// Utility function to get clients in a specific room
export const getClientsInRoom = async (io: Server, room: string): Promise<string[]> => {
  const clients = await io.in(room).allSockets();
  return Array.from(clients);
};