import { NextResponse } from "next/server";

type TelegramRequestBody = {
  chatId: string;
  message: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TelegramRequestBody;
    const { chatId, message } = body;

    if (!chatId || !message) {
      return NextResponse.json(
        { error: "chatId and message are required" },
        { status: 400 }
      );
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "TELEGRAM_BOT_TOKEN is not configured" },
        { status: 500 }
      );
    }

    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;

    const res = await fetch(telegramUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true
      })
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Telegram API error: ${text}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, telegram: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

