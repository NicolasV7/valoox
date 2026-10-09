// What a message is allowed to say, as a shape.
//
// Split from words.ts, which holds the two objects that fill it, because a
// contract and its content are two subjects and together they outgrew the
// two-hundred-line limit. The limit found the seam, which is what it is for.
//
// The locale comes from the tab that asked, so a mail arrives in the language
// of the screen that sent it.

export type Lang = 'es' | 'en';

export const langOf = (raw: unknown): Lang => (raw === 'en' ? 'en' : 'es');

export interface Words {
  subject: (code: string) => string;
  /** Under the code itself: the two numbers that bound it. */
  bounds: (mins: number) => string;
  asked: string;
  askedWhy: string;
  neverAsk: string;
  neverPassword: string;
  foot: string;
  text: (code: string, mins: number) => string;

  // --- the morning message -------------------------------------------------
  hitSubject: (first: string, n: number) => string;
  inYourStore: string;
  openYourStore: string;
  goneIn: string;
  /** The line under a name: the tier, then only the counts worth saying. */
  tier: Record<'select' | 'deluxe' | 'premium' | 'exclusive' | 'ultra', string>;
  levels: (n: number) => string;
  chromas: (n: number) => string;
  youStarred: (days: number) => string;
  oneADay: string;
  hitFoot: string;
  stopThese: string;
  hitText: (names: string[], link: string) => string;
  /** The line under every message, in both. It lived inline in layout.ts,
   *  which is how two sentences escaped the rule that every sentence a message
   *  says lives in one file — see test/unit/strings.test.ts. */
  riotNotice: string;
  /** The header's right-hand line. A clock where the reader's offset is
   *  known, and how long is left where it is not. */
  sentAt: (ms: number, tz: number | undefined, lang: Lang) => string;
  expiresAt: (ms: number, tz: number | undefined, mins: number) => string;

  // --- a channel with no layout --------------------------------------------
  // One line of text, which is all a webhook takes. Here rather than beside
  // the sender because a message is a message: these were the last two spoken
  // strings in src/ written in one language, and they ignored the one the
  // reader asked for.
  /** The same news the morning mail carries, in a sentence. */
  pushLine: (names: string[]) => string;
  /** Sent by the test button. Carries no skin, no account id and no session. */
  pushTest: string;
}
