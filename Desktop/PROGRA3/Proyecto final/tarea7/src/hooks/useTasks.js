import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '../stores/uiStore'
import api from '../api'

export function useTasks(page = 1, limit = 5, boardId) {
  const queryClient = useQueryClient()
  const config = useUIStore.getState().config

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tasks', boardId],
    queryFn: async () => {
      const res = await api.get(`/tareas/${boardId}`)
      return {
        tasks: res.data,
        totalCount: res.data.length // si quieres paginación real, se puede implementar luego
      }
    },
    refetchInterval: config.refetchInterval,
  })

  const addTask = useMutation({
    mutationFn: async ({ titulo, tableroId }) => {
      const res = await api.post('/tareas', {
        titulo,
        tableroId: parseInt(tableroId)
      })
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', boardId] }),
  })

  const toggleTask = useMutation({
    mutationFn: async (task) => {
      const res = await api.patch(`/tareas/${task.id}`, {
        completada: !task.completada
      })
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', boardId] }),
  })

  const deleteTask = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/tareas/${id}`)
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', boardId] }),
  })

  const editTask = useMutation({
    mutationFn: async ({ id, titulo }) => {
      const res = await api.patch(`/tareas/${id}`, {
        titulo
      })
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', boardId] }),
  })

  return {
    tasks: data?.tasks || [],
    totalCount: data?.totalCount || 0,
    isLoading,
    isError,
    addTask,
    toggleTask,
    deleteTask,
    editTask,
  }
}
