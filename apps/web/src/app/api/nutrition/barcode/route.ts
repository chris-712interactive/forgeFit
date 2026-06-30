import { lookupOpenFoodFactsByBarcode } from "@forgefit/nutrition-core";
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
  const code = searchParams.get("code")?.trim() ?? "";

  if (!code) {
    return NextResponse.json({ error: "Enter a barcode." }, { status: 400 });
  }

  const food = await lookupOpenFoodFactsByBarcode(code);
  if (!food) {
    return NextResponse.json(
      { error: "Product not found. Try search or log macros manually." },
      { status: 404 }
    );
  }

  return NextResponse.json({ food });
}
