// A sentence with a word or two set in bold, without leaving i18n.
//
// The two bold runs on the scan screen are the two things you have to find in
// somebody else's app, and they are the reason the line is readable at a
// glance rather than read word by word. Splitting the sentence around them in
// the component would freeze its word order, which is the one thing
// web/i18n/ exists to prevent — so the marks travel inside the string, between
// asterisks, and a translator moves them with the words they belong to.
//
// Not markdown and not a parser: one split on one character. Anything more and
// it would be a rendering language, which is how a string ends up carrying
// markup and markup ends up carrying a script.

export function Marked({ children }: { children: string }) {
  return (
    <>
      {/* Odd pieces are the ones between a pair of marks. The index is the
          identity here: the parts of one sentence, in order, and the sentence
          only changes when the locale does. */}
      {children.split('*').map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part))}
    </>
  );
}
