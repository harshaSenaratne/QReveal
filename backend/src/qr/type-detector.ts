import { QRResultType } from "./dto/extract-response.dto";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9][0-9\s().-]{6,}$/;
const digitPattern = /[0-9]/g;

export function detectQRValueType(value: string): QRResultType {
  const trimmed = value.trim();
  if (!trimmed) {
    return "unknown";
  }

  const lower = trimmed.toLowerCase();

  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    return "url";
  }

  if (lower.startsWith("mailto:") || emailPattern.test(trimmed)) {
    return "email";
  }

  if (lower.startsWith("tel:") || isPhone(trimmed)) {
    return "phone";
  }

  if (trimmed.startsWith("WIFI:")) {
    return "wifi";
  }

  return "text";
}

function isPhone(value: string): boolean {
  if (!phonePattern.test(value)) {
    return false;
  }

  return (value.match(digitPattern) ?? []).length >= 7;
}
