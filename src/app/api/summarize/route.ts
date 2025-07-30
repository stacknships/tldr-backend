import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  const prompt = `Summarize the following Terms of Service or Privacy Policy for a non-technical user.
Give a bullet-point summary, and also give a badge list if you detect:
- ? Sells Data
- ?? Auto-renews
- ?? Tracks user behavior
- ? No easy cancellation
- ? GDPR compliant
- ?? Keeps your data forever
- ?? Shares with third parties

TEXT:
${text}`;

  try {
    const completion = await openai.chat.completions.create({
		model: "gpt-3.5-turbo",   // ? changed here!
		messages: [{ role: "user", content: prompt }],
		temperature: 0.4,
	});

    const summary = completion.choices[0].message.content;
    return NextResponse.json({ summary }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (err) {
    console.error("OpenAI error:", err);  // <-- Move it here!
    return NextResponse.json({ error: "GPT error" }, { 
      status: 500, 
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  }
}

// CORS preflight support
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
