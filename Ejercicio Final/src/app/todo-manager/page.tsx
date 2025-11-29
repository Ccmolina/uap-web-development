
import ChatShell from "../../components/ChatShell";

export default function TodoManagerPage() {
  return (
    <ChatShell
      api="/api/todo-manager"
      title="✅ AI Todo Manager"
      subtitle="Gestor de tareas inteligente con estadísticas de productividad"
    />
  );
}
