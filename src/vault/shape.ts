// Cache validation is independent of decryption. Only public DTO fields may
// leave the vault, even if a future writer accidentally supplies a session.
type Check = (v: unknown) => boolean;
const text: Check = (v) => typeof v === 'string';
const num: Check = (v) => typeof v === 'number' && Number.isFinite(v);
const bool: Check = (v) => typeof v === 'boolean';
const nil =
  (check: Check): Check =>
  (v) =>
    v === null || check(v);
const opt =
  (check: Check): Check =>
  (v) =>
    v === undefined || check(v);
const list =
  (check: Check): Check =>
  (v) =>
    Array.isArray(v) && v.every(check);
const record =
  (check: Check): Check =>
  (v) =>
    !!v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).every(check);

function object(fields: Record<string, Check>): Check {
  return (v) => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
    const row = v as Record<string, unknown>;
    return (
      Object.keys(row).every((k) => Object.hasOwn(fields, k)) &&
      Object.entries(fields).every(([k, check]) => check(row[k]))
    );
  };
}

const cost = nil(num);
const offer = object({ id: text, cost });
const group = object({ id: text, type: text, base: cost, price: cost, owned: opt(bool) });
const night = object({
  remaining: num,
  items: list(object({ id: text, cost, price: cost, percent: num })),
});
const accessory = object({
  remaining: num,
  items: list(object({ id: text, type: text, cost, qty: num, owned: opt(bool) })),
  allOwned: opt(bool),
});
export const storeShape = object({
  offers: list(offer),
  remaining: num,
  night: nil(night),
  bundles: list(
    object({
      id: text,
      base: cost,
      price: cost,
      remaining: num,
      items: list(group),
      allOwned: opt(bool),
    }),
  ),
  accessory: nil(accessory),
  wallet: object({ vp: num, rad: num, kc: num }),
  account: object({
    name: text,
    rank: nil(object({ tier: num, rr: num })),
    card: opt(nil(text)),
    shard: opt(text),
    seen: opt(num),
  }),
  fetchedAt: num,
});
export const inventoryShape = object({
  byType: record(list(text)),
  worn: nil(
    object({
      guns: record(object({ level: text, chroma: nil(text), buddy: nil(text) })),
      sprays: list(text),
      card: nil(text),
      title: nil(text),
    }),
  ),
  fetchedAt: num,
});

export function sessionShape(v: unknown): boolean {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const s = v as Record<string, unknown>;
  return (
    record(text)(s.jar) &&
    opt(text)(s.puuid) &&
    opt(text)(s.shard) &&
    opt(text)(s.name) &&
    (s.wishlist === undefined || Array.isArray(s.wishlist))
  );
}
