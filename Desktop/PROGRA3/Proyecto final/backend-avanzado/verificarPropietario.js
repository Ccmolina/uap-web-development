// verificarPropietario.js
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const verificar = async () => {
  const tableroId = 1        // ID del tablero que querés consultar
  const usuarioId = 1        // Tu ID autenticado (Sofía)

  const tablero = await prisma.tablero.findUnique({
    where: { id: tableroId }
  })

  if (!tablero) {
    console.log('❌ El tablero no existe.')
    return
  }

  if (tablero.propietarioId === usuarioId) {
    console.log('✅ El usuario ES el propietario del tablero.')
  } else {
    console.log('❌ El usuario NO es el propietario del tablero.')
    console.log(`➡️ El propietario real es el usuario con ID: ${tablero.propietarioId}`)
  }
}

verificar()
