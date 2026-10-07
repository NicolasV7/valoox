// One icon set, drawn rather than borrowed from the emoji table.
//
// Every glyph lives on a 16-unit grid with a 1.5 stroke, round caps and round
// joins, and inherits `currentColor` — so an icon picks up the colour of whatever
// it sits in, which is how the tier and state hues reach them for free.
//
// Built with createElementNS because innerHTML is banned on this origin: item
// names come from a community database and the page can reach a Riot session.

const NS = 'http://www.w3.org/2000/svg';

const PATHS = {
  // A star with a flat enough interior angle to stay legible at 14px.
  star: 'M8 2.2l1.76 3.74 4.04.6-2.93 2.9.7 4.1L8 11.6 4.43 13.54l.7-4.1L2.2 6.54l4.04-.6z',
  check: 'M3 8.6l3.2 3.2L13 4.8',
  chevron: 'M4.5 6.5L8 10l3.5-3.5',
  search: 'M7.3 2.6a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4zM10.9 10.9L13.8 13.8',
  close: 'M4 4l8 8M12 4l-8 8',
  // A key, for the sign-in screen: the thing you are handing over.
  key: 'M9.6 6.4a2.6 2.6 0 1 0-2.9 2.57L6.1 9.6v1.3H4.8v1.3H3.5v1.3H2.2v-1.9l4.5-4.5',
  shield: 'M8 2.2l4.8 1.9v3.5c0 2.9-1.9 5.5-4.8 6.4-2.9-.9-4.8-3.5-4.8-6.4V4.1z',
  alert: 'M8 3v6M8 12.2v.6',
  // A bell with its clapper split off, so the shape still reads at 16px.
  bell: 'M4.9 7.3a3.1 3.1 0 0 1 6.2 0c0 2.5.8 3.3 1.2 3.7H3.7c.4-.4 1.2-1.2 1.2-3.7zM6.6 13.2a1.6 1.6 0 0 0 2.8 0',
  // Two sheets, the front one overlapping the back: the only drawing of "copy"
  // everyone already knows.
  copy: 'M6.1 2.7h7.2v7.2H6.1zM9.9 9.9v3.4H2.7V6.1h3.4',
};

/**
 * @param {keyof typeof PATHS} name
 * @param {{ size?: number, fill?: boolean, title?: string }} [opts]
 */
export function icon(name, opts = {}) {
  const { size = 16, fill = false, title } = opts;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('class', 'icon');
  // Decorative unless it is the only label, in which case it needs a name.
  if (title) {
    svg.setAttribute('role', 'img');
    const t = document.createElementNS(NS, 'title');
    t.textContent = title;
    svg.append(t);
  } else {
    svg.setAttribute('aria-hidden', 'true');
  }

  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', PATHS[name] ?? PATHS.alert);
  if (fill) {
    path.setAttribute('fill', 'currentColor');
  } else {
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
  }
  svg.append(path);
  return svg;
}
