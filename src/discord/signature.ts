/** Reject forged, replayed or stale events before any D1 or provider work. */
export async function verify(req: Request, raw: string, publicKey?: string): Promise<boolean> {
  const stamp = req.headers.get('X-Signature-Timestamp') ?? '';
  const signature = req.headers.get('X-Signature-Ed25519') ?? '';
  if (
    !/^\d{10}$/.test(stamp) ||
    !/^[0-9a-f]{128}$/i.test(signature) ||
    !/^[0-9a-f]{64}$/i.test(publicKey ?? '')
  )
    return false;
  if (Math.abs(Date.now() / 1000 - Number(stamp)) > 300) return false;
  const bytes = (hex: string) =>
    Uint8Array.from(hex.match(/../g) ?? [], (value) => Number.parseInt(value, 16));
  try {
    const key = await crypto.subtle.importKey('raw', bytes(publicKey as string), 'Ed25519', false, [
      'verify',
    ]);
    return await crypto.subtle.verify(
      'Ed25519',
      key,
      bytes(signature),
      new TextEncoder().encode(stamp + raw),
    );
  } catch {
    return false;
  }
}
