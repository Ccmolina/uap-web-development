import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// 🔐 Función para generar el JWT
const generarToken = (usuario) => {
  return jwt.sign(
    { id: usuario.id, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  )
}

// 📝 Registro de usuario
export const registrar = async (req, res) => {
  const { nombre, email, clave } = req.body

  try {
    const existente = await prisma.usuario.findUnique({ where: { email } })
    if (existente) return res.status(400).json({ error: 'El email ya está registrado' })

    const hash = await bcrypt.hash(clave, 10)

    const nuevoUsuario = await prisma.usuario.create({
      data: { nombre, email, clave: hash }
    })

    const token = generarToken(nuevoUsuario)
    res.cookie('token', token, { httpOnly: true })

    res.status(201).json({
      mensaje: 'Usuario registrado',
      token,
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar' })
  }
}

// 🔐 Login de usuario
export const login = async (req, res) => {
  const { email, clave } = req.body

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } })
    if (!usuario) return res.status(400).json({ error: 'Credenciales inválidas' })

    const valido = await bcrypt.compare(clave, usuario.clave)
    if (!valido) return res.status(400).json({ error: 'Credenciales inválidas' })

    const token = generarToken(usuario)
    res.cookie('token', token, { httpOnly: true })

    res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' })
  }
}

// 🔓 Logout de usuario
export const logout = (req, res) => {
  res.clearCookie('token')
  res.json({ mensaje: 'Sesión cerrada' })
}

// ⚙️ Actualizar perfil de usuario (nombre y/o clave)
export const actualizarPerfil = async (req, res) => {
  const { nombre, clave } = req.body
  const usuarioId = req.usuario.id

  try {
    const datosActualizados = {}

    if (nombre) {
      datosActualizados.nombre = nombre
    }

    if (clave) {
      const hash = await bcrypt.hash(clave, 10)
      datosActualizados.clave = hash
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id: usuarioId },
      data: datosActualizados
    })

    res.json({
      mensaje: 'Perfil actualizado',
      usuario: {
        id: usuarioActualizado.id,
        nombre: usuarioActualizado.nombre,
        email: usuarioActualizado.email
      }
    })
  } catch (error) {
    console.error('Error al actualizar perfil:', error)
    res.status(500).json({ error: 'Error al actualizar perfil' })
  }
}
