import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInvestments } from '../contexts/InvestmentContext';
import { chatWithGemini, ChatMessage } from '../lib/gemini';
import { datacenterProjects } from '../data/datacenters';

const InvestmentChatSidebar = () => {
  const { investments, totalInvested, totalValue, totalReturn, availableBalance } = useInvestments();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI investment advisor. I can help you analyze your GPU datacenter portfolio, answer questions about your investments, and provide insights. What would you like to know?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Check if API key is configured
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey === 'demo-key') {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: '⚠️ Gemini API key not configured. Please:\n\n1. Get an API key from https://aistudio.google.com/app/apikey\n2. Create a .env file in the web directory\n3. Add: VITE_GEMINI_API_KEY=your_key_here\n4. Restart the dev server',
          },
        ]);
        setIsLoading(false);
        return;
      }

      // Convert messages to Gemini format
      const history: ChatMessage[] = messages.slice(1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
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
        datacenterProjects
      );

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage = error?.message || 'Unknown error';
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ Error: ${errorMessage}\n\nPlease check:\n- API key is valid\n- You have internet connection\n- Browser console for details`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="bg-terminal-surface border-terminal-border h-full flex flex-col">
      <CardHeader className="border-b border-terminal-border">
        <CardTitle className="text-terminal-accent flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          AI Investment Advisor
        </CardTitle>
        <p className="text-xs text-terminal-muted mt-1">
          Powered by Gemini 2.5 Pro
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-terminal-accent text-terminal-bg'
                      : 'bg-terminal-bg border border-terminal-border text-terminal-text'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
          <p className="mb-1">Try asking:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>What's my portfolio performance?</li>
            <li>Which investment is performing best?</li>
            <li>Show me GPU Farm vs Datacenter breakdown</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestmentChatSidebar;
