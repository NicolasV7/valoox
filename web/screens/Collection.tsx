// The weapons tab: every weapon the game has, grouped the way the buy menu
// groups them.
//
// Not only the ones you have dressed. A slot with nothing equipped shows the
// stock gun, dimmed — that is the honest picture of a collection, and it is
// what makes the gaps visible. The groups and their order are Riot's own, out
// of the index: Sidearms, SMGs, Shotguns, Rifles, Snipers, Heavies, Melee.
//
// One render box for all of them, 148×52 contained, because a Classic is
// 512×340 and a Marshal is 512×96 — sizing by width alone made one look twice
// the other.

import { useState } from 'preact/hooks';
import type { Rack, Skin, Weapon } from '../data/skins.ts';
import { tierOf } from '../data/tiers.ts';
import type { Inventory } from '../data/types.ts';
import { useRacks } from '../data/useIndex.ts';
import { artStyle, useArt } from '../design/useArt.ts';
import { t } from '../i18n/index.ts';
import { href, intercept } from '../route.ts';
import { CollectionEmpty } from './Collection.empty.tsx';
import { CollectionLoading } from './Collection.loading.tsx';
import { CollectionTabs } from './Collection.tabs.tsx';

export function Collection({ inv }: { inv: Inventory }) {
  const racks = useRacks();
  if (!racks) return <CollectionLoading />;
  if (racks.length === 0) return <CollectionEmpty inv={inv} />;

  const worn = inv.worn?.guns ?? {};
  const all = racks.flatMap((r) => r.weapons);
  const dressed = all.filter((w) => skinOn(w, worn[w.id]?.level)?.tier).length;

  return (
    <main class="screen coll">
      <CollectionTabs on="weapons" said={t().collection.equipped(dressed, all.length)} />

      {racks.map((rack) => (
        <Group key={rack.of} rack={rack} worn={worn} />
      ))}

      <p class="legal coll__note">{t().collection.everyWeapon}</p>
    </main>
  );
}

function Group({
  rack,
  worn,
}: {
  rack: Rack;
  worn: Record<string, { level: string } | undefined>;
}) {
  const melee = rack.of === 'melee';
  return (
    <section class="coll__rack">
      <h2 class="label">{t().collection.rack[rack.of] ?? rack.of}</h2>
      <div class={melee ? 'slots slots--one' : 'slots'}>
        {rack.weapons.map((w) => (
          <Slot key={w.id} weapon={w} on={worn[w.id]?.level} big={melee} />
        ))}
      </div>
    </section>
  );
}

function Slot({ weapon, on, big }: { weapon: Weapon; on?: string; big?: boolean }) {
  const skin = skinOn(weapon, on);
  // A default skin has no content tier, which is also how a bare slot is told
  // apart from a dressed one: Riot gives every weapon a standard skin, and it
  // is the only one of the lot with nothing behind it.
  const tier = skin?.tier ? tierOf(skin.tier) : null;
  // A dressed slot shows the level that is on, because a level can look
  // different from the skin it belongs to — and 47 skins carry no icon of
  // their own, so the level is the reliable one there.
  //
  // A bare slot shows the weapon's own render and never the level's: Riot
  // publishes a 512×512 × placeholder as the displayIcon of most standard skin
  // levels — downloaded one and looked at it — so going through the level there
  // draws a cross in twenty slots.
  const art = tier
    ? (skin?.levels.find((l) => l.id === on)?.icon ?? skin?.render ?? weapon.icon)
    : weapon.icon;
  // Measured off the picture once the picture is in, rather than alongside it:
  // measure() opens its own Image, so firing it at mount means every slot is
  // downloaded twice, in parallel, before anything can paint. crossOrigin on
  // the visible one makes the two requests one cache entry.
  const [shot, setShot] = useState(false);
  const lit = useArt(shot && tier ? art : null);
  const route = { name: 'weapon', id: weapon.id } as const;

  return (
    <a
      class={tier ? 'slot stage' : 'slot slot--bare stage'}
      style={artStyle(lit)}
      href={href(route)}
      onClick={intercept(route)}
    >
      <span class="slot__of num">{weapon.name}</span>
      {tier && (
        <img
          class="slot__tier"
          src={tier.icon}
          alt=""
          width={big ? 14 : 13}
          height={big ? 14 : 13}
        />
      )}
      {art && (
        <img
          class="slot__art"
          src={stock(weapon, tier ? art : null)}
          alt=""
          loading="lazy"
          crossOrigin="anonymous"
          onLoad={() => setShot(true)}
          // The stock renders are fetched into public/art/ by `npm run art`,
          // so the day Riot ships a gun its slot falls back to the url the
          // index gave rather than drawing nothing until someone re-runs it.
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (art && img.src !== art) img.src = art;
          }}
        />
      )}
      <span class={tier ? 'slot__name' : 'slot__name slot__name--bare'}>
        {tier ? line(skin as Skin, weapon) : t().collection.standard}
      </span>
    </a>
  );
}

/** Which skin is on this weapon. The loadout names a level; a level belongs to
 *  a skin, so the slot shows the skin it is a level of. */
function skinOn(weapon: Weapon, level?: string): Skin | undefined {
  if (!level) return weapon.skins[0];
  return weapon.skins.find((s) => s.levels.some((l) => l.id === level)) ?? weapon.skins[0];
}

/** The skin line without the weapon on the end of it. "Reaver Vandal" in the
 *  Vandal's own slot is the word "Vandal" twice. */
function line(skin: Skin, weapon: Weapon): string {
  const cut = skin.name.lastIndexOf(' ' + weapon.name);
  return cut > 0 ? skin.name.slice(0, cut) : skin.name;
}

/** Where the picture comes from. A dressed slot is whatever skin is on, which
 *  rotates and stays remote; an empty one is the stock gun, which does not and
 *  is served from here. */
function stock(weapon: Weapon, dressed: string | null): string {
  return dressed ?? '/art/weapon-' + weapon.id + '.png';
}
