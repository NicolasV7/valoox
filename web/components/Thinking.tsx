// A line that is still waiting on something, with the ellipsis doing the
// waiting rather than sitting there.
//
// Three real full stops, not drawn dots: they inherit the font, the size, the
// weight and the colour of the sentence they end, so the line reads exactly as
// it would at rest and the only difference is that they are moving. Each one
// hops in turn.
//
// The string in web/i18n/ keeps its `…` — a translator should read a finished
// sentence — and this strips it off and sets the three in its place.
//
// One span around both, and not a fragment: the waiting line is a flex row with
// a gap, which would otherwise make the sentence one item and the dots another
// and open ten pixels in the middle of a word's own punctuation.

const DOT = '.';

export function Thinking({ children }: { children: string }) {
  const said = children.replace(/\s*…\s*$|\s*\.\.\.\s*$/, '');

  return (
    <span>
      {said}
      {/* Hidden from a screen reader: it has already read the sentence, and
          three full stops announced one at a time is noise. */}
      <span class="dots" aria-hidden="true">
        <i>{DOT}</i>
        <i>{DOT}</i>
        <i>{DOT}</i>
      </span>
    </span>
  );
}
