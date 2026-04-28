import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSeoPage, listSeoPages } from "@/lib/seo";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const pages = await listSeoPages();
  return pages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await params;
  const page = await getSeoPage(slug);
  if (!page) return { title: "Not found" };
  return {
    title: `${page.h1} — ATS Resume Tailor`,
    description: page.intro,
    openGraph: {
      title: page.h1,
      description: page.intro,
    },
    alternates: { canonical: `/seo/${page.slug}` },
  };
}

export default async function SeoPage(
  { params }: { params: Promise<Params> },
) {
  const { slug } = await params;
  const page = await getSeoPage(slug);
  if (!page) notFound();

  return (
    <main style={{ maxWidth: 780, margin: "0 auto", padding: "48px 24px" }}>
      <p style={{ color: "#666", fontSize: 14 }}>
        <Link href="/">{"ATS Resume Tailor"}</Link> · Guide
      </p>
      <h1 style={{ fontSize: 40, letterSpacing: "-0.02em" }}>{page.h1}</h1>
      <p style={{ fontSize: 18, color: "#333" }}>{page.intro}</p>

      {page.sections.map((s, i) => (
        <section key={i} style={{ marginTop: 32 }}>
          <h2>{s.h2}</h2>
          <p>{s.body}</p>
        </section>
      ))}

      <section style={{ marginTop: 48 }}>
        <h2>FAQ</h2>
        {page.faq.map((f, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <strong>{f.q}</strong>
            <p>{f.a}</p>
          </div>
        ))}
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: page.faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />

      <div style={{ marginTop: 48, padding: 24, background: "#f4f6fb",
                     borderRadius: 12 }}>
        <h3 style={{ marginTop: 0 }}>
          Try {"ATS Resume Tailor"} free
        </h3>
        <p>{"Paste your resume and a job description. Get back an ATS-optimized, section-by-section tailored resume in under 10 seconds. Local-LLM"}</p>
        <Link href="/pricing"
              style={{ display: "inline-block", marginTop: 12, padding: "10px 18px",
                        background: "#0b1021", color: "#fff", borderRadius: 8,
                        textDecoration: "none" }}>
          {"Get started"}
        </Link>
      </div>
    </main>
  );
}
