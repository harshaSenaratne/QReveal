"use client";

import { useState } from "react";
import type { QRExtractResult } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface ResultCardProps {
  result: QRExtractResult;
}

export function ResultCard({ result }: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    await navigator.clipboard.writeText(result.value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">
            {result.format}
          </p>
          <p className="mt-1 inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold uppercase text-blue-800">
            {result.type}
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={copyValue}
          aria-label="Copy extracted QR value"
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="mt-4 max-h-48 overflow-auto break-words rounded-md bg-slate-50 p-3 font-mono text-sm leading-6 text-slate-900">
        {result.value}
      </p>
    </article>
  );
}
