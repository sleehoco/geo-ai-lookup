import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { text } = await request.json();

        if (!process.env.ELEVENLABS_API_KEY) {
            return NextResponse.json(
                { error: 'ElevenLabs API key not configured' },
                { status: 500 }
            );
        }

        // Use ElevenLabs API directly
        // Common voice IDs: pNInz6obpgDQGcFmaJgB (Adam), EXAVITQu4vr4xnSDxMaL (Bella), 
        // ErXwobaYiN019PkySvjV (Antoni), MF3mGy4Cl7ztW0VnK3Xz (Elli), 
        // TxGEqnHWrfWFTfGW9XjX (Josh), VR6AewLTigWG4xSOukaG (Arnold), etc.
        // You can get all available voices from: https://api.elevenlabs.io/v1/voices
        const voiceId = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'; // Default to Adam if not set
        
        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': process.env.ELEVENLABS_API_KEY
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_turbo_v2',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                        style: 0.0,
                        use_speaker_boost: true
                    }
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('ElevenLabs API error:', errorText);
            return NextResponse.json(
                { error: 'Failed to generate speech', details: errorText },
                { status: response.status }
            );
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': buffer.length.toString(),
                'Cache-Control': 'no-cache'
            }
        });

    } catch (error) {
        console.error('Text-to-Speech Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to generate speech', details: errorMessage },
            { status: 500 }
        );
    }
}
