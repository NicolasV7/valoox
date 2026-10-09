// How long a weapon really is, relative to the longest one.
//
// Out of catalogue.ts because it is not about fetching anything: a path in,
// a number out, no network and no cache. That file went over two hundred
// lines and this is the part of it that was never doing its job.

/**
 * How long a weapon really is, relative to the longest one.
 *
 * Riot draws every render at the same file width — measured: every skin level
 * icon is 512px across, whatever it is of — so a Ghost arrives the same length
 * as an Operator, and a column of four offers reads as an oversized pistol next
 * to a correctly sized rifle. The game does not look like that.
 *
 * The asset path says which family the skin came from, and seven of them cover
 * the whole catalogue: Sidearms, Rifles, SniperRifles, SubMachineGuns,
 * Shotguns, HvyMachineGuns, Melee. That is enough to give each one its size
 * back, with no index to download and no name to parse.
 *
 * Compressed, not literal. A Ghost really is about half a Vandal, and at half
 * it sat in the middle of a 350px row with nothing around it — the row read as
 * empty rather than as a small gun. The floor is 0.66, which is where the
 * artboard put its own smallest render, so the order is the game's and the
 * weight on the page is the design's.
 */
const SIZE: Record<string, number> = {
  SniperRifles: 1,
  HvyMachineGuns: 0.98,
  Rifles: 0.95,
  Shotguns: 0.85,
  SubMachineGuns: 0.82,
  Melee: 0.7,
  Sidearms: 0.66,
};

// .../Equippables/Guns/Rifles/AK/... and .../Equippables/Melee/Cyberpunk/...
const FAMILY = /\/Equippables\/(?:Guns\/)?([^/]+)\//;

export function sizeOf(assetPath: string | undefined): number {
  const found = assetPath ? FAMILY.exec(assetPath) : null;
  return (found && SIZE[found[1] as string]) || 1;
}
