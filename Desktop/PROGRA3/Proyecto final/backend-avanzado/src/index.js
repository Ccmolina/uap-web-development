import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

import authRoutes from './routes/authRoutes.js'
import perfilRoutes from './routes/perfilRoutes.js'
import tableroRoutes from './routes/tableroRoutes.js'
import tareaRoutes from './routes/tareaRoutes.js'
import miembroRoutes from './routes/miembroRoutes.js'
import usuarioRoutes from './routes/usuarios.js'

// Cargar variables de entorno
dotenv.config()

// Inicializar servidor y Prisma
const app = express()
const prisma = new PrismaClient()

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'], // Acepta ambos orígenes
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

// Rutas con prefijo /api
app.use('/api/auth', authRoutes)
app.use('/api/perfil', perfilRoutes)
app.use('/api/tableros', tableroRoutes) 
app.use('/api/tareas', tareaRoutes)
app.use('/api/miembros', miembroRoutes)
app.use('/api/usuarios', usuarioRoutes)

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente 🎉')
})

// Iniciar servidor
const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
