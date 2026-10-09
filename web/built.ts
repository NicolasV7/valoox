// Which commit this page was built from.
//
// The product's whole argument is that its claims are checkable, and until now
// one of them was not: the source is on GitHub, and nothing on the page said
// which version of it you were looking at. "Read the code" is not an answer if
// the code you read and the code you are running cannot be lined up.
//
// So the build stamps the commit it was built from, and the screen prints it.
//
// WHAT THAT PROVES, exactly, because overclaiming here would be worse than
// saying nothing. It proves where this bundle came from, as asserted by
// whatever machine ran the build. It does not prove who deployed it, and a
// deploy that runs from a laptop can stamp anything, including a commit whose
// contents are not what was uploaded. That gap closes when the deploy runs
// from CI and not before — see .github/workflows/deploy.yml — and the copy on
// the screen says only the part that is true today.
//
// `dirty` is the useful half in the meantime. A build from a tree with
// uncommitted changes is a build of code nobody can read, and it says so
// instead of printing a commit hash that is not what is running.

declare const __BUILD__: { sha: string; dirty: boolean; at: string };

export const built = __BUILD__;

/** The seven characters everyone actually quotes. */
export const short = (): string => built.sha.slice(0, 7);

/** Where that commit lives, or null when there is nothing honest to link to:
 *  a dirty tree has no commit holding what you are looking at, and an unknown
 *  sha is a build that happened outside a checkout. */
export const commitUrl = (repo: string): string | null =>
  built.dirty || !built.sha || built.sha === 'unknown' ? null : `${repo}/commit/${built.sha}`;
