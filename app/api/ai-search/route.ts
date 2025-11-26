import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Force dynamic rendering - don't try to pre-render this route at build time
export const dynamic = 'force-dynamic';



export async function POST(request: Request) {
    try {
        const { query, location } = await request.json();

        const city = location?.city || 'Unknown City';
        const country = location?.country || 'Unknown Country';

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

        const prompt = `
      You are a local guide assistant.
      User Location: ${city}, ${country}
      User Query: "${query}"

      Task:
      1. Find 3 real or realistic recommendations for the query in this location.
      2. Provide a title, description (1 sentence), address (street name is enough), and a rating (4.0-5.0).
      3. Provide a price range ($, $$, $$$).
      4. List 2-3 short pros and 1-2 short cons for each place.
      5. Write a short summary paragraph (2-3 sentences) explaining the top choice.

      Return ONLY valid JSON in this format:
      {
        "results": [
          { 
            "title": "...", 
            "description": "...", 
            "address": "...", 
            "rating": 4.5,
            "price": "$$",
            "pros": ["...", "..."],
            "cons": ["..."]
          }
        ],
        "summary": "..."
      }
    `;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "moonshotai/Kimi-K2-Instruct-0905",
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) {
            throw new Error('No content received from AI');
        }

        const data = JSON.parse(content);

        return NextResponse.json({
            results: data.results,
            summary: data.summary,
            ai_context: ``
        });

    } catch (error) {
        console.error('AI Search Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate recommendations' },
            { status: 500 }
        );
    }
}
