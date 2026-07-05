"use client";

import { Document, Page, pdfjs } from "react-pdf";

/* ═══════════════════════════════════════════════════════════════
   PDF VIEWER — dynamic-imported (ssr:false) by DocumentModal.
   react-pdf needs DOMMatrix/canvas, which only exist in the browser.
   ═══════════════════════════════════════════════════════════════ */

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  fileUrl: string;
  pageNumber: number;
  onLoadSuccess: (numPages: number) => void;
}

export default function PdfViewer({ fileUrl, pageNumber, onLoadSuccess }: PdfViewerProps) {
  return (
    <Document
      file={fileUrl}
      onLoadSuccess={({ numPages }) => onLoadSuccess(numPages)}
      loading={<StatusLabel text="Loading document…" />}
      error={<StatusLabel text="Failed to load document." tone="error" />}
    >
      <Page pageNumber={pageNumber} renderTextLayer={false} renderAnnotationLayer={false} className="mx-auto" />
    </Document>
  );
}

function StatusLabel({ text, tone = "muted" }: { text: string; tone?: "muted" | "error" }) {
  return (
    <div className={`flex h-full min-h-[400px] items-center justify-center text-sm ${tone === "error" ? "text-red-500" : "text-zinc-500"}`}>
      {text}
    </div>
  );
}
