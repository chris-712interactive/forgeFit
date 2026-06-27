import Script from "next/script";

const DEFAULT_MEASUREMENT_ID = "G-VDVFTLJ0NF";

function getMeasurementId(): string | null {
  const configured = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (configured === "false" || configured === "0") {
    return null;
  }

  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    return DEFAULT_MEASUREMENT_ID;
  }

  return null;
}

export function GoogleAnalytics() {
  const measurementId = getMeasurementId();

  if (!measurementId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}
