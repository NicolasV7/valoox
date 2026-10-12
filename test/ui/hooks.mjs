// A deterministic hook host: execute the real component handlers and effects
// without relying on timers, a browser account or a live Riot session.
export function host() {
  let cursor = 0;
  const cells = [];
  const effects = [];
  const equal = (a, b) => a?.length === b?.length && a.every((v, i) => v === b[i]);
  return {
    begin() {
      cursor = 0;
    },
    flush() {
      while (effects.length) {
        const { fn, cell } = effects.shift();
        cell.cleanup?.();
        cell.cleanup = fn();
      }
    },
    dispose() {
      for (const cell of cells) cell?.cleanup?.();
    },
    hooks: {
      useRef(initial) {
        const i = cursor++;
        cells[i] ??= { value: { current: initial } };
        return cells[i].value;
      },
      useMemo(fn, deps) {
        const i = cursor++;
        if (!cells[i] || !equal(cells[i].deps, deps)) cells[i] = { value: fn(), deps };
        return cells[i].value;
      },
      useState(initial) {
        const i = cursor++;
        cells[i] ??= { value: typeof initial === 'function' ? initial() : initial };
        return [
          cells[i].value,
          (value) => {
            cells[i].value = typeof value === 'function' ? value(cells[i].value) : value;
          },
        ];
      },
      useCallback(fn, deps) {
        const i = cursor++;
        if (!cells[i] || !equal(cells[i].deps, deps)) cells[i] = { value: fn, deps };
        return cells[i].value;
      },
      useEffect(fn, deps) {
        const i = cursor++;
        if (!cells[i] || !equal(cells[i].deps, deps)) {
          const cell = { deps, cleanup: cells[i]?.cleanup };
          cells[i] = cell;
          effects.push({ fn, cell });
        }
      },
      useLayoutEffect() {
        cursor++;
      },
    },
  };
}
export function nodes(node) {
  if (!node || typeof node !== 'object') return [];
  const children = node.props?.children;
  return [node, ...(Array.isArray(children) ? children : [children]).flatMap(nodes)];
}
