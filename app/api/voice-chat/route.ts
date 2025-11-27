import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { message, searchResults, conversationHistory } = await request.json();

        if (!process.env.TOGETHER_API_KEY) {
            return NextResponse.json(
                { error: 'Together API Key not configured' },
                { status: 500 }
            );
        }

        const openai = new OpenAI({
            apiKey: process.env.TOGETHER_API_KEY,
            baseURL: "https://api.together.xyz/v1",
        });

        // Build context-aware prompt
        const resultsContext = searchResults && searchResults.length > 0
            ? searchResults.map((r: any, i: number) =>
                `${i + 1}. ${r.title} - ${r.description}. Address: ${r.address}. Rating: ${r.rating}/5. Price: ${r.price || 'N/A'}`
            ).join('\n')
            : 'No search results available yet.';

        const historyContext = conversationHistory && conversationHistory.length > 0
            ? conversationHistory.join('\n')
            : '';

        const prompt = `You are a helpful local guide assistant having a natural conversation with a user about local recommendations.

Current search results:
${resultsContext}

${historyContext ? `Previous conversation:\n${historyContext}\n` : ''}
User: ${message}

Provide a natural, conversational response. Be concise (2-3 sentences max), friendly, and helpful. If asked about specific places from the results, reference them by name. If the user asks something not covered in the results, politely acknowledge that and suggest what you can help with based on the available information.`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
            temperature: 0.7,
            max_tokens: 150,
        });

        const reply = completion.choices[0].message.content || "I'm sorry, I didn't catch that. Could you ask again?";

        return NextResponse.json({ reply });

    } catch (error) {
        console.error('Voice Chat Error:', error);
        return NextResponse.json(
            { error: 'Failed to process conversation' },
            { status: 500 }
        );
    }
}
