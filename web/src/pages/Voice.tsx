import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useInvestments } from "@/contexts/InvestmentContext";
import { Mic, Play, Download, Trash2, Volume2, Loader2, Brain, TrendingUp, MessageSquare, Sparkles, Save } from "lucide-react";

const API_BASE = "http://localhost:3001/api";

interface VoiceClip {
  id: string;
  text: string;
  voiceId: string;
  voiceName: string;
  timestamp: Date;
  audioUrl?: string;
  type: 'custom' | 'insight' | 'briefing' | 'answer';
}

interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
}

const Voice = () => {
  const { toast } = useToast();
  const { investmentsWithCurrentValue } = useInvestments();
  const [text, setText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("21m00Tcm4TlvDq8ikWAM");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [history, setHistory] = useState<VoiceClip[]>([]);
  const [stability, setStability] = useState([0.5]);
  const [similarityBoost, setSimilarityBoost] = useState([0.75]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [question, setQuestion] = useState("");

  useEffect(() => {
    fetchVoices();
    loadHistory();
  }, []);

  const fetchVoices = async () => {
    try {
      const response = await fetch(`${API_BASE}/voice/voices`);
      if (!response.ok) throw new Error("Failed to fetch voices");
      const data = await response.json();
      setVoices(data.voices || []);
    } catch (error) {
      console.error("Error fetching voices:", error);
      setVoices([
        { voice_id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", category: "premade", description: "Calm female voice" },
        { voice_id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", category: "premade", description: "Deep male voice" },
        { voice_id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", category: "premade", description: "Soft female voice" },
        { voice_id: "ErXwobaYiN019PkySvjV", name: "Antoni", category: "premade", description: "Friendly male voice" },
      ]);
    }
  };

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem("voiceHistory");
      if (saved) {
        const parsed = JSON.parse(saved);
        setHistory(parsed.map((item: any) => ({ ...item, timestamp: new Date(item.timestamp) })));
      }
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const saveHistory = (newHistory: VoiceClip[]) => {
    try {
      localStorage.setItem("voiceHistory", JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (error) {
      console.error("Error saving history:", error);
    }
  };

  const generateSpeech = async (textToSpeak: string, type: 'custom' | 'insight' | 'briefing' | 'answer' = 'custom') => {
    if (!textToSpeak.trim()) {
      toast({
        title: "No text provided",
        description: "Please enter some text to convert to speech",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${API_BASE}/voice/text-to-speech`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSpeak,
          voiceId: selectedVoice,
          stability: stability[0],
          similarityBoost: similarityBoost[0],
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to generate speech" }));
        throw new Error(error.error || "Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.play().catch(err => console.error("Error playing audio:", err));
      setCurrentAudio(audio);

      const voiceName = voices.find(v => v.voice_id === selectedVoice)?.name || "Unknown";
      const newClip: VoiceClip = {
        id: Date.now().toString(),
        text: textToSpeak.substring(0, 200), // Store preview
        voiceId: selectedVoice,
        voiceName,
        timestamp: new Date(),
        audioUrl,
        type,
      };

      const newHistory = [newClip, ...history].slice(0, 50);
      saveHistory(newHistory);

      toast({
        title: "Speech generated!",
        description: `Using ${voiceName} voice`,
      });
    } catch (error: any) {
      console.error("Error generating speech:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Could not generate speech",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzePortfolio = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`${API_BASE}/voice/analyze-portfolio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investments: investmentsWithCurrentValue }),
      });

      if (!response.ok) throw new Error("Failed to analyze portfolio");

      const data = await response.json();

      toast({
        title: "Analysis complete!",
        description: "Generating voice narration...",
      });

      await generateSpeech(data.insights.summary, 'insight');
    } catch (error: any) {
      console.error("Error analyzing portfolio:", error);
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const askQuestion = async () => {
    if (!question.trim()) {
      toast({
        title: "No question provided",
        description: "Please enter a question",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch(`${API_BASE}/voice/ask-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          investments: investmentsWithCurrentValue,
        }),
      });

      if (!response.ok) throw new Error("Failed to get answer");

      const data = await response.json();

      toast({
        title: "Answer ready!",
        description: "Generating voice response...",
      });

      await generateSpeech(data.answer, 'answer');
      setQuestion("");
    } catch (error: any) {
      console.error("Error asking question:", error);
      toast({
        title: "Question failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMarketBriefing = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`${API_BASE}/voice/market-briefing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) throw new Error("Failed to get briefing");

      const data = await response.json();

      toast({
        title: "Briefing ready!",
        description: "Generating voice narration...",
      });

      await generateSpeech(data.briefing, 'briefing');
    } catch (error: any) {
      console.error("Error getting briefing:", error);
      toast({
        title: "Briefing failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const playHistoryClip = (clip: VoiceClip) => {
    if (clip.audioUrl) {
      const audio = new Audio(clip.audioUrl);
      audio.play().catch(err => console.error("Error playing audio:", err));
      setCurrentAudio(audio);
    }
  };

  const downloadAudio = (clip: VoiceClip) => {
    if (!clip.audioUrl) return;

    const a = document.createElement("a");
    a.href = clip.audioUrl;
    a.download = `voice-${clip.id}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({
      title: "Download started",
      description: "Your audio file is being downloaded",
    });
  };

  const deleteClip = (id: string) => {
    const newHistory = history.filter(clip => clip.id !== id);
    saveHistory(newHistory);
    toast({
      title: "Clip deleted",
      description: "Voice clip removed from history",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'insight': return <Brain className="w-3 h-3" />;
      case 'briefing': return <TrendingUp className="w-3 h-3" />;
      case 'answer': return <MessageSquare className="w-3 h-3" />;
      default: return <Mic className="w-3 h-3" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'insight': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'briefing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'answer': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-terminal-accent/20 text-terminal-accent border-terminal-accent/30';
    }
  };

  return (
    <div className="min-h-screen bg-terminal-bg p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Brain className="w-10 h-10 text-terminal-accent" />
              AI Voice Assistant
            </h1>
            <p className="text-terminal-text">Your intelligent portfolio advisor powered by Gemini AI & ElevenLabs</p>
          </div>
          <div className="text-terminal-accent text-sm border border-terminal-accent rounded px-3 py-1">
            {investmentsWithCurrentValue.length} investments
          </div>
        </div>

        <Tabs defaultValue="assistant" className="space-y-6">
          <TabsList className="bg-terminal-surface border border-terminal-border">
            <TabsTrigger value="assistant" className="data-[state=active]:bg-terminal-accent data-[state=active]:text-terminal-bg">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="custom" className="data-[state=active]:bg-terminal-accent data-[state=active]:text-terminal-bg">
              <Mic className="w-4 h-4 mr-2" />
              Custom Speech
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-terminal-accent data-[state=active]:text-terminal-bg">
              <Save className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* AI Assistant Tab */}
          <TabsContent value="assistant" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Portfolio Analysis */}
              <Card className="bg-terminal-surface border-terminal-border p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  Portfolio Insights
                </h3>
                <p className="text-terminal-text mb-4">
                  Get an AI-powered analysis of your investment portfolio with personalized recommendations.
                </p>
                <Button
                  onClick={analyzePortfolio}
                  disabled={isAnalyzing || isGenerating}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5 mr-2" />
                      Analyze My Portfolio
                    </>
                  )}
                </Button>
              </Card>

              {/* Market Briefing */}
              <Card className="bg-terminal-surface border-terminal-border p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Market Briefing
                </h3>
                <p className="text-terminal-text mb-4">
                  Listen to the latest GPU market trends and investment opportunities.
                </p>
                <Button
                  onClick={getMarketBriefing}
                  disabled={isAnalyzing || isGenerating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Get Market Update
                    </>
                  )}
                </Button>
              </Card>
            </div>

            {/* Ask Questions */}
            <Card className="bg-terminal-surface border-terminal-border p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-400" />
                Ask About Your Portfolio
              </h3>
              <div className="space-y-4">
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask me anything... e.g., 'Which datacenter has the best ROI?', 'Should I diversify more?', 'What's my total return?'"
                  className="min-h-[100px] bg-terminal-bg border-terminal-border text-white resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      askQuestion();
                    }
                  }}
                />
                <Button
                  onClick={askQuestion}
                  disabled={isAnalyzing || isGenerating || !question.trim()}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Ask Question
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Custom Speech Tab */}
          <TabsContent value="custom" className="space-y-6">
            <Card className="bg-terminal-surface border-terminal-border p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-terminal-accent" />
                Custom Text-to-Speech
              </h2>

              <div className="space-y-4">
                <div>
                  <Label className="text-white mb-2">Text to speak</Label>
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter any text you want to convert to speech..."
                    className="min-h-[150px] bg-terminal-bg border-terminal-border text-white resize-none"
                    maxLength={5000}
                  />
                  <p className="text-terminal-text text-xs mt-1">{text.length} / 5000 characters</p>
                </div>

                <div>
                  <Label className="text-white mb-2">Voice</Label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger className="bg-terminal-bg border-terminal-border text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-terminal-surface border-terminal-border">
                      {voices.map((voice) => (
                        <SelectItem key={voice.voice_id} value={voice.voice_id} className="text-white">
                          {voice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4 pt-4 border-t border-terminal-border">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label className="text-white text-sm">Stability</Label>
                      <span className="text-terminal-accent text-sm">{stability[0].toFixed(2)}</span>
                    </div>
                    <Slider
                      value={stability}
                      onValueChange={setStability}
                      min={0}
                      max={1}
                      step={0.01}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label className="text-white text-sm">Similarity Boost</Label>
                      <span className="text-terminal-accent text-sm">{similarityBoost[0].toFixed(2)}</span>
                    </div>
                    <Slider
                      value={similarityBoost}
                      onValueChange={setSimilarityBoost}
                      min={0}
                      max={1}
                      step={0.01}
                      className="w-full"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => generateSpeech(text)}
                  disabled={isGenerating || !text.trim()}
                  className="w-full bg-terminal-accent hover:bg-terminal-accent/90 text-terminal-bg font-bold"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 mr-2" />
                      Generate Speech
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="bg-terminal-surface border-terminal-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Save className="w-6 h-6 text-terminal-accent" />
                  Voice History
                </h2>
                {history.length > 0 && (
                  <Button
                    onClick={() => {
                      saveHistory([]);
                      toast({ title: "History cleared" });
                    }}
                    variant="outline"
                    className="border-red-400/30 text-red-400 hover:bg-red-400/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.length === 0 ? (
                  <div className="col-span-full text-center text-terminal-text py-12">
                    <Save className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">No voice clips yet</p>
                    <p className="text-sm mt-2">Use the AI assistant or custom speech to get started!</p>
                  </div>
                ) : (
                  history.map((clip) => (
                    <Card
                      key={clip.id}
                      className="bg-terminal-bg border border-terminal-border p-4 hover:border-terminal-accent transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-1 rounded border flex items-center gap-1 ${getTypeColor(clip.type)}`}>
                              {getTypeIcon(clip.type)}
                              {clip.type}
                            </span>
                          </div>
                          <p className="text-terminal-accent font-semibold">{clip.voiceName}</p>
                          <p className="text-terminal-text text-xs">
                            {clip.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-white text-sm mb-4 line-clamp-3">{clip.text}</p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => playHistoryClip(clip)}
                          size="sm"
                          className="flex-1 bg-terminal-accent hover:bg-terminal-accent/90 text-terminal-bg"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Play
                        </Button>
                        <Button
                          onClick={() => downloadAudio(clip)}
                          size="sm"
                          variant="outline"
                          className="border-terminal-border text-white hover:bg-terminal-border"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => deleteClip(clip.id)}
                          size="sm"
                          variant="outline"
                          className="border-red-400/30 text-red-400 hover:bg-red-400/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Voice;
