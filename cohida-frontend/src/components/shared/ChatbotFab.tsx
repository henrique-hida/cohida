import { ArrowUp, BotMessageSquare, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router";

import { Button } from "@/components/ui/button";
import { chatbotResponses, chatbotSuggestions } from "@/mocks";

interface ChatMessage {
  content: string;
  role: "assistant" | "user";
}

function getResponse(prompt: string) {
  const normalized = prompt.toLocaleLowerCase("pt-BR");
  if (normalized.includes("futebol")) return chatbotResponses.football;
  if (normalized.includes("correr") || normalized.includes("corrida")) {
    return chatbotResponses.running;
  }
  if (normalized.includes("funcional") || normalized.includes("treino")) {
    return chatbotResponses.training;
  }
  if (normalized.includes("trilha") || normalized.includes("outdoor")) {
    return chatbotResponses.outdoor;
  }
  if (normalized.includes("presente")) return chatbotResponses.gift;
  return chatbotResponses.default;
}

export function ChatbotFab() {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { content: chatbotResponses.default, role: "assistant" },
  ]);
  const [prompt, setPrompt] = useState("");

  function sendMessage(value = prompt) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setMessages((current) => [
      ...current,
      { content: trimmed, role: "user" },
      { content: getResponse(trimmed), role: "assistant" },
    ]);
    setPrompt("");
  }

  if (pathname.startsWith("/admin")) return null;

  return (
    <div className="fixed right-4 bottom-4 z-40 sm:right-6 sm:bottom-6">
      {isOpen ? (
        <section
          aria-label="Assistente coHida"
          className="mb-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          <header className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                <BotMessageSquare className="size-4" />
              </span>
              <div>
                <h2 className="font-semibold">Assistente coHida</h2>
                <p className="text-xs text-muted-foreground">
                  Produtos e recomendações
                </p>
              </div>
            </div>
            <Button
              aria-label="Fechar assistente"
              onClick={() => setIsOpen(false)}
              size="icon-sm"
              variant="ghost"
            >
              <X />
            </Button>
          </header>
          <div className="grid max-h-72 gap-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <p
                className={`max-w-[90%] rounded-xl px-3 py-2 text-sm leading-6 ${message.role === "assistant" ? "bg-muted text-foreground" : "justify-self-end bg-primary text-primary-foreground"}`}
                key={`${message.role}-${index}`}
              >
                {message.content}
              </p>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 px-4 pb-3">
            {chatbotSuggestions.map((suggestion) => (
              <Button
                key={suggestion}
                onClick={() => sendMessage(suggestion)}
                size="xs"
                variant="outline"
              >
                {suggestion}
              </Button>
            ))}
          </div>
          <form
            className="flex gap-2 border-t border-border p-3"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Digite sua pergunta"
              value={prompt}
            />
            <Button aria-label="Enviar mensagem" size="icon" type="submit">
              <ArrowUp />
            </Button>
          </form>
        </section>
      ) : null}
      <Button
        aria-expanded={isOpen}
        aria-label={isOpen ? "Fechar assistente" : "Abrir assistente coHida"}
        className="h-12 rounded-full px-4 shadow-lg"
        onClick={() => setIsOpen((open) => !open)}
        size="lg"
      >
        <Sparkles />
        <span className="hidden sm:inline">Precisa de ajuda?</span>
        <span className="sm:hidden">Assistente</span>
      </Button>
    </div>
  );
}
