"use client";

import { useState, useRef } from "react";

interface Source { i: number; excerpt: string; }
interface AskResp {
  ok: boolean; reason?: string;
  answer?: string;
  sources?: Source[];
  elapsed_s?: number;
}

interface UploadResp {
  ok: boolean; reason?: string;
  doc_id?: string; filename?: string;
  pages?: number; chars?: number; chunks?: number;
  expires_at?: number | null;
  free_used?: number; free_limit?: number;
  used?: number; limit?: number;
}

const ACCEPTED = ".pdf,.docx,.txt,.md,.markdown";
const MAX_FREE_BYTES = 10 * 1024 * 1024;

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [doc, setDoc]   = useState<UploadResp | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AskResp | null>(null);
  const [err,  setErr]  = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function upload() {
    if (!file || busy) return;
    setErr(""); setDoc(null); setAnswer(null); setBusy(true);
    setProgress("Uploading + indexing…");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/docs/upload", {
        method: "POST", body: fd,
      });
      const d: UploadResp = await r.json();
      if (!d.ok) {
        if (d.reason === "quota_exceeded")
          setErr(`Free quota reached (${d.used}/${d.limit} pages this month). Upgrade →`);
        else if (d.reason === "too_many_pages")
          setErr(`Document is too long for the free tier. Upgrade for up to 1000 pages per file.`);
        else if (d.reason === "extract_failed")
          setErr(`Could not extract text. Supported: PDF, DOCX, TXT, MD.`);
        else setErr(`Upload failed: ${d.reason ?? "unknown"}`);
      } else {
        setDoc(d);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Network error");
    } finally { setBusy(false); setProgress(""); }
  }

  async function ask() {
    if (!doc?.doc_id || !question.trim() || busy) return;
    setErr(""); setAnswer(null); setBusy(true);
    setProgress("Asking Llama-3.1 (local)…");
    try {
      const r = await fetch("/api/docs/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_id: doc.doc_id, question: question.trim(),
        }),
      });
      const d: AskResp = await r.json();
      if (!d.ok) setErr(`Answer failed: ${d.reason ?? "unknown"}`);
      else setAnswer(d);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Network error");
    } finally { setBusy(false); setProgress(""); }
  }

  function pickFile(f: File | null) {
    setErr(""); setDoc(null); setAnswer(null);
    if (!f) { setFile(null); return; }
    if (f.size > MAX_FREE_BYTES) {
      setErr(`File too large (${(f.size/(1024*1024)).toFixed(1)} MB). Free tier max is 10 MB; Pro allows 100 MB.`);
      return;
    }
    setFile(f);
  }

  return (
    <main>
      <h1>ANANTA Docs</h1>
      <p>
        Upload any PDF, DOCX, or text document. Ask questions in
        natural language — get cited answers in seconds. Llama-3.1 +
        sentence embeddings run locally; your document never leaves
        our hardware.
      </p>

      <div style={{
          display: "flex", gap: 14, flexWrap: "wrap",
          marginBottom: 18, fontSize: 13, color: "#a9b0bd",
      }}>
        <span style={pill}>🔒 Local Llama-3.1 + embeddings — no cloud</span>
        <span style={pill}>📑 Cited answers — every claim links to source</span>
        <span style={pill}>✨ 50 free pages/month, no card</span>
      </div>

      {/* Upload */}
      <div style={{
          border: "2px dashed #1e242c", borderRadius: 14,
          padding: "32px 24px", textAlign: "center",
          background: file ? "#0f1722" : "#0a0e16",
          marginBottom: 16, cursor: "pointer",
      }} onClick={() => fileInputRef.current?.click()}>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED}
          style={{ display: "none" }}
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
        {file ? (
          <>
            <div style={{ fontSize: 17, color: "#fff", marginBottom: 6 }}>
              📎 {file.name}
            </div>
            <div style={{ fontSize: 13, color: "#a9b0bd" }}>
              {(file.size/(1024*1024)).toFixed(1)} MB ·
              click to swap
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 17, color: "#fff", marginBottom: 6 }}>
              Drop a document here
            </div>
            <div style={{ fontSize: 13, color: "#a9b0bd" }}>
              PDF · DOCX · TXT · MD ·
              up to 10 MB free, 100 MB Pro
            </div>
          </>
        )}
      </div>

      {!doc && (
        <button className="cta" onClick={upload}
                disabled={!file || busy}>
          {busy ? (progress || "Processing…") : "Index document"}
        </button>
      )}

      {doc && (
        <div style={{ marginTop: 14, padding: "16px 20px",
                       background: "#0a0e16",
                       border: "1px solid #1e242c",
                       borderRadius: 10, fontSize: 13,
                       color: "#a9b0bd" }}>
          ✓ Indexed <strong style={{color:"#fff"}}>{doc.filename}</strong>
          {" "}— {doc.pages} pages, {doc.chunks} chunks
          {doc.free_limit ? (
            <> · Free tier: {doc.free_used}/{doc.free_limit} pages used</>
          ) : null}
        </div>
      )}

      {/* Question */}
      {doc && (
        <div style={{ marginTop: 24 }}>
          <label htmlFor="q" style={{
              display: "block", marginBottom: 8,
              fontSize: 13, color: "#c8cedb",
              fontWeight: 500,
          }}><strong>Ask anything about this document</strong></label>
          <textarea
            id="q"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            placeholder="What does the document say about pricing? What are the key risks? Summarise section 3…"
            spellCheck={false}
          />
          <button className="cta" style={{ marginTop: 12 }}
                  onClick={ask}
                  disabled={!question.trim() || busy}>
            {busy ? progress || "Asking…" : "Get cited answer"}
          </button>
        </div>
      )}

      {err && <p className="err">{err}</p>}

      {answer?.ok && (
        <section className="output">
          <h2>Answer</h2>
          <div style={{
              background: "#0a0e16", border: "1px solid #1e242c",
              borderRadius: 10, padding: "20px 24px",
              fontSize: 16, lineHeight: 1.6, color: "#dde",
          }}>
            {answer.answer}
          </div>

          {answer.sources?.length ? (
            <details style={{ marginTop: 14 }}>
              <summary style={{ cursor: "pointer", color: "#a9b0bd",
                                 fontSize: 13, padding: "6px 0" }}>
                Show source excerpts ({answer.sources.length})
              </summary>
              <div style={{ marginTop: 8 }}>
                {answer.sources.map((s) => (
                  <div key={s.i} style={{
                      background: "#070a10",
                      border: "1px solid #1e242c",
                      borderLeft: "3px solid #FFB400",
                      borderRadius: 6,
                      padding: "12px 16px",
                      marginBottom: 8,
                      fontSize: 13, lineHeight: 1.55,
                      color: "#cfd5e0",
                  }}>
                    <div style={{ color: "#FFB400", fontWeight: 600,
                                   fontSize: 11, marginBottom: 6,
                                   letterSpacing: "0.06em",
                                   textTransform: "uppercase" }}>
                      Source [{s.i}]
                    </div>
                    {s.excerpt}…
                  </div>
                ))}
              </div>
            </details>
          ) : null}

          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 14 }}>
            Generated in {answer.elapsed_s}s by Llama-3.1 8B (local).
          </p>
        </section>
      )}

      <footer>
        <p>
          <strong>Privacy:</strong> your document is embedded with
          sentence-transformers and stored in a local ChromaDB on a
          Mac Mini M4 Pro. Free-tier docs are auto-deleted after 24h.
          Nothing is sent to OpenAI, Anthropic, Google, or AWS.
        </p>
        <p>
          Pricing: <a href="/pricing">Starter ₹299/mo · Pro ₹999/mo</a>
          {" "}— free tier: 50 pages/month, no card required.
        </p>
      </footer>
    </main>
  );
}

const pill: React.CSSProperties = {
  background:    "#0f1722",
  padding:       "6px 12px",
  borderRadius:  6,
  border:        "1px solid #1e242c",
};
