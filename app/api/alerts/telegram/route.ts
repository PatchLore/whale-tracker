import { NextResponse } from "next/server";

type TelegramRequestBody = {
  chatId: string;
  message: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TelegramRequestBody;
    const { chatId, message } = body;

    console.log(
      "[telegram route] received body:",
      JSON.stringify(body)
    );
    console.log("[telegram route] chatId:", chatId);
    console.log(
      "[telegram route] message length:",
      message?.length
    );

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

    const telegramRes = await fetch(telegramUrl, {
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

    const telegramJson = await telegramRes.json();
    console.log(
      "[telegram route] telegram response:",
      JSON.stringify(telegramJson)
    );

    if (!telegramRes.ok) {
      return NextResponse.json(
        { error: `Telegram API error: ${JSON.stringify(telegramJson)}` },
        { status: telegramRes.status }
      );
    }

    return NextResponse.json({ ok: true, telegram: telegramJson });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

