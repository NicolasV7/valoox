/** Shared by the QR lifecycle and its waiting indicator. */
export const POLL_EVERY = 2000;
// The server scan expires after 600 seconds; failures cannot extend the client wait.
export const SCAN_LIFE = 600000;

export type ScanState =
  | { phase: 'starting' }
  | { phase: 'ready'; url: string }
  // Both endings retain the spent QR so the plate does not jump or empty.
  | { phase: 'expired'; url?: string }
  | { phase: 'approved'; url?: string };
