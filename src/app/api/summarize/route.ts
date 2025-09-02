import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

// Make sure Next.js doesn't try to prerender this at build time
export const dynamic = "force-dynamic"; // Next 13+/15
// (Optional) If you prefer Edge runtime, you can also add:
// export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing 'text' in body" }, { status: 400 });
    }

    // Prefer OpenRouter if configured, otherwise fall back to OpenAI
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;

    if (!openRouterKey && !openAiKey) {
      // Return at runtime instead of crashing the build
      return NextResponse.json(
        { error: "No API key configured. Set OPENROUTER_API_KEY or OPENAI_API_KEY." },
        { status: 500 }
      );
    }

    const useOpenRouter = Boolean(openRouterKey);
    const client = new OpenAI({
      apiKey: useOpenRouter ? openRouterKey! : openAiKey!,
      baseURL: useOpenRouter ? "https://openrouter.ai/api/v1" : undefined,
    });

    const prompt = `Summarize the following Terms of Service or Privacy Policy for a non-technical user.
Give a bullet-point summary, and also give a badge list if you detect:
- ❗ Sells Data
- 🔁 Auto-renews
- 🧵 Tracks user behavior
- ❌ No easy cancellation
- ✅ GDPR compliant
- 📅 Keeps your data forever
- 🤐 Shares with third parties

TEXT:
${text}`;

    const model = useOpenRouter ? "openai/gpt-3.5-turbo" : "gpt-3.5-turbo";

    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    const summary = completion.choices?.[0]?.message?.content ?? "No summary generated.";

    return NextResponse.json(
      { summary },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (err) {
    console.error("Summarize error:", err);
    return NextResponse.json(
      { error: "Summary failed" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }
}

// CORS preflight support
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
