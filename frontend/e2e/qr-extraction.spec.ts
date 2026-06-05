import { expect, test, type Page, type Route } from "@playwright/test";
import path from "node:path";

type QRType = "url" | "email" | "phone" | "wifi" | "text" | "unknown";

type ExtractResponse = {
  success: boolean;
  results: Array<{
    value: string;
    type: QRType;
    format: "QR_CODE";
  }>;
  error?: {
    code: string;
    message: string;
  };
};

const apiURL = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8787").replace(
  /\/$/,
  "",
);

const extractEndpoint = `${apiURL}/api/v1/qr/extract`;
const qrFixturePath = path.join(__dirname, "fixtures", "test.png");
const decodedURL = "https://example.com/qreveal";

const copy = {
  heading: "Extract QR Codes Without a Camera",
  subheading:
    "Upload an image containing a QR code and instantly extract the hidden information. Your file is processed temporarily and never stored.",
  supportedFiles: "Supported formats: PNG, JPG, JPEG. Maximum file size: 10MB.",
  loading: "Extracting QR information...",
  unsupportedFile:
    "Unsupported file type. Please upload a PNG, JPG, or JPEG image.",
  tooLarge: "This file is too large. Please upload a file smaller than 10MB.",
  noQRCode:
    "No QR code was found in this file. Try a clearer image or crop around the QR code.",
  serverError:
    "Something went wrong while extracting the QR code. Please try again.",
} as const;

const corsHeaders = {
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-origin": "*",
};

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });

  return { promise, resolve };
}

function successResponse(value = decodedURL): ExtractResponse {
  return {
    success: true,
    results: [{ format: "QR_CODE", type: "url", value }],
  };
}

function apiErrorResponse(code: string, message: string): ExtractResponse {
  return {
    success: false,
    results: [],
    error: { code, message },
  };
}

async function mockExtraction(
  page: Page,
  response: ExtractResponse,
  options: { status?: number; waitFor?: Promise<void> } = {},
) {
  let postCount = 0;

  await page.route(extractEndpoint, async (route) => {
    if (route.request().method() === "OPTIONS") {
      await fulfillPreflight(route);
      return;
    }

    postCount += 1;
    await options.waitFor;
    await route.fulfill({
      body: JSON.stringify(response),
      contentType: "application/json",
      headers: corsHeaders,
      status: options.status ?? 200,
    });
  });

  return {
    get postCount() {
      return postCount;
    },
  };
}

async function fulfillPreflight(route: Route) {
  await route.fulfill({ headers: corsHeaders, status: 204 });
}

function fileInput(page: Page) {
  return page.locator("#qr-file");
}

function visibleAlert(page: Page) {
  return page.getByRole("alert").filter({ hasText: /.+/ });
}

function uploadArea(page: Page) {
  return page
    .getByRole("button", { name: "Upload QR Image" })
    .filter({ hasText: "Choose an image" });
}

async function uploadFixture(page: Page) {
  await fileInput(page).setInputFiles(qrFixturePath);
}

async function openPageWithSuccessfulExtraction(page: Page, value = decodedURL) {
  await mockExtraction(page, successResponse(value));
  await page.goto("/");
  await uploadFixture(page);
  await expect(page.getByText(value)).toBeVisible();
}

