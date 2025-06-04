import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '../stores/uiStore';

const API_URL = 'http://localhost:3001/tasks';

export function useTasks(page = 1, limit = 5, boardId = 'default') {
  const queryClient = useQueryClient();
  const config = useUIStore.getState().config; // importante

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tasks', page, boardId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}?boardId=${boardId}&_page=${page}&_limit=${limit}`);
      if (!res.ok) throw new Error('Error al cargar tareas');
      const totalCount = res.headers.get('x-total-count');
      const tasks = await res.json();
      return { tasks, totalCount: Number(totalCount) };
    },
    keepPreviousData: true,
    refetchInterval: config.refetchInterval,
  });

  const addTask = useMutation({
    mutationFn: async ({ description, boardId }) => {
  const res = await fetch(API_URL, {
   method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, completed: false, boardId }),
      });
      if (!res.ok) throw new Error('Error al agregar tarea');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const toggleTask = useMutation({
    mutationFn: async (task) => {
      const res = await fetch(`${API_URL}/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (!res.ok) throw new Error('Error al cambiar estado');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al eliminar');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const editTask = useMutation({
    mutationFn: async ({ id, description }) => {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) throw new Error('Error al editar tarea');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  return {
    tasks: data?.tasks || [],
    totalCount: data?.totalCount || 0,
    isLoading,
    isError,
    addTask,
    toggleTask,
    deleteTask,
    editTask,
  };
}
