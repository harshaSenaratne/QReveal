export function PrivacyNotice() {
  return (
    <section
      aria-label="Privacy notice"
      className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950"
    >
      <p>Your files are processed only for QR extraction.</p>
      <p>We do not store uploaded files.</p>
      <p>We do not save extracted QR data.</p>
      <p>No account is required.</p>
    </section>
  );
}
