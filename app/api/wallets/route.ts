import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const validChains = ["ethereum", "bsc", "solana"] as const;

type WalletChain = (typeof validChains)[number];

type CreateWalletBody = {
  label?: string | null;
  address: string;
  chain: WalletChain;
  threshold: number;
};

type UpdateWalletBody = {
  id: string;
  threshold?: number;
  label?: string | null;
};

type DeleteWalletBody = {
  id: string;
};

function createSupabase(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });
  const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  return { supabase, response };
}

async function requireUserId(request: NextRequest) {
  const { supabase } = createSupabase(request);
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }
  return user.id;
}

export async function GET(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 }
    );
  }

  const userId = await requireUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { supabase } = createSupabase(request);
  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 }
    );
  }

  const userId = await requireUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as CreateWalletBody;
  const address = body.address?.trim();
  const label = body.label?.trim() || null;
  const chain = body.chain;
  const threshold = Number(body.threshold ?? 0);

  if (!address) {
    return NextResponse.json({ error: "Address is required." }, { status: 400 });
  }

  if (!validChains.includes(chain)) {
    return NextResponse.json({ error: "Unsupported chain." }, { status: 400 });
  }

  if (Number.isNaN(threshold) || threshold <= 0) {
    return NextResponse.json(
      { error: "Threshold must be a positive number." },
      { status: 400 }
    );
  }

  const { supabase } = createSupabase(request);
  const { data, error } = await supabase
    .from("wallets")
    .insert({
      user_id: userId,
      label,
      address,
      chain,
      threshold
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 }
    );
  }

  const userId = await requireUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as UpdateWalletBody;
  const id = body.id?.trim();

  if (!id) {
    return NextResponse.json({ error: "Wallet ID is required." }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {};
  if (body.threshold !== undefined) {
    const threshold = Number(body.threshold);
    if (Number.isNaN(threshold) || threshold <= 0) {
      return NextResponse.json(
        { error: "Threshold must be a positive number." },
        { status: 400 }
      );
    }
    updatePayload.threshold = threshold;
  }
  if (Object.prototype.hasOwnProperty.call(body, "label")) {
    updatePayload.label = body.label?.trim() || null;
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json(
      { error: "No update fields provided." },
      { status: 400 }
    );
  }

  const { supabase } = createSupabase(request);
  const { data, error } = await supabase
    .from("wallets")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 }
    );
  }

  const userId = await requireUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as DeleteWalletBody;
  const id = body.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "Wallet ID is required." }, { status: 400 });
  }

  const { supabase } = createSupabase(request);
  const { error } = await supabase.from("wallets").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
