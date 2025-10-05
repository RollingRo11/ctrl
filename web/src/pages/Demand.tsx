import { useState, useEffect } from "react";
import { RefreshCw, ExternalLink, Check, X, AlertCircle, TrendingUp, Activity, DollarSign, Settings } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Types
interface HuggingFaceModel {
  modelId: string;
  downloads: number;
  likes: number;
  tags: string[];
  lastModified: string;
}

interface CryptoPrice {
  usd: number;
  usd_24h_change: number;
}

interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  stargazers_count: number;
  description: string;
}

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: { name: string };
}

interface APIStatus {
  huggingface: boolean;
  coingecko: boolean;
  github: boolean;
  newsapi: boolean;
  blockchain: boolean;
}

interface FeedItem {
  id: string;
  timestamp: string;
  category: "AI" | "Crypto" | "Industry";
  impact: "High" | "Medium" | "Low";
  source: string;
  title: string;
  description: string;
  link: string;
  image?: string;
}

export default function Demand() {
  // State management
  const [trendingModels, setTrendingModels] = useState<HuggingFaceModel[]>([]);
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, CryptoPrice>>({});
  const [trendingRepos, setTrendingRepos] = useState<GitHubRepo[]>([]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [miningData, setMiningData] = useState({ hashrate: 0, difficulty: 0 });
  const [apiStatus, setApiStatus] = useState<APIStatus>({
    huggingface: false,
    coingecko: false,
    github: false,
    newsapi: false,
    blockchain: false,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [newsApiKey, setNewsApiKey] = useState("7b99a2ef533f428e8ff316204e178d18");
  const [githubToken, setGithubToken] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [modelDownloadData, setModelDownloadData] = useState<any[]>([]);
  const [cryptoPriceData, setCryptoPriceData] = useState<any[]>([]);

  // API fetch functions
  const fetchTrendingModels = async () => {
    try {
      const response = await fetch(
        "https://huggingface.co/api/models?sort=downloads&direction=-1&limit=20"
      );
      const data = await response.json();
      setTrendingModels(data);
      setApiStatus((prev) => ({ ...prev, huggingface: true }));
      return data;
    } catch (error) {
      console.error("Hugging Face API error:", error);
      setApiStatus((prev) => ({ ...prev, huggingface: false }));
      return [];
    }
  };

  const fetchCryptoPrices = async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,litecoin,dogecoin&vs_currencies=usd&include_24hr_change=true"
      );
      const data = await response.json();
      setCryptoPrices(data);
      setApiStatus((prev) => ({ ...prev, coingecko: true }));
      return data;
    } catch (error) {
      console.error("CoinGecko API error:", error);
      setApiStatus((prev) => ({ ...prev, coingecko: false }));
      return {};
    }
  };

  const fetchTrendingRepos = async () => {
    try {
      const headers: HeadersInit = {};
      if (githubToken) {
        headers["Authorization"] = `token ${githubToken}`;
      }

      const response = await fetch(
        "https://api.github.com/search/repositories?q=machine+learning+stars:>1000&sort=stars&order=desc&per_page=10",
        { headers }
      );
      const data = await response.json();
      setTrendingRepos(data.items || []);
      setApiStatus((prev) => ({ ...prev, github: true }));
      return data.items || [];
    } catch (error) {
      console.error("GitHub API error:", error);
      setApiStatus((prev) => ({ ...prev, github: false }));
      return [];
    }
  };

  const fetchAINews = async () => {
    if (!newsApiKey) {
      setApiStatus((prev) => ({ ...prev, newsapi: false }));
      return [];
    }

    try {
      // More specific tech-focused query
      const query = '(artificial+intelligence+OR+machine+learning+OR+AI+OR+GPU+OR+datacenter+OR+data+center+OR+NVIDIA+OR+AMD+OR+cryptocurrency+OR+bitcoin+OR+ethereum+OR+mining+OR+blockchain+OR+cloud+computing+OR+AWS+OR+Azure+OR+Google+Cloud+OR+OpenAI+OR+ChatGPT+OR+LLM+OR+neural+network+OR+deep+learning+OR+tensor+OR+TPU)+AND+(technology+OR+computing+OR+hardware+OR+software+OR+tech)';

      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=20&language=en&apiKey=${newsApiKey}`
      );
      const data = await response.json();

      if (data.status === "ok") {
        setNewsArticles(data.articles || []);
        setApiStatus((prev) => ({ ...prev, newsapi: true }));
        return data.articles || [];
      } else {
        setApiStatus((prev) => ({ ...prev, newsapi: false }));
        return [];
      }
    } catch (error) {
      console.error("NewsAPI error:", error);
      setApiStatus((prev) => ({ ...prev, newsapi: false }));
      return [];
    }
  };

  const fetchMiningData = async () => {
    try {
      const hashrateResponse = await fetch("http://localhost:3001/api/blockchain/hashrate");
      const difficultyResponse = await fetch("http://localhost:3001/api/blockchain/difficulty");

      const hashrate = await hashrateResponse.text();
      const difficulty = await difficultyResponse.text();

      setMiningData({
        hashrate: parseFloat(hashrate),
        difficulty: parseFloat(difficulty),
      });
      setApiStatus((prev) => ({ ...prev, blockchain: true }));
      return { hashrate: parseFloat(hashrate), difficulty: parseFloat(difficulty) };
    } catch (error) {
      console.error("Blockchain.com API error:", error);
      setApiStatus((prev) => ({ ...prev, blockchain: false }));
      return { hashrate: 0, difficulty: 0 };
    }
  };

  const fetchCryptoPriceHistory = async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7"
      );
      const data = await response.json();

      // Format data for recharts (take every 6th point for cleaner chart)
      const formatted = data.prices
        .filter((_: any, index: number) => index % 6 === 0)
        .map((item: any) => ({
          timestamp: new Date(item[0]).toLocaleDateString(),
          price: item[1],
        }));

      setCryptoPriceData(formatted);
    } catch (error) {
      console.error("CoinGecko history error:", error);
    }
  };

  // Helper function to truncate long descriptions
  const truncateDescription = (description: string, maxWords: number = 15): string => {
    if (!description) return "";
    const words = description.split(' ');
    if (words.length <= maxWords) return description;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  // Generate feed items from API data
  const generateFeedItems = (models: any[], repos: any[], news: any[], crypto: any, mining: any) => {
    const items: FeedItem[] = [];
    let idCounter = 0;

    // AI Model items
    models.slice(0, 5).forEach((model) => {
      items.push({
        id: `ai-${idCounter++}`,
        timestamp: new Date(model.lastModified || Date.now()).toLocaleString(),
        category: "AI",
        impact: model.downloads > 100000 ? "High" : model.downloads > 10000 ? "Medium" : "Low",
        source: "Hugging Face",
        title: `${model.modelId} trending with ${model.downloads?.toLocaleString() || 0} downloads`,
        description: `Popular AI model for ${model.tags?.[0] || "machine learning"}. Your Phoenix AI Cluster's H100 GPUs are well-positioned for this workload type.`,
        link: `https://huggingface.co/${model.modelId}`,
      });
    });

    // GitHub repo items
    repos.slice(0, 5).forEach((repo) => {
      const repoDesc = repo.description || "AI/ML repository gaining traction";
      items.push({
        id: `github-${idCounter++}`,
        timestamp: new Date().toLocaleString(),
        category: "Industry",
        impact: repo.stargazers_count > 10000 ? "High" : "Medium",
        source: "GitHub",
        title: `${repo.name} trending - ${repo.stargazers_count?.toLocaleString()} stars`,
        description: truncateDescription(`${repoDesc}. Indicates growing developer interest in AI infrastructure.`),
        link: repo.html_url,
      });
    });

    // Crypto price items
    if (crypto.bitcoin) {
      const btcChange = crypto.bitcoin.usd_24h_change || 0;
      items.push({
        id: `crypto-${idCounter++}`,
        timestamp: new Date().toLocaleString(),
        category: "Crypto",
        impact: Math.abs(btcChange) > 5 ? "High" : Math.abs(btcChange) > 2 ? "Medium" : "Low",
        source: "CoinGecko",
        title: `Bitcoin: $${crypto.bitcoin.usd?.toLocaleString()} (${btcChange > 0 ? "+" : ""}${btcChange.toFixed(2)}% 24h)`,
        description: `Mining profitability ${btcChange > 0 ? "increased" : "decreased"}. Current estimated rate: $${(crypto.bitcoin.usd * 0.00001).toFixed(2)}/day per GPU.`,
        link: "https://www.coingecko.com/en/coins/bitcoin",
      });
    }

    if (crypto.ethereum) {
      const ethChange = crypto.ethereum.usd_24h_change || 0;
      items.push({
        id: `crypto-eth-${idCounter++}`,
        timestamp: new Date().toLocaleString(),
        category: "Crypto",
        impact: Math.abs(ethChange) > 5 ? "High" : "Low",
        source: "CoinGecko",
        title: `Ethereum: $${crypto.ethereum.usd?.toLocaleString()} (${ethChange > 0 ? "+" : ""}${ethChange.toFixed(2)}% 24h)`,
        description: `ETH price movement affecting GPU compute allocation decisions for mining vs AI workloads.`,
        link: "https://www.coingecko.com/en/coins/ethereum",
      });
    }

    // Mining difficulty item
    if (mining.difficulty > 0) {
      items.push({
        id: `mining-${idCounter++}`,
        timestamp: new Date().toLocaleString(),
        category: "Crypto",
        impact: "Medium",
        source: "Blockchain.com",
        title: `Bitcoin network difficulty: ${mining.difficulty.toExponential(2)}`,
        description: `Current mining difficulty level. Higher difficulty reduces profitability and may shift GPU demand toward AI workloads.`,
        link: "https://www.blockchain.com/charts/difficulty",
      });
    }

    // News items
    news.slice(0, 5).forEach((article) => {
      items.push({
        id: `news-${idCounter++}`,
        timestamp: new Date(article.publishedAt).toLocaleString(),
        category: "Industry",
        impact: "Medium",
        source: article.source.name,
        title: article.title,
        description: truncateDescription(article.description || "Latest industry news affecting datacenter demand."),
        link: article.url,
        image: article.urlToImage,
      });
    });

    // Shuffle items to mix categories instead of grouping
    const shuffleArray = (array: FeedItem[]) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const shuffledItems = shuffleArray(items);

    setFeedItems(shuffledItems);
  };

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);

    const [models, crypto, repos, news, mining] = await Promise.all([
      fetchTrendingModels(),
      fetchCryptoPrices(),
      fetchTrendingRepos(),
      fetchAINews(),
      fetchMiningData(),
    ]);

    await fetchCryptoPriceHistory();

    generateFeedItems(models, repos, news, crypto, mining);

    setLastUpdated(new Date());
    setLoading(false);
  };

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, [newsApiKey, githubToken]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAllData();
    }, 60000); // Refresh every 60 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, newsApiKey, githubToken]);

  // Helper functions
  const getStatusColor = (active: boolean) => active ? "text-lime-400" : "text-red-400";
  const getStatusIcon = (active: boolean) => active ? Check : X;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "AI": return "bg-lime-500/20 text-lime-400 border-lime-500/50";
      case "Crypto": return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "Industry": return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "High": return "text-red-400";
      case "Medium": return "text-yellow-400";
      case "Low": return "text-lime-400";
      default: return "text-gray-400";
    }
  };

  const calculateAIActivity = () => {
    const count = trendingModels.length;
    if (count > 15) return { status: "High Activity", color: "text-lime-400" };
    if (count > 5) return { status: "Moderate Activity", color: "text-yellow-400" };
    return { status: "Low Activity", color: "text-gray-400" };
  };

  const calculateCryptoActivity = () => {
    const btcChange = cryptoPrices.bitcoin?.usd_24h_change || 0;
    if (Math.abs(btcChange) > 5) return { status: "High Volatility", color: "text-red-400" };
    if (Math.abs(btcChange) > 2) return { status: "Moderate Activity", color: "text-yellow-400" };
    return { status: "Stable", color: "text-lime-400" };
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-lime-400">Demand Intelligence</h1>
          <p className="text-gray-400 mt-1">Real-time datacenter market intelligence</p>
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Auto-refresh</span>
          </label>

          <button
            onClick={fetchAllData}
            disabled={loading}
            className="px-4 py-2 bg-lime-500 hover:bg-lime-600 text-gray-900 font-semibold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6 p-6 bg-gray-800 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-lime-400">API Configuration</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                NewsAPI Key <span className="text-gray-500">(100 free requests/day)</span>
              </label>
              <input
                type="password"
                value={newsApiKey}
                onChange={(e) => setNewsApiKey(e.target.value)}
                placeholder="Enter your NewsAPI key"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-lime-400"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your free key at <a href="https://newsapi.org" target="_blank" className="text-lime-400 hover:underline">newsapi.org</a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                GitHub Token <span className="text-gray-500">(increases rate limit to 5000/hr)</span>
              </label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="Enter your GitHub personal access token"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-lime-400"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Create token at <a href="https://github.com/settings/tokens" target="_blank" className="text-lime-400 hover:underline">github.com/settings/tokens</a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Market Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* AI/ML Compute */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-lime-400" />
            <h3 className="text-lg font-bold">AI/ML Compute</h3>
          </div>

          {apiStatus.huggingface ? (
            <>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-400">Currently trending: <span className="text-white font-semibold">{trendingModels.length} models</span></p>
                <p className="text-sm text-gray-400">Top model: <span className="text-white">{trendingModels[0]?.modelId || "Loading..."}</span></p>
                <p className="text-sm text-gray-400">Downloads: <span className="text-white font-semibold">{trendingModels[0]?.downloads?.toLocaleString() || 0}</span></p>
              </div>

              <div className={`text-sm font-semibold ${calculateAIActivity().color}`}>
                Status: {calculateAIActivity().status}
              </div>
            </>
          ) : (
            <p className="text-red-400 text-sm">Unable to load AI activity data</p>
          )}
        </div>

        {/* Cloud Infrastructure */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold">Cloud Infrastructure</h3>
          </div>

          {apiStatus.github ? (
            <>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-400">Active AI projects: <span className="text-white font-semibold">{trendingRepos.length}</span></p>
                <p className="text-sm text-gray-400">Top project: <span className="text-white">{trendingRepos[0]?.name || "Loading..."}</span></p>
                <p className="text-sm text-gray-400">Stars: <span className="text-white font-semibold">{trendingRepos[0]?.stargazers_count?.toLocaleString() || 0}</span></p>
              </div>

              <div className="text-sm font-semibold text-lime-400">
                Status: Developer Interest High
              </div>
            </>
          ) : (
            <p className="text-red-400 text-sm">Unable to load developer activity data</p>
          )}
        </div>

        {/* Crypto Mining */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-bold">Crypto Mining</h3>
          </div>

          {apiStatus.coingecko ? (
            <>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-400">
                  Bitcoin: <span className="text-white font-semibold">${cryptoPrices.bitcoin?.usd?.toLocaleString()}</span>
                  <span className={`ml-2 ${cryptoPrices.bitcoin?.usd_24h_change >= 0 ? "text-lime-400" : "text-red-400"}`}>
                    ({cryptoPrices.bitcoin?.usd_24h_change > 0 ? "+" : ""}{cryptoPrices.bitcoin?.usd_24h_change?.toFixed(2)}%)
                  </span>
                </p>
                <p className="text-sm text-gray-400">
                  Ethereum: <span className="text-white font-semibold">${cryptoPrices.ethereum?.usd?.toLocaleString()}</span>
                  <span className={`ml-2 ${cryptoPrices.ethereum?.usd_24h_change >= 0 ? "text-lime-400" : "text-red-400"}`}>
                    ({cryptoPrices.ethereum?.usd_24h_change > 0 ? "+" : ""}{cryptoPrices.ethereum?.usd_24h_change?.toFixed(2)}%)
                  </span>
                </p>
                {apiStatus.blockchain && (
                  <p className="text-sm text-gray-400">Difficulty: <span className="text-white">{miningData.difficulty.toExponential(2)}</span></p>
                )}
              </div>

              <div className={`text-sm font-semibold ${calculateCryptoActivity().color}`}>
                Status: {calculateCryptoActivity().status}
              </div>
            </>
          ) : (
            <p className="text-red-400 text-sm">Unable to load crypto market data</p>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* News Feed - Main Content (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-lime-400">Live Intelligence Feed</h2>

          {loading && feedItems.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-gray-800 p-4 rounded-lg border border-gray-700 animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {feedItems.map((item) => (
                <div key={item.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-lime-500/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded border ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                      <span className={`text-xs font-semibold ${getImpactColor(item.impact)}`}>
                        {item.impact} Impact
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{item.timestamp}</span>
                  </div>

                  <div className="flex gap-4">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}

                    <div className="flex-1">
                      <div className="mb-2">
                        <p className="text-sm text-gray-400 mb-1">Source: {item.source}</p>
                        <h3 className="font-semibold text-white">{item.title}</h3>
                      </div>

                      <p className="text-sm text-gray-400 mb-3">{item.description}</p>

                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lime-400 hover:text-lime-300 text-sm flex items-center gap-1 transition-colors"
                      >
                        View details <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Charts Section */}
          <div className="space-y-6 mt-8">
            <h2 className="text-2xl font-bold text-lime-400">Market Trends</h2>

            {/* Bitcoin Price Chart */}
            {cryptoPriceData.length > 0 && (
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-bold mb-4">Bitcoin Price (7-Day)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={cryptoPriceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="timestamp" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }}
                      labelStyle={{ color: "#F3F4F6" }}
                    />
                    <Line type="monotone" dataKey="price" stroke="#a3e635" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Trending Topics Sidebar (1/3 width - sticky) */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {/* Hot AI Models */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-lime-400">Hot AI Models</h3>
              <button onClick={fetchTrendingModels} className="text-gray-400 hover:text-lime-400 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {apiStatus.huggingface ? (
              <>
                <ol className="space-y-2 mb-4">
                  {trendingModels.slice(0, 5).map((model, index) => (
                    <li key={model.modelId} className="text-sm">
                      <a
                        href={`https://huggingface.co/${model.modelId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-lime-400 transition-colors"
                      >
                        {index + 1}. {model.modelId.split('/').pop()} ({model.downloads?.toLocaleString() || 0} downloads)
                      </a>
                    </li>
                  ))}
                </ol>
                <p className="text-xs text-gray-500">Updated: {lastUpdated.toLocaleTimeString()}</p>
              </>
            ) : (
              <p className="text-red-400 text-sm">Unable to load models</p>
            )}
          </div>

          {/* Crypto Market Movers */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-orange-400">Crypto Market Movers</h3>
              <button onClick={fetchCryptoPrices} className="text-gray-400 hover:text-orange-400 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {apiStatus.coingecko ? (
              <>
                <div className="space-y-2 mb-4">
                  {Object.entries(cryptoPrices).map(([coin, data]) => (
                    <div key={coin} className="flex justify-between items-center text-sm">
                      <span className="text-gray-300 capitalize">{coin}:</span>
                      <div className="text-right">
                        <span className="text-white font-semibold">${data.usd?.toLocaleString()}</span>
                        <span className={`ml-2 ${data.usd_24h_change >= 0 ? "text-lime-400" : "text-red-400"}`}>
                          ({data.usd_24h_change > 0 ? "+" : ""}{data.usd_24h_change?.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Updated: {lastUpdated.toLocaleTimeString()}</p>
              </>
            ) : (
              <p className="text-red-400 text-sm">Unable to load prices</p>
            )}
          </div>

          {/* GitHub Trending */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-blue-400">GitHub Trending</h3>
              <button onClick={fetchTrendingRepos} className="text-gray-400 hover:text-blue-400 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {apiStatus.github ? (
              <>
                <ol className="space-y-2 mb-4">
                  {trendingRepos.slice(0, 5).map((repo, index) => (
                    <li key={repo.full_name} className="text-sm">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-blue-400 transition-colors"
                      >
                        {index + 1}. {repo.name} ({repo.stargazers_count?.toLocaleString()} stars)
                      </a>
                    </li>
                  ))}
                </ol>
                <p className="text-xs text-gray-500">Updated: {lastUpdated.toLocaleTimeString()}</p>
              </>
            ) : (
              <p className="text-red-400 text-sm">Unable to load repos</p>
            )}
          </div>

          {/* API Status */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-bold mb-4">Data Sources Status</h3>

            <div className="space-y-2">
              {Object.entries(apiStatus).map(([api, status]) => {
                const Icon = getStatusIcon(status);
                return (
                  <div key={api} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300 capitalize">{api.replace("_", " ")}:</span>
                    <div className="flex items-center gap-2">
                      <span className={getStatusColor(status)}>
                        {status ? "Connected" : (api === "newsapi" && !newsApiKey) ? "API key required" : "Error"}
                      </span>
                      <Icon className={`w-4 h-4 ${getStatusColor(status)}`} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
