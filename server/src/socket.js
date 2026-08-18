import { Server as SocketIOServer } from 'socket.io';

let ioInstance = null;

/**
 * Initializes Socket.IO engine on the given HTTP server instance.
 * @param {import('http').Server} httpServer
 * @returns {SocketIOServer}
 */
export function initSocketIO(httpServer) {
  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  ioInstance.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('join-room', (room) => {
      socket.join(room);
      console.log(`[Socket.IO] ${socket.id} joined room ${room}`);
    });

    socket.on('register-user', (userData) => {
      if (!userData) return;
      const { email, phone, role } = userData;

      if (email && typeof email === 'string') {
        const emailRoom = `user:${email.trim().toLowerCase()}`;
        socket.join(emailRoom);
        console.log(`[Socket.IO] ${socket.id} joined email room: ${emailRoom}`);
      }
      if (phone && typeof phone === 'string') {
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone) {
          const phoneRoom = `user:${cleanPhone}`;
          socket.join(phoneRoom);
          console.log(`[Socket.IO] ${socket.id} joined phone room: ${phoneRoom}`);
        }
      }
      if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
        socket.join('admin-ops');
        console.log(`[Socket.IO] ${socket.id} joined admin room: admin-ops`);
      }
    });

    socket.on('sos:location-update', (data) => {
      ioInstance.to(`track:${data.token}`).emit('location-updated', {
        latitude: data.lat,
        longitude: data.lng,
        accuracy: data.accuracy || 10,
        timestamp: new Date().toISOString(),
      });
      ioInstance.to('admin-ops').emit('admin:sos-location', data);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
}

export function getIO() {
  return ioInstance;
}
