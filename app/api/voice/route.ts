// Market Oracle - Voice Briefing API (ElevenLabs)
// Generates audio market briefings using AI voice synthesis
// API: ElevenLabs Text-to-Speech

import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '3868d31e5a2d122b78864cb5de409d6ea6a0bed46ed39108b79d836848ff9ce8';
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

// Professional voices for market briefings
const VOICES = {
  professional: {
    id: '21m00Tcm4TlvDq8ikWAM', // Rachel - Clear, professional
    name: 'Rachel',
    style: 'Professional & Clear'
  },
  analyst: {
    id: 'AZnzlk1XvdvUeBnXmlld', // Domi - Confident analyst
    name: 'Domi',
    style: 'Confident Analyst'
  },
  narrator: {
    id: 'EXAVITQu4vr4xnSDxMaL', // Bella - Warm narrator
    name: 'Bella',
    style: 'Warm & Engaging'
  },
  broadcast: {
    id: 'ErXwobaYiN019PkySvjV', // Antoni - Broadcast style
    name: 'Antoni',
    style: 'Broadcast Quality'
  },
  executive: {
    id: 'VR6AewLTigWG4xSOukaG', // Arnold - Executive deep voice
    name: 'Arnold',
    style: 'Executive Authority'
  }
};

interface BriefingRequest {
  type: 'morning' | 'midday' | 'closing' | 'breaking' | 'custom';
  tickers?: string[];
  includeEconomic?: boolean;
  includeNews?: boolean;
  customText?: string;
  voice?: keyof typeof VOICES;
}

// Generate briefing text based on market data
async function generateBriefingText(request: BriefingRequest): Promise<string> {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    timeZoneName: 'short' 
  });
  const dateStr = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
  
  if (request.customText) {
    return request.customText;
  }
  
  let briefing = '';
  
  switch (request.type) {
    case 'morning':
      briefing = `Good morning. This is your Market Oracle briefing for ${dateStr}. Here's what you need to know before the market opens. `;
      break;
    case 'midday':
      briefing = `Good afternoon. This is your midday market update at ${timeStr}. `;
      break;
    case 'closing':
      briefing = `Market close summary for ${dateStr}. Here's how the day wrapped up. `;
      break;
    case 'breaking':
      briefing = `Breaking market alert. `;
      break;
    default:
      briefing = `Market Oracle update for ${timeStr}. `;
  }
  
  // Fetch real market data
  try {
    // Get market indices (simulated - would connect to real API)
    const mockMarketData = {
      sp500: { value: 6052.34, change: 0.45 },
      nasdaq: { value: 19832.15, change: 0.62 },
      dow: { value: 44287.50, change: 0.28 },
      vix: { value: 14.25, change: -5.2 }
    };
    
    briefing += `The S&P 500 is ${mockMarketData.sp500.change >= 0 ? 'up' : 'down'} ${Math.abs(mockMarketData.sp500.change).toFixed(2)} percent, `;
    briefing += `trading at ${mockMarketData.sp500.value.toLocaleString()}. `;
    briefing += `The Nasdaq is ${mockMarketData.nasdaq.change >= 0 ? 'higher' : 'lower'} by ${Math.abs(mockMarketData.nasdaq.change).toFixed(2)} percent. `;
    briefing += `The Dow Jones ${mockMarketData.dow.change >= 0 ? 'gained' : 'lost'} ${Math.abs(mockMarketData.dow.change).toFixed(2)} percent. `;
    
    // VIX commentary
    if (mockMarketData.vix.value < 15) {
      briefing += `Market volatility remains low, with the VIX at ${mockMarketData.vix.value}. `;
    } else if (mockMarketData.vix.value > 25) {
      briefing += `Elevated volatility detected. The VIX is at ${mockMarketData.vix.value}, signaling increased market uncertainty. `;
    }
    
    // Add ticker-specific updates if requested
    if (request.tickers && request.tickers.length > 0) {
      briefing += `Now for your watchlist. `;
      // Would fetch real data for each ticker
      for (const ticker of request.tickers.slice(0, 5)) {
        briefing += `${ticker} is showing movement. `;
      }
    }
    
    // Economic data if requested
    if (request.includeEconomic) {
      briefing += `On the economic front, traders are watching for upcoming Federal Reserve commentary and key employment data later this week. `;
    }
    
    // Sign off
    switch (request.type) {
      case 'morning':
        briefing += `Trade wisely and stay informed. This is Market Oracle.`;
        break;
      case 'closing':
        briefing += `See you tomorrow for the morning briefing. This is Market Oracle.`;
        break;
      default:
        briefing += `This is Market Oracle. Stay ahead of the market.`;
    }
    
  } catch (error) {
    console.error('Error generating briefing:', error);
    briefing += `Market data is currently being updated. Check back shortly for the latest information.`;
  }
  
  return briefing;
}

// Get available voices from ElevenLabs
async function getVoices() {
  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.voices;
  } catch (error) {
    console.error('Error fetching voices:', error);
    return null;
  }
}

// Generate speech using ElevenLabs
async function generateSpeech(text: string, voiceId: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs TTS error:', error);
      return null;
    }
    
    return await response.arrayBuffer();
  } catch (error) {
    console.error('Error generating speech:', error);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'voices';
  
  if (action === 'voices') {
    // Return available voices
    return NextResponse.json({
      success: true,
      availableVoices: Object.entries(VOICES).map(([key, voice]) => ({
        id: key,
        voiceId: voice.id,
        name: voice.name,
        style: voice.style
      })),
      briefingTypes: [
        { id: 'morning', name: 'Morning Briefing', description: 'Pre-market summary and outlook' },
        { id: 'midday', name: 'Midday Update', description: 'Lunchtime market check-in' },
        { id: 'closing', name: 'Closing Summary', description: 'End of day wrap-up' },
        { id: 'breaking', name: 'Breaking Alert', description: 'Urgent market news' },
        { id: 'custom', name: 'Custom Briefing', description: 'Your own text' }
      ]
    });
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    const body = await request.json() as BriefingRequest;
    
    const {
      type = 'morning',
      tickers = [],
      includeEconomic = true,
      includeNews = false,
      customText,
      voice = 'professional'
    } = body;
    
    // Generate the briefing text
    const briefingText = await generateBriefingText({
      type,
      tickers,
      includeEconomic,
      includeNews,
      customText,
      voice
    });
    
    // Get the voice ID
    const selectedVoice = VOICES[voice] || VOICES.professional;
    
    // Generate the audio
    const audioBuffer = await generateSpeech(briefingText, selectedVoice.id);
    
    if (!audioBuffer) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate audio',
        text: briefingText,
        processingTime: `${Date.now() - startTime}ms`
      }, { status: 500 });
    }
    
    // Convert to base64 for JSON response
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processingTime: `${Date.now() - startTime}ms`,
      briefing: {
        type,
        text: briefingText,
        characterCount: briefingText.length,
        voice: {
          id: voice,
          name: selectedVoice.name,
          style: selectedVoice.style
        }
      },
      audio: {
        format: 'mp3',
        base64: base64Audio,
        durationEstimate: `${Math.ceil(briefingText.length / 15)}s` // Rough estimate
      }
    });
    
  } catch (error) {
    console.error('Voice briefing error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate voice briefing',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
