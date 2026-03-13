import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Transaction } from "@/types/supabase";

type PollRequestBody = {
  walletId: string;
  address: string;
  chain: string;
  threshold: number;
  userId: string;
};

type EtherscanTx = {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PollRequestBody;
    const { walletId, address, threshold, chain } = body;

    if (!walletId || !address) {
      return NextResponse.json(
        { error: "walletId and address are required" },
        { status: 400 }
      );
    }

    const etherscanKey = process.env.ETHERSCAN_API_KEY;
    if (!etherscanKey) {
      return NextResponse.json(
        { error: "ETHERSCAN_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Map app-level chain identifiers to Etherscan v2 chain IDs
    const normalizedChain = chain.toLowerCase();
    let chainId: number | null = null;
    if (normalizedChain === "ethereum" || normalizedChain === "eth") {
      chainId = 1;
    } else if (normalizedChain === "bsc" || normalizedChain === "binance-smart-chain") {
      chainId = 56;
    } else if (normalizedChain === "polygon" || normalizedChain === "matic") {
      chainId = 137;
    }

    if (chainId === null) {
      return NextResponse.json(
        { error: `Unsupported chain '${chain}' for Etherscan v2` },
        { status: 400 }
      );
    }

    // Etherscan v2 API format
    const url = new URL("https://api.etherscan.io/v2/api");
    url.searchParams.set("chainid", chainId.toString());
    url.searchParams.set("module", "account");
    url.searchParams.set("action", "txlist");
    url.searchParams.set("address", address);
    url.searchParams.set("startblock", "0");
    url.searchParams.set("endblock", "99999999");
    url.searchParams.set("sort", "desc");
    url.searchParams.set("apikey", etherscanKey);

    const etherscanRes = await fetch(url.toString());
    if (!etherscanRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from Etherscan" },
        { status: 502 }
      );
    }

    const etherscanJson = (await etherscanRes.json()) as {
      status: string;
      message: string;
      result: EtherscanTx[] | string;
    };

    if (etherscanJson.status !== "1" || !Array.isArray(etherscanJson.result)) {
      return NextResponse.json(
        { newTxns: 0, whaleAlerts: [], transactions: [] satisfies Transaction[] },
        { status: 200 }
      );
    }

    const txs = etherscanJson.result;

    const supabase = createServerSupabaseClient();

    // Fetch any existing hashes for this batch to avoid inserting duplicates.
    const hashes = txs.map(tx => tx.hash);
    const { data: existing, error: existingError } = await supabase
      .from("transactions")
      .select("hash")
      .in("hash", hashes);

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message },
        { status: 500 }
      );
    }

    const existingSet = new Set((existing ?? []).map(row => row.hash as string));

    const newRows = txs
      .filter(tx => !existingSet.has(tx.hash))
      .map(tx => {
        const ethValue = Number(tx.value) / 1e18;
        const isIncoming =
          tx.to &&
          address &&
          tx.to.toLowerCase() === address.toLowerCase();
        const direction: "incoming" | "outgoing" = isIncoming
          ? "incoming"
          : "outgoing";

        const isWhale = ethValue >= threshold;

        return {
          wallet_id: walletId,
          hash: tx.hash,
          direction,
          eth_value: ethValue,
          from_address: tx.from,
          to_address: tx.to,
          block_timestamp: Number(tx.timeStamp),
          is_whale: isWhale
        };
      });

    if (newRows.length === 0) {
      return NextResponse.json(
        { newTxns: 0, whaleAlerts: [], transactions: [] satisfies Transaction[] },
        { status: 200 }
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from("transactions")
      .insert(newRows)
      .select("*");

    if (insertError || !inserted) {
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to insert transactions" },
        { status: 500 }
      );
    }

    const insertedTxns = inserted as Transaction[];
    const whaleAlerts = insertedTxns.filter(t => t.is_whale);

    return NextResponse.json(
      {
        newTxns: insertedTxns.length,
        whaleAlerts,
        transactions: insertedTxns
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

