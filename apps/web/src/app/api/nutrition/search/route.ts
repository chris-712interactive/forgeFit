import { searchFoods } from "@forgefit/nutrition-core";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const usdaApiKey = process.env.USDA_FDC_API_KEY;
  const source = searchParams.get("source");
  const offOnly = source === "off";
  const results = await searchFoods(query, { usdaApiKey, offOnly });

  return NextResponse.json({
    results,
    sources: {
      usda: Boolean(usdaApiKey) && !offOnly,
      openFoodFacts: true,
    },
  });
}
