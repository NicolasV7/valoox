// A line that is still waiting on something, with the ellipsis doing the
// waiting rather than sitting there.
//
// The three dots are elements, not the `…` character, because a character
// cannot be animated one third at a time. The string in web/i18n/ keeps its
// ellipsis — a translator should read a finished sentence — and this strips it
// off at the end and draws it instead.

export function Thinking({ children }: { children: string }) {
  const said = children.replace(/\s*[…]\s*$|\s*\.\.\.\s*$/, '');

  return (
    <>
      {said}
      {/* Hidden from a screen reader: it already read the sentence, and three
          dots announced one at a time is noise. */}
      <span class="dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </>
  );
}
