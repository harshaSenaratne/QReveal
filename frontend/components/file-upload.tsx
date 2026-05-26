"use client";

import type { RefObject } from "react";

interface FileUploadProps {
  disabled?: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
}

export function FileUpload({
  disabled = false,
  inputRef,
  selectedFile,
  onFileSelect,
}: FileUploadProps) {
  function openPicker() {
    if (!disabled) {
      inputRef.current?.click();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  }

  return (
    <div className="space-y-3">
      <label
        id="upload-label"
        htmlFor="qr-file"
        className="block text-sm font-semibold text-slate-950"
      >
        Upload QR Image
      </label>

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-labelledby="upload-label"
        aria-describedby="upload-help"
        aria-disabled={disabled}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition hover:border-blue-500 hover:bg-blue-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
      >
        <input
          ref={inputRef}
          id="qr-file"
          name="file"
          type="file"
          accept="image/png,image/jpeg"
          disabled={disabled}
          className="sr-only"
          onChange={(event) => {
            onFileSelect(event.target.files?.[0] ?? null);
          }}
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white text-2xl text-blue-700 shadow-sm">
          +
        </div>
        <p className="mt-4 text-base font-medium text-slate-950">
          {selectedFile ? "Replace selected image" : "Choose an image"}
        </p>
        <p id="upload-help" className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
          Supported formats: PNG, JPG, JPEG. Maximum file size: 10MB.
        </p>
      </div>
    </div>
  );
}
