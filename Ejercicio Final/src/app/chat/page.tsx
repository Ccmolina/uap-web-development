
import ChatShell from "../../components/ChatShell";

export default function ChatPage() {
  return (
    <ChatShell
      api="/api/chat"
      title="🤖 Chatbot General"
      subtitle="Chat clásico con OpenRouter y streaming"
    />
  );
}
