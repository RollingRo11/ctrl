const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Configure multer for audio file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// GET /api/voice/voices
// Fetch available voices from ElevenLabs
router.get('/voices', async (req, res) => {
  try {
    if (!ELEVENLABS_API_KEY) {
      // Return default voices if no API key
      return res.json({
        success: true,
        voices: [
          { voice_id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", category: "premade", description: "Calm, clear female voice" },
          { voice_id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", category: "premade", description: "Soft, gentle female voice" },
          { voice_id: "ErXwobaYiN019PkySvjV", name: "Antoni", category: "premade", description: "Warm, friendly male voice" },
          { voice_id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", category: "premade", description: "Young, energetic female voice" },
          { voice_id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", category: "premade", description: "Deep, professional male voice" },
          { voice_id: "VR6AewLTigWG4xSOukaG", name: "Arnold", category: "premade", description: "Strong, authoritative male voice" },
          { voice_id: "pNInz6obpgDQGcFmaJgB", name: "Adam", category: "premade", description: "Natural, conversational male voice" },
          { voice_id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", category: "premade", description: "Confident, clear male voice" },
        ]
      });
    }

    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();

    res.json({
      success: true,
      voices: data.voices || [],
    });
  } catch (error) {
    console.error('Error fetching voices:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/voice/text-to-speech
// Generate speech from text using ElevenLabs
router.post('/text-to-speech', async (req, res) => {
  try {
    const {
      text,
      voiceId = '21m00Tcm4TlvDq8ikWAM', // Default to Rachel
      stability = 0.5,
      similarityBoost = 0.75,
      style = 0.0,
      model = 'eleven_monolingual_v1'
    } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text is required',
      });
    }

    if (!ELEVENLABS_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'ElevenLabs API key not configured. Please set ELEVENLABS_API_KEY in .env file.',
      });
    }

    console.log(`🎙️ Generating speech with voice ${voiceId}...`);
    console.log(`📝 Text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: model,
          voice_settings: {
            stability: parseFloat(stability),
            similarity_boost: parseFloat(similarityBoost),
            style: parseFloat(style),
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('ElevenLabs API error:', response.status, errorData);
      throw new Error(errorData.detail?.message || `ElevenLabs API error: ${response.status}`);
    }

    // Stream the audio response
    const audioBuffer = await response.arrayBuffer();

    console.log(`✅ Speech generated successfully (${audioBuffer.byteLength} bytes)`);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength);
    res.send(Buffer.from(audioBuffer));

  } catch (error) {
    console.error('❌ Error generating speech:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate speech',
    });
  }
});

// GET /api/voice/models
// Get available ElevenLabs models
router.get('/models', async (req, res) => {
  try {
    if (!ELEVENLABS_API_KEY) {
      return res.json({
        success: true,
        models: [
          { model_id: 'eleven_monolingual_v1', name: 'Eleven Monolingual v1', description: 'High quality English model' },
          { model_id: 'eleven_multilingual_v1', name: 'Eleven Multilingual v1', description: 'Supports multiple languages' },
          { model_id: 'eleven_multilingual_v2', name: 'Eleven Multilingual v2', description: 'Latest multilingual model' },
        ]
      });
    }

    const response = await fetch(`${ELEVENLABS_API_URL}/models`, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();

    res.json({
      success: true,
      models: data || [],
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/voice/usage
// Get API usage statistics (if available)
router.get('/usage', async (req, res) => {
  try {
    if (!ELEVENLABS_API_KEY) {
      return res.json({
        success: true,
        usage: {
          character_count: 0,
          character_limit: 10000,
          can_extend_character_limit: false,
          simulated: true
        }
      });
    }

    const response = await fetch(`${ELEVENLABS_API_URL}/user/subscription`, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();

    res.json({
      success: true,
      usage: data,
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/voice/stream
// Stream speech generation (for longer texts)
router.post('/stream', async (req, res) => {
  try {
    const {
      text,
      voiceId = '21m00Tcm4TlvDq8ikWAM',
      stability = 0.5,
      similarityBoost = 0.75,
      model = 'eleven_monolingual_v1'
    } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text is required',
      });
    }

    if (!ELEVENLABS_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'ElevenLabs API key not configured',
      });
    }

    console.log(`🎙️ Streaming speech with voice ${voiceId}...`);

    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: model,
          voice_settings: {
            stability: parseFloat(stability),
            similarity_boost: parseFloat(similarityBoost),
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail?.message || `ElevenLabs API error: ${response.status}`);
    }

    // Stream the response directly to the client
    res.setHeader('Content-Type', 'audio/mpeg');
    response.body.pipe(res);

    console.log(`✅ Speech streaming started`);

  } catch (error) {
    console.error('❌ Error streaming speech:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to stream speech',
    });
  }
});

// POST /api/voice/analyze-portfolio
// Generate AI insights about investment portfolio
router.post('/analyze-portfolio', async (req, res) => {
  try {
    const { investments } = req.body;

    if (!investments || investments.length === 0) {
      return res.json({
        success: true,
        insights: {
          summary: "You haven't made any investments yet. Start by exploring the Marketplace to find GPU datacenter projects!",
          keyPoints: [
            "No active investments",
            "Starting balance available",
            "Browse marketplace for opportunities"
          ]
        }
      });
    }

    console.log(`🤖 Analyzing portfolio with ${investments.length} investments...`);

    // Calculate portfolio metrics
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalCurrentValue = investments.reduce((sum, inv) => sum + (inv.currentValue || inv.amount), 0);
    const totalReturn = totalCurrentValue - totalInvested;
    const returnPercentage = ((totalReturn / totalInvested) * 100).toFixed(2);

    const bestPerformer = investments.reduce((best, inv) => {
      const invReturn = ((inv.currentValue - inv.amount) / inv.amount) * 100;
      const bestReturn = ((best.currentValue - best.amount) / best.amount) * 100;
      return invReturn > bestReturn ? inv : best;
    });

    const worstPerformer = investments.reduce((worst, inv) => {
      const invReturn = ((inv.currentValue - inv.amount) / inv.amount) * 100;
      const worstReturn = ((worst.currentValue - worst.amount) / worst.amount) * 100;
      return invReturn < worstReturn ? inv : worst;
    });

    const prompt = `You are an expert financial advisor analyzing a GPU datacenter investment portfolio.

Portfolio Data:
- Total Investments: ${investments.length}
- Total Invested: $${totalInvested.toLocaleString()}
- Current Value: $${totalCurrentValue.toLocaleString()}
- Total Return: $${totalReturn.toLocaleString()} (${returnPercentage}%)
- Best Performer: ${bestPerformer.projectName} at ${((bestPerformer.currentValue - bestPerformer.amount) / bestPerformer.amount * 100).toFixed(2)}% return
- Worst Performer: ${worstPerformer.projectName} at ${((worstPerformer.currentValue - worstPerformer.amount) / worstPerformer.amount * 100).toFixed(2)}% return

Individual Investments:
${investments.map(inv => `- ${inv.projectName}: $${inv.amount.toLocaleString()} invested, current value $${inv.currentValue.toLocaleString()}, ${inv.expectedAPY}% APY, located in ${inv.location}`).join('\n')}

Provide a concise, professional analysis in 3-4 sentences covering:
1. Overall portfolio performance assessment
2. Key strengths or concerns
3. One actionable recommendation

Keep it natural and conversational, suitable for voice narration. Do not use bullet points or special formatting.`;

    if (process.env.GEMINI_API_KEY) {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const analysis = result.response.text();

      res.json({
        success: true,
        insights: {
          summary: analysis,
          metrics: {
            totalInvested,
            totalCurrentValue,
            totalReturn,
            returnPercentage: parseFloat(returnPercentage),
            investmentCount: investments.length
          },
          topPerformer: {
            name: bestPerformer.projectName,
            return: ((bestPerformer.currentValue - bestPerformer.amount) / bestPerformer.amount * 100).toFixed(2)
          }
        }
      });
    } else {
      // Fallback without Gemini
      res.json({
        success: true,
        insights: {
          summary: `Your portfolio consists of ${investments.length} investments with a total value of $${totalCurrentValue.toLocaleString()}. You've invested $${totalInvested.toLocaleString()} and currently have a return of ${returnPercentage}%. Your best performing asset is ${bestPerformer.projectName} with ${((bestPerformer.currentValue - bestPerformer.amount) / bestPerformer.amount * 100).toFixed(2)}% gains. Consider diversifying across different geographic locations to reduce risk.`,
          metrics: {
            totalInvested,
            totalCurrentValue,
            totalReturn,
            returnPercentage: parseFloat(returnPercentage),
            investmentCount: investments.length
          }
        }
      });
    }
  } catch (error) {
    console.error('Error analyzing portfolio:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/voice/ask-question
// Answer questions about the portfolio using AI
router.post('/ask-question', async (req, res) => {
  try {
    const { question, investments, context } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }

    console.log(`🤖 Answering question: "${question}"`);

    const portfolioContext = investments && investments.length > 0 ? `
Portfolio Context:
- Total Investments: ${investments.length}
- Total Invested: $${investments.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
- Investments: ${investments.map(inv => `${inv.projectName} ($${inv.amount.toLocaleString()}, ${inv.expectedAPY}% APY)`).join(', ')}
` : 'No investments yet.';

    const prompt = `You are a helpful AI assistant for a GPU datacenter investment platform. Answer the user's question professionally and concisely.

${portfolioContext}

${context ? `Additional Context: ${context}` : ''}

User Question: ${question}

Provide a clear, conversational answer in 2-3 sentences. Be specific and actionable.`;

    if (process.env.GEMINI_API_KEY) {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const answer = result.response.text();

      res.json({
        success: true,
        answer,
        question
      });
    } else {
      // Fallback response
      res.json({
        success: true,
        answer: "I'd be happy to help! However, the AI service is currently unavailable. Please configure GEMINI_API_KEY in your environment to enable intelligent responses.",
        question
      });
    }
  } catch (error) {
    console.error('Error answering question:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/voice/market-briefing
// Generate a market briefing with GPU pricing trends
router.post('/market-briefing', async (req, res) => {
  try {
    const { gpuPricing, datacenters } = req.body;

    console.log(`🤖 Generating market briefing...`);

    const prompt = `You are a market analyst providing a brief update on the GPU datacenter market.

${gpuPricing ? `GPU Pricing Trends:
${JSON.stringify(gpuPricing.slice(0, 5), null, 2)}` : ''}

${datacenters ? `Active Datacenters: ${datacenters.length}` : ''}

Provide a concise 2-3 sentence market briefing suitable for voice narration. Focus on:
1. Current GPU pricing trends
2. Market demand
3. Investment opportunities

Keep it natural and conversational.`;

    if (process.env.GEMINI_API_KEY) {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const briefing = result.response.text();

      res.json({
        success: true,
        briefing
      });
    } else {
      res.json({
        success: true,
        briefing: "GPU prices are showing strong demand across H100 and A100 models. The market remains competitive with opportunities in emerging datacenter locations. Consider diversifying your portfolio across different GPU types and geographic regions."
      });
    }
  } catch (error) {
    console.error('Error generating briefing:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/voice/speech-to-text
// Convert speech to text using Google Speech-to-Text or Web Speech API fallback
router.post('/speech-to-text', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    console.log('🎤 Transcribing audio file:', req.file.filename);

    // Use Google Cloud Speech-to-Text if API key is configured
    if (process.env.GOOGLE_CLOUD_API_KEY) {
      const audioBuffer = fs.readFileSync(req.file.path);
      const audioBase64 = audioBuffer.toString('base64');

      const response = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.GOOGLE_CLOUD_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config: {
              encoding: 'WEBM_OPUS',
              sampleRateHertz: 48000,
              languageCode: 'en-US',
              enableAutomaticPunctuation: true,
            },
            audio: {
              content: audioBase64,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Google Speech API error: ${response.status}`);
      }

      const data = await response.json();
      const transcription = data.results?.[0]?.alternatives?.[0]?.transcript || '';

      // Clean up temp file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        text: transcription,
      });
    } else {
      // Fallback: Return a message to use Web Speech API on client side
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        text: 'Speech-to-text requires Google Cloud API key. Please configure GOOGLE_CLOUD_API_KEY in .env',
        fallback: true
      });
    }
  } catch (error) {
    console.error('Speech-to-text error:', error);

    // Clean up temp file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
