# ElevenLabs Voice API Setup Guide

This guide will help you set up ElevenLabs Voice API integration for the Voice Studio feature.

## Prerequisites

- Node.js installed
- Backend server running
- ElevenLabs account (free tier available)

## Step 1: Get Your ElevenLabs API Key

1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Sign up for a free account or log in
3. Navigate to your profile settings
4. Go to the "API Keys" section
5. Copy your API key

### Free Tier Limits:
- 10,000 characters per month
- Access to all voices
- Commercial usage allowed

## Step 2: Configure Environment Variables

1. Open your `.env` file in the `backend` directory
2. Add your ElevenLabs API key:

```env
ELEVENLABS_API_KEY=your_api_key_here
```

Example:
```env
ELEVENLABS_API_KEY=sk_1234567890abcdef1234567890abcdef
```

## Step 3: Restart Backend Server

After adding the API key, restart your backend server:

```bash
cd backend
npm start
```

You should see:
```
🚀 Backend server running on http://localhost:3001
📊 GPU Pricing API: http://localhost:3001/api/gpu-pricing
🎙️ Voice API: http://localhost:3001/api/voice
```

## Step 4: Test the Integration

### Test Voice API:

1. Get available voices:
```bash
curl http://localhost:3001/api/voice/voices
```

2. Generate speech (using curl):
```bash
curl -X POST http://localhost:3001/api/voice/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test of the ElevenLabs voice API.",
    "voiceId": "21m00Tcm4TlvDq8ikWAM",
    "stability": 0.5,
    "similarityBoost": 0.75
  }' \
  --output test-audio.mp3
```

## Available API Endpoints

### GET `/api/voice/voices`
Get list of available voices

**Response:**
```json
{
  "success": true,
  "voices": [
    {
      "voice_id": "21m00Tcm4TlvDq8ikWAM",
      "name": "Rachel",
      "category": "premade",
      "description": "Calm, clear female voice"
    }
  ]
}
```

### POST `/api/voice/text-to-speech`
Generate speech from text

**Request Body:**
```json
{
  "text": "Your text here",
  "voiceId": "21m00Tcm4TlvDq8ikWAM",
  "stability": 0.5,
  "similarityBoost": 0.75,
  "style": 0.0
}
```

**Response:** Audio file (MP3)

### GET `/api/voice/models`
Get available AI models

### GET `/api/voice/usage`
Get current API usage statistics

### POST `/api/voice/stream`
Stream speech generation (for longer texts)

## Voice Settings Explained

### Stability (0.0 - 1.0)
- **Lower (0.0 - 0.4)**: More expressive and variable
- **Medium (0.5 - 0.7)**: Balanced
- **Higher (0.8 - 1.0)**: More stable and consistent

### Similarity Boost (0.0 - 1.0)
- **Lower (0.0 - 0.4)**: More creative variations
- **Medium (0.5 - 0.7)**: Balanced
- **Higher (0.8 - 1.0)**: More similar to original voice

### Style (0.0 - 1.0)
- **0.0**: Natural speaking style
- **1.0**: Exaggerated speaking style

## Default Voices Available

1. **Rachel** - Calm, clear female voice (ID: `21m00Tcm4TlvDq8ikWAM`)
2. **Bella** - Soft, gentle female voice (ID: `EXAVITQu4vr4xnSDxMaL`)
3. **Antoni** - Warm, friendly male voice (ID: `ErXwobaYiN019PkySvjV`)
4. **Elli** - Young, energetic female voice (ID: `MF3mGyEYCl7XYWbV9V6O`)
5. **Josh** - Deep, professional male voice (ID: `TxGEqnHWrfWFTfGW9XjX`)
6. **Arnold** - Strong, authoritative male voice (ID: `VR6AewLTigWG4xSOukaG`)
7. **Adam** - Natural, conversational male voice (ID: `pNInz6obpgDQGcFmaJgB`)
8. **Sam** - Confident, clear male voice (ID: `yoZ06aMxZJJ28mfd3POQ`)

## Using the Voice Studio Feature

1. Navigate to the "Voice" tab in your application
2. Enter text you want to convert to speech (max 5,000 characters)
3. Select a voice from the dropdown
4. Adjust voice settings (stability, similarity boost, style)
5. Click "Generate Speech"
6. Listen to the generated audio
7. Download or save clips to history

## Features

- **Real-time Audio Visualization**: See waveform while playing
- **Voice History**: Automatically saves last 50 generated clips
- **Multiple Voices**: Choose from 8+ different voices
- **Advanced Controls**: Fine-tune stability, similarity, and style
- **Download**: Save generated audio as MP3 files
- **Persistent Storage**: History saved in browser localStorage

## Troubleshooting

### Error: "ElevenLabs API key not configured"
- Make sure you've added `ELEVENLABS_API_KEY` to your `.env` file
- Restart the backend server after adding the key

### Error: "Failed to fetch voices"
- Check your internet connection
- Verify your API key is valid
- Check if you've exceeded your quota

### Error: "Failed to generate speech"
- Ensure text is not empty
- Check API key is valid
- Verify you haven't exceeded monthly character limit

### No Audio Playing
- Check browser audio permissions
- Ensure audio is not muted
- Try a different browser

## Rate Limits

**Free Tier:**
- 10,000 characters/month
- Rate limit: 2 requests/second

**Paid Tiers:**
- Higher character limits
- Faster processing
- Additional voices
- Commercial license

## Security Best Practices

1. Never commit your `.env` file to version control
2. Add `.env` to `.gitignore`
3. Use environment variables for API keys
4. Rotate API keys regularly
5. Monitor usage to prevent abuse

## Support

- ElevenLabs Documentation: https://docs.elevenlabs.io/
- ElevenLabs Discord: https://discord.gg/elevenlabs
- API Status: https://status.elevenlabs.io/

## Next Steps

- Explore voice cloning features (paid tier)
- Create custom voices
- Integrate with other features
- Add voice synthesis to chatbots
- Create audiobooks or podcasts
