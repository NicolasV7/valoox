// One pill in a row of them.
//
// The same two shapes a skin's levels wear — see styles/pick.css. It was
// written twice, once per screen that picks between lists, and the second one
// was already drifting; a control with two copies is a control that will be
// drawn two ways.

export function Pick({ said, on, choose }: { said: string; on: boolean; choose: () => void }) {
  return (
    <button type="button" class={on ? 'pill pill--on' : 'pill'} aria-pressed={on} onClick={choose}>
      {said}
    </button>
  );
}
