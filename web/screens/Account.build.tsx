import { built, commitUrl, short } from '../built.ts';
import { t } from '../i18n/index.ts';
import { Row } from './Account.row.tsx';

const SOURCE = 'https://github.com/NicolasV7/valoox';
const MADE_BY = 'https://github.com/NicolasV7';
const ALLOWLIST = SOURCE + '/blob/main/src/vault/upstream.ts';
const CATALOGUE = 'https://valorant-api.com';

/** Source and provenance remain available without competing with account data. */
export function AccountBuild({ rules }: { rules: number }) {
  const s = t().account;
  return (
    <details class="flow__build">
      <summary>{s.build}</summary>
      <div class="deck__card">
        <Row
          out={ALLOWLIST}
          said={s.whatItCalls}
          under={s.whatItCallsUnder(rules)}
          end={s.onGithub}
        />
        <Row out={MADE_BY} said={s.madeBy} under={s.madeByUnder} end={s.onGithub} />
        <Row out={SOURCE} said={s.source} under={s.sourceUnder} end={s.onGithub} />
        <Row
          out={commitUrl(SOURCE) ?? undefined}
          said={s.version}
          under={built.dirty ? s.versionDirty(short()) : s.versionAt(short(), built.at)}
          end={commitUrl(SOURCE) ? s.onGithub : undefined}
        />
        <Row out={CATALOGUE} said={s.catalogue} under={s.catalogueUnder} end={s.onApi} last />
      </div>
      <p class="flow__note">{s.versionProves}</p>
      <p class="flow__note">{s.legal}</p>
    </details>
  );
}
