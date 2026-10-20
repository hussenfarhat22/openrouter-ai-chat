
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import { NextResponse } from "next/server";

const allowedModels = new Set([
  "openai/gpt-4o-mini",
  "anthropic/claude-haiku-5.5",
  "google/gemini-3.8-flash",
  "meta-llama/llama-3.3-70b-instruct",
  "mistralai/mistral-large-4-0",
]);

const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 12_000;

export async function POST(request: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "The OpenRouter API key is not configured." },
      { status: 500 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The request body must contain valid JSON." },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const model = "model" in body ? body.model : undefined;
  const messages = "messages" in body ? body.messages : undefined;

  if (typeof model !== "string" || !allowedModels.has(model)) {
    return NextResponse.json(
      { error: "The selected model is not supported." },
      { status: 400 }
    );
  }

  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > MAX_MESSAGES ||
    messages.some(
      (message: unknown) =>
        !message ||
        typeof message !== "object" ||
        !("role" in message) ||
        !("content" in message) ||
        !["user", "assistant"].includes(String(message.role)) ||
        typeof message.content !== "string" ||
        message.content.trim().length === 0 ||
        message.content.length > MAX_MESSAGE_LENGTH
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Please provide a valid conversation with 1–50 messages. Each message must contain 1–12,000 characters.",
      },
      { status: 400 }
    );
  }

  try {
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const result = streamText({
      model: openrouter(model),
      messages,
      maxOutputTokens: 1000,
      onError({ error }) {
        console.error("Chat stream error:", error);
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);

    return NextResponse.json(
      { error: "The chat request failed. Please try again." },
      { status: 500 }
    );
  }
}
