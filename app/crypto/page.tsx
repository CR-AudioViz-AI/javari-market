// app/crypto/page.tsx
// Purpose: crypto predictions, when the contest covers crypto. Today it does not, and
//   the page says so instead of spinning forever.
// Date: 2026-09-12 (rebuilt)
//
// CR AudioViz AI, LLC · EIN 39-3646201
import { createClient } from "@supabase/supabase-js";
import { secretKey, supabaseUrl } from "@craudioviz/platform-sdk";
import { MarketNav } from "@/components/MarketNav";
import { MarketDisclaimer } from "@/components/MarketDisclaimer";
import { AssetClassNotice } from "@/components/AssetClassNotice";

export const dynamic = "force-dynamic";

export default async function CryptoPage() {
  const url = supabaseUrl();
  const key = secretKey();
  let count = 0;
  if (url && key) {
    const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { count: n } = await db.from("stock_picks").select("id", { count: "exact", head: true }).eq("asset_type", "crypto").not("javari_request_id", "is", null);
    count = n ?? 0;
  }
  return (
    <>
      <MarketNav current="/" />
      <main id="main" className="mx-auto max-w-5xl px-3 py-5 sm:px-4">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Crypto</h1>
        {count === 0 ? <AssetClassNotice assetClass="crypto" /> : (
          <p className="mt-4 text-sm text-gray-300">{count} crypto predictions recorded.</p>
        )}
      </main>
      <MarketDisclaimer />
    </>
  );
}
