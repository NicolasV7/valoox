export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function readBytes(
  req: Pick<Request, 'headers' | 'body'>,
  limit = 65536,
): Promise<ArrayBuffer> {
  const length = req.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > limit)) {
    throw new HttpError(413, 'body too large');
  }
  const reader = req.body?.getReader();
  if (!reader) return new ArrayBuffer(0);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new HttpError(413, 'body too large');
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  const out = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out.buffer;
}
export const readText = async (
  req: Pick<Request, 'headers' | 'body'>,
  limit = 65536,
): Promise<string> => new TextDecoder().decode(await readBytes(req, limit));
export async function readJson(req: Request, limit = 65536): Promise<Record<string, unknown>> {
  if (req.headers.get('content-type')?.split(';')[0]?.trim() !== 'application/json') {
    throw new HttpError(415, 'json required');
  }
  let body: unknown;
  try {
    body = JSON.parse(await readText(req, limit));
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(400, 'invalid json');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw new HttpError(400, 'object required');
  return body as Record<string, unknown>;
}
