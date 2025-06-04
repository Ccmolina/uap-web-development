import { create } from 'zustand';

// Leer config previa del localStorage (si existe)
const savedConfig = JSON.parse(localStorage.getItem('config')) || {
  refetchInterval: 10000,
  uppercase: false,
};

export const useUIStore = create((set) => ({
  isEditing: null,
  setEditing: (id) => set({ isEditing: id }),
  clearEditing: () => set({ isEditing: null }),

  config: savedConfig,

  updateConfig: (newConfig) =>
    set((state) => {
      const updated = { ...state.config, ...newConfig };
      localStorage.setItem('config', JSON.stringify(updated)); // guardar
      return { config: updated };
    }),
}));
