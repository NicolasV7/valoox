export interface Theme {
  page: string;
  stage: string;
  ink: string;
  muted: string;
  faint: string;
  hatch: string;
  ui: string;
  num: string;
  radius: number;
  outerRadius: number;
}

/** Canvas receives the same resolved tokens as the dark application chrome. */
export function theme(): Theme {
  const probe = document.createElement('span');
  probe.hidden = true;
  document.body.append(probe);
  const colour = (token: string) => {
    probe.style.setProperty('color', `var(--${token})`);
    return getComputedStyle(probe).color;
  };
  const root = getComputedStyle(document.documentElement);
  try {
    return {
      page: colour('page'),
      stage: colour('stage'),
      ink: colour('ink'),
      muted: colour('ink-3'),
      faint: colour('ink-4'),
      hatch: colour('hatch'),
      ui: root.getPropertyValue('--ui').trim(),
      num: root.getPropertyValue('--num').trim(),
      radius: Number.parseFloat(root.getPropertyValue('--r')),
      outerRadius: Number.parseFloat(root.getPropertyValue('--r-lg')),
    };
  } finally {
    probe.remove();
  }
}
