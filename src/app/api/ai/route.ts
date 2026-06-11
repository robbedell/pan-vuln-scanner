import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, systemMessage, baseURL, model, apiKey, disableStream } = body;

    if (!baseURL || !model || !prompt) {
      return NextResponse.json({ error: 'Missing required AI configuration parameters.' }, { status: 400 });
    }

    const openai = new OpenAI({
      baseURL: baseURL,
      apiKey: apiKey || 'sk-local', 
    });

    if (disableStream) {
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemMessage || 'You are an expert Palo Alto Networks security analyst.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
      });
      return NextResponse.json({ content: response.choices[0].message.content });
    }

    const stream = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemMessage || 'You are an expert Palo Alto Networks security analyst.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (e: any) {
          controller.error(e);
        }
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
      }
    });

  } catch (error: any) {
    console.error('AI Proxy Error:', error);
    return NextResponse.json({ error: error.message || 'AI generation failed.' }, { status: 500 });
  }
}
