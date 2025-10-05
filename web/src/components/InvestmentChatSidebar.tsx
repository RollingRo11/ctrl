import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInvestments } from "../contexts/InvestmentContext";
import { chatWithGemini, ChatMessage } from "../lib/gemini";
import { datacenterProjects } from "../data/datacenters";
import { Square, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "http://localhost:3001/api";

const InvestmentChatSidebar = () => {
  const { toast } = useToast();
  const { investments, totalInvested, totalValue, totalReturn, availableBalance } = useInvestments();
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI investment advisor. I can help you analyze your GPU datacenter portfolio, answer questions about your investments, and provide insights. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Check if API key is configured
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey === "demo-key") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "⚠️ Gemini API key not configured. Please:\n\n1. Get an API key from https://aistudio.google.com/app/apikey\n2. Create a .env file in the web directory\n3. Add: VITE_GEMINI_API_KEY=your_key_here\n4. Restart the dev server",
          },
        ]);
        setIsLoading(false);
        return;
      }

      // Convert messages to Gemini format
      const history: ChatMessage[] = messages.slice(1).map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

      const response = await chatWithGemini(
        userMessage,
        history,
        {
          investments,
          totalInvested,
          totalValue,
          totalReturn,
          availableBalance,
        },
        datacenterProjects,
      );

      setMessages((prev) => [...prev, { role: "assistant", content: response }]);

      // Auto-generate speech for AI responses
      await generateSpeech(response);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMessage = error?.message || "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `❌ Error: ${errorMessage}\n\nPlease check:\n- API key is valid\n- You have internet connection\n- Browser console for details`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const generateSpeech = async (text: string) => {
    if (isPlayingAudio || !text.trim()) return;

    setIsPlayingAudio(true);
    try {
      const response = await fetch(`${API_BASE}/voice/text-to-speech`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel voice
          stability: 0.5,
          similarityBoost: 0.75,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setIsPlayingAudio(false);
        setCurrentAudio(null);
      };

      audio.play().catch(err => console.error("Error playing audio:", err));
      setCurrentAudio(audio);

      toast({
        title: "🎙️ Playing response",
        description: "AI advisor speaking...",
      });
    } catch (error: any) {
      console.error("Error generating speech:", error);
      setIsPlayingAudio(false);
      toast({
        title: "Speech generation failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };


  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setIsPlayingAudio(false);
    }
  };

  return (
    <Card className="bg-terminal-surface border-terminal-border h-full flex flex-col">
      <CardHeader className="border-b border-terminal-border">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-terminal-accent flex items-center gap-2">AI Investment Advisor</CardTitle>
            <p className="text-xs text-terminal-muted mt-1">Powered by Gemini 2.5 Pro + ElevenLabs</p>
          </div>
          {isPlayingAudio && (
            <Button
              onClick={stopAudio}
              size="sm"
              variant="outline"
              className="border-terminal-border hover:bg-terminal-bg"
            >
              <Square className="w-4 h-4 mr-1" />
              Stop
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="flex items-start gap-2 max-w-[85%]">
                  <div
                    className={`rounded-lg px-4 py-2 flex-1 ${
                      message.role === "user"
                        ? "bg-terminal-accent text-terminal-bg"
                        : "bg-terminal-bg border border-terminal-border text-terminal-text"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === "assistant" && index > 0 && (
                    <Button
                      onClick={() => generateSpeech(message.content)}
                      size="sm"
                      variant="ghost"
                      className="p-2 h-8 w-8"
                      disabled={isPlayingAudio}
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-terminal-bg border border-terminal-border rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-terminal-accent rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-terminal-accent rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-terminal-accent rounded-full animate-pulse delay-150"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your investments..."
            className="bg-terminal-bg border-terminal-border text-terminal-text flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-terminal-accent text-terminal-bg hover:bg-terminal-accent/90"
          >
            Send
          </Button>
        </div>

        <div className="text-xs text-terminal-muted">
          <div className="flex items-center justify-between mb-1">
            <p>Try asking:</p>
            <div className="flex items-center gap-1 text-terminal-accent">
              <Volume2 className="w-3 h-3" />
              <span>Voice enabled</span>
            </div>
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li>What's my portfolio performance?</li>
            <li>Which investment is performing best?</li>
            <li>Should I diversify more?</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestmentChatSidebar;
