import { NextResponse } from 'next/server';
import { ElevenLabsClient } from 'elevenlabs-js';

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

        const client = new ElevenLabsClient({
            apiKey: process.env.ELEVENLABS_API_KEY
        });

        // Generate speech using ElevenLabs
        const audioStream = await client.textToSpeech.convert("Rachel", {
            text: text,
            model_id: "eleven_turbo_v2"
        });

        // Convert stream to buffer
        const chunks: Uint8Array[] = [];
        for await (const chunk of audioStream) {
            chunks.push(chunk);
        }

        const buffer = Buffer.concat(chunks);

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': buffer.length.toString(),
                'Cache-Control': 'no-cache'
            }
        });

    } catch (error) {
        console.error('Text-to-Speech Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate speech' },
            { status: 500 }
        );
    }
}
