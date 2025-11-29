
import ChatShell from "../../components/ChatShell";

export default function BookAdvisorPage() {
  return (
    <ChatShell
      api="/api/book-advisor"
      title="📚 AI Book Advisor"
      subtitle="Recomendaciones de libros con Google Books y listas de lectura"
    />
  );
}