test("extracts a QR code and renders the decoded result", async ({ page }) => {
  const consoleMessages: string[] = [];
  const extraction = deferred();

  page.on("console", (message) => {
    consoleMessages.push(message.text());
  });

  await mockExtraction(page, successResponse(), { waitFor: extraction.promise });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: copy.heading })).toBeVisible();
  await expect(page.getByText(copy.subheading)).toBeVisible();
  await expect(page.getByText("Upload QR Image")).toBeVisible();
  await expect(page.getByText(copy.supportedFiles)).toBeVisible();
  await expect(page.getByRole("region", { name: "Privacy notice" })).toContainText(
    "We do not store uploaded files.",
  );
  await expect(page.getByRole("region", { name: "Privacy notice" })).toContainText(
    "We do not save extracted QR data.",
  );

  await uploadArea(page).focus();
  await expect(uploadArea(page)).toBeFocused();

  const pageURLBeforeUpload = page.url();
  const fileChooser = page.waitForEvent("filechooser");
  await page.keyboard.press("Enter");
  await (await fileChooser).setFiles(qrFixturePath);

  await expect(page.getByRole("status")).toHaveText(copy.loading);
  extraction.resolve();

  await expect(page.getByText("QR_CODE")).toBeVisible();
  await expect(page.getByText("url")).toBeVisible();
  await expect(page.getByText(decodedURL)).toBeVisible();
  await expect(page.getByRole("link", { name: decodedURL })).toHaveCount(0);
  await expect(page).toHaveURL(pageURLBeforeUpload);

  const storedClientData = await page.evaluate(() =>
    [localStorage, sessionStorage]
      .flatMap((storage) =>
        Array.from({ length: storage.length }, (_, index) => {
          const key = storage.key(index);
          return key ? [key, storage.getItem(key) ?? ""] : [];
        }),
      )
      .join("\n"),
  );

  expect(storedClientData).not.toContain(decodedURL);
  expect(storedClientData).not.toContain("test.png");
  expect(consoleMessages.join("\n")).not.toContain(decodedURL);
  expect(consoleMessages.join("\n")).not.toContain("test.png");
});

test("copies only the extracted QR value", async ({ page }) => {
  await openPageWithSuccessfulExtraction(page);

  const copyButton = page.getByRole("button", {
    name: "Copy extracted QR value",
  });

  await copyButton.click();

  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(decodedURL);
  await expect(copyButton).toHaveText("Copied");
});

test("clear resets the upload and extracted result state", async ({ page }) => {
  await openPageWithSuccessfulExtraction(page);

  await expect(page.getByText("test.png")).toBeVisible();
  await page.getByRole("button", { name: "Clear" }).click();

  await expect(page.getByText("No file selected")).toBeVisible();
  await expect(page.getByText("Choose an image")).toBeVisible();
  await expect(page.getByText("test.png")).toHaveCount(0);
  await expect(page.getByText(decodedURL)).toHaveCount(0);
  await expect(visibleAlert(page)).toHaveCount(0);
  await expect(fileInput(page)).toHaveJSProperty("value", "");
  await expect
    .poll(() =>
      fileInput(page).evaluate(
        (input) => (input as HTMLInputElement).files?.length ?? -1,
      ),
    )
    .toBe(0);
});

test("rejects invalid files before calling the API", async ({ page }) => {
  const extraction = await mockExtraction(page, successResponse());

  await page.goto("/");
  await fileInput(page).setInputFiles({
    buffer: Buffer.from("not an image"),
    mimeType: "text/plain",
    name: "notes.txt",
  });

  await expect(visibleAlert(page)).toHaveText(copy.unsupportedFile);
  expect(extraction.postCount).toBe(0);

  await fileInput(page).setInputFiles({
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
    mimeType: "image/png",
    name: "large.png",
  });

  await expect(visibleAlert(page)).toHaveText(copy.tooLarge);
  expect(extraction.postCount).toBe(0);
});

test("maps backend extraction errors to user-facing messages", async ({ page }) => {
  await mockExtraction(
    page,
    apiErrorResponse("NO_QR_FOUND", copy.noQRCode),
    { status: 422 },
  );

  await page.goto("/");
  await uploadFixture(page);
  await expect(visibleAlert(page)).toHaveText(copy.noQRCode);

  await page.getByRole("button", { name: "Clear" }).click();
  await page.unroute(extractEndpoint);
  await mockExtraction(
    page,
    apiErrorResponse("INTERNAL_ERROR", "Internal server error"),
    { status: 500 },
  );

  await uploadFixture(page);
  await expect(visibleAlert(page)).toHaveText(copy.serverError);
});
