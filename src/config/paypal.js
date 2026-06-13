// ── PayPal configuration ──────────────────────────────────────────────────────
// SECURITY: Only the Client ID belongs in the app. It is PUBLIC by design.
// The PayPal *Secret* key must NEVER be shipped in client code — anyone can
// decompile the APK and read it. Keep the secret on a server you control and
// use it only for server-side order creation/capture. This client-side
// integration (PayPal Smart Buttons) does not need the secret: PayPal handles
// approval and capture in the browser using just the Client ID.

export const PAYPAL_CLIENT_ID =
  'ARmC60y18EMaSDjwqHQjkzbZnVic0voiTph6OanP3Cy35vKAHnWAl8bxkWNzqkAPhyt0h0YIw0-gbKhT';

// Currency for donations. PayPal infers live vs sandbox from the Client ID itself.
export const PAYPAL_CURRENCY = 'USD';

// Parse a display amount like "$5" into a PayPal value string like "5.00".
export const toPayPalAmount = (display) => {
  const n = parseFloat(String(display).replace(/[^0-9.]/g, '')) || 0;
  return n.toFixed(2);
};
