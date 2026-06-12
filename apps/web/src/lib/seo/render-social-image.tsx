import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const socialImageSize = {
  width: 1200,
  height: 630,
};

export const socialImageContentType = "image/png";

export const socialImageAlt =
  "ForgeRep — evidence-based fitness that keeps you accountable";

const pills = ["Works offline", "Evidence-based", "Free to start"] as const;

async function loadFonts() {
  const [bold, extraBold] = await Promise.all([
    readFile(
      join(process.cwd(), "src/assets/fonts/PlusJakartaSans-Bold.ttf")
    ),
    readFile(
      join(process.cwd(), "src/assets/fonts/PlusJakartaSans-ExtraBold.ttf")
    ),
  ]);

  return [
    {
      name: "Plus Jakarta Sans",
      data: bold,
      weight: 700 as const,
      style: "normal" as const,
    },
    {
      name: "Plus Jakarta Sans",
      data: extraBold,
      weight: 800 as const,
      style: "normal" as const,
    },
  ];
}

async function loadLogoIconSrc(): Promise<string | null> {
  try {
    const iconSvg = await readFile(
      join(process.cwd(), "public/logo-icon.svg"),
      "utf8"
    );
    return `data:image/svg+xml;base64,${Buffer.from(iconSvg).toString("base64")}`;
  } catch {
    return null;
  }
}

export async function renderSocialImage() {
  const [fonts, logoSrc] = await Promise.all([loadFonts(), loadLogoIconSrc()]);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          backgroundColor: "#1c1917",
          padding: "56px 72px",
          fontFamily: "Plus Jakarta Sans",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -80,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,140,66,0.5) 0%, rgba(255,107,53,0) 68%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -160,
            right: -60,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(251,191,36,0.28) 0%, rgba(251,191,36,0) 70%)",
          }}
        />

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            gap: 48,
            position: "relative",
          }}
        >
          {logoSrc ? (
            <img
              src={logoSrc}
              alt=""
              width={176}
              height={176}
              style={{
                borderRadius: 36,
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 176,
                height: 176,
                borderRadius: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #ff6b35 0%, #fbbf24 100%)",
                color: "#ffffff",
                fontSize: 96,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              F
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: 58,
                fontWeight: 800,
                color: "#fafaf9",
                letterSpacing: "-0.02em",
              }}
            >
              ForgeRep
            </div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 700,
                color: "#fafaf9",
                lineHeight: 1.25,
                maxWidth: 760,
              }}
            >
              Evidence-based fitness that keeps you accountable
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#a8a29e",
                lineHeight: 1.4,
                maxWidth: 720,
              }}
            >
              Personalized programs · Macro tracking · Works offline in the gym
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 14,
            position: "relative",
          }}
        >
          {pills.map((pill) => (
            <div
              key={pill}
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(41,37,36,0.85)",
                color: "#fafaf9",
                fontSize: 18,
                fontWeight: 700,
                padding: "10px 20px",
              }}
            >
              {pill}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...socialImageSize,
      fonts,
    }
  );
}
