import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const SITE_URL = "https://docs.anantatrade.com";
const TITLE    = "ANANTA Docs — Privacy-first document Q&A (local Llama-3.1 + RAG)";
const DESC     = "Upload any PDF, DOCX, or text. Ask questions in natural language — get cited answers in seconds. Llama-3.1 + sentence embeddings run locally; your document never leaves our hardware.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title:       TITLE,
  description: DESC,
  applicationName: "ANANTA Docs",
  authors: [{ name: "ANANTA Trade" }],
  keywords: [
    "document Q&A AI", "PDF chat private", "Humata alternative",
    "Chatpdf alternative", "local LLM document",
    "private document analysis", "self-hosted RAG",
    "PDF question answering", "ask PDF AI", "document AI India",
  ],
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true,
    googleBot: { index: true, follow: true,
      "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: { type: "website", url: SITE_URL,
    siteName: "ANANTA Docs", title: TITLE, description: DESC,
    locale: "en_US" },
  twitter: { card: "summary_large_image", title: TITLE,
    description: DESC, creator: "@anantahome" },
  icons: { icon: [{ url: "/favicon.ico" }],
    apple: [{ url: "/apple-touch-icon.png" }] },
};
export const viewport: Viewport = {
  themeColor: "#0a0e16", width: "device-width", initialScale: 1,
};
export default function RootLayout({ children }: { children: ReactNode }) {
  const orgLd = {
    "@context": "https://schema.org",
    "@type":    "SoftwareApplication",
    "name":     "ANANTA Docs",
    "applicationCategory": "BusinessApplication",
    "operatingSystem":     "Web",
    "offers": [
      { "@type": "Offer", "price": "0", "priceCurrency": "INR",
        "name": "Free (50 pages/month)" },
      { "@type": "Offer", "price": "299", "priceCurrency": "INR",
        "name": "Starter (50 docs / 500 pages each)" },
      { "@type": "Offer", "price": "999", "priceCurrency": "INR",
        "name": "Pro (unlimited + retention)" },
    ],
    "url": SITE_URL,
    "publisher": { "@type": "Organization", "name": "ANANTA Trade",
      "url": "https://anantatrade.com" },
  };
  return (
    <html lang="en">
      <head>
        <script type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      </head>
      <body>
        {children}
        <footer style={{ maxWidth: 960, margin: "0 auto",
            padding: "24px 24px 64px",
            borderTop: "1px solid #1e242c",
            color: "#a9b0bd", fontSize: 13 }}>
          <nav style={{display: "flex", gap: 18, flexWrap: "wrap"}}>
            <a href="/" style={{color: "#a9b0bd"}}>Home</a>
            <a href="/pricing" style={{color: "#a9b0bd"}}>Pricing</a>
            <a href="/terms" style={{color: "#a9b0bd"}}>Terms</a>
            <a href="/privacy" style={{color: "#a9b0bd"}}>Privacy</a>
            <a href="/refunds" style={{color: "#a9b0bd"}}>Refunds</a>
            <a href="/contact" style={{color: "#a9b0bd"}}>Contact</a>
            <a href="https://app.anantatrade.com/?demo=1"
               style={{color: "#a9b0bd"}}>ATS Resume Tailor</a>
            <a href="https://ananta-notes-vineeths-projects-b4f5db3c.vercel.app/"
               style={{color: "#a9b0bd"}}>ANANTA Notes</a>
            <a href="https://anantatrade.com" style={{color: "#a9b0bd"}}>
              ANANTA Trade</a>
          </nav>
          <p style={{marginTop: 16, fontSize: 12}}>
            © 2026 ANANTA Trade. Operated from India.
          </p>
        </footer>
      </body>
    </html>
  );
}
