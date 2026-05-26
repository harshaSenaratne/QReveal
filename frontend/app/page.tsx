"use client";

import { useRef, useState } from "react";
import { ErrorMessage } from "@/components/error-message";
import { FileUpload } from "@/components/file-upload";
import { LoadingState } from "@/components/loading-state";
import { PrivacyNotice } from "@/components/privacy-notice";
import { ResultCard } from "@/components/result-card";
import { Button } from "@/components/ui/button";
import { extractQR } from "@/lib/api";
import type { QRExtractResult } from "@/lib/types";
import { validateQRImage } from "@/lib/validators";

const errorCopy: Record<string, string> = {
  NO_QR_FOUND:
    "No QR code was found in this file. Try a clearer image or crop around the QR code.",
  FILE_TOO_LARGE: "This file is too large. Please upload a file smaller than 10MB.",
  UNSUPPORTED_FILE_TYPE:
    "Unsupported file type. Please upload a PNG, JPG, or JPEG image.",
  EMPTY_FILE: "Please upload a non-empty PNG, JPG, or JPEG image.",
  NO_FILE: "Please choose a PNG, JPG, or JPEG image to upload.",
};

const serverError =
  "Something went wrong while extracting the QR code. Please try again.";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [results, setResults] = useState<QRExtractResult[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleFileSelect(file: File | null) {
    setResults([]);
    setError("");

    const validationError = validateQRImage(file);
    if (validationError) {
      setSelectedFile(null);
      setError(validationError);
      return;
    }

    if (!file) {
      return;
    }

    setSelectedFile(file);
    setIsLoading(true);

    try {
      const response = await extractQR(file);

      if (!response.success) {
        setError(errorCopy[response.error?.code ?? ""] ?? serverError);
        return;
      }

      if (response.results.length === 0) {
        setError(errorCopy.NO_QR_FOUND);
        return;
      }

      setResults(response.results);
    } catch {
      setError(serverError);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClear() {
    setSelectedFile(null);
    setResults([]);
    setError("");
    setIsLoading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 sm:px-8 lg:py-12">
        <section className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1fr)] lg:items-start">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase text-emerald-700">
                QReveal
              </p>
              <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
                Extract QR Codes Without a Camera
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
                Upload an image containing a QR code and instantly extract the
                hidden information. Your file is processed temporarily and never
                stored.
              </p>
            </div>

            <PrivacyNotice />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <FileUpload
              disabled={isLoading}
              inputRef={fileInputRef}
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
            />

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-5">
              <p className="min-w-0 truncate text-sm text-slate-600">
                {selectedFile ? selectedFile.name : "No file selected"}
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={handleClear}
                disabled={isLoading && !selectedFile}
              >
                Clear
              </Button>
            </div>
          </div>
        </section>

        <section
          className="mt-8 space-y-4"
          aria-live="polite"
          aria-atomic="false"
        >
          {isLoading ? <LoadingState /> : null}
          {error ? <ErrorMessage message={error} /> : null}
          {results.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2" aria-label="QR results">
              {results.map((result, index) => (
                <ResultCard key={`${result.format}-${index}`} result={result} />
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
