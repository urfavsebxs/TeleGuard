import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import syncRoutes from './routes/sync.routes';
import { startCronJob } from './services/cron.service';
import { initBot } from './services/telegram.service';

// Cargar variables de entorno
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram-bot';

// Middlewares
app.use(cors({
  origin: '*', // Permitir todos los orígenes para desarrollo
  credentials: false,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Routes
// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/users', userRoutes);

// Ruta raíz
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'TeleGuard Bot API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      users: '/api/users',
    },
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Conectar a MongoDB y arrancar servidor
const startServer = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Inicializar bot de Telegram
    await initBot();
    console.log('✅ Bot de Telegram inicializado');

    // Iniciar cron job para verificar expiración de usuarios
    startCronJob();
    console.log('✅ Cron job iniciado');

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Deteniendo servidor...');
  await mongoose.disconnect();
  console.log('✅ MongoDB desconectado');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Deteniendo servidor...');
  await mongoose.disconnect();
  console.log('✅ MongoDB desconectado');
  process.exit(0);
});

// Iniciar servidor
startServer();

export default app;
