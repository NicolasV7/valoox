/** Google can use quoted URLs and extensionless font endpoints with queries. */
export function pick(sheet, subset) {
  const blocks = sheet.split('/*').slice(1);
  const block = blocks.find((b) => b.slice(0, b.indexOf('*/')).trim() === subset);
  if (!block) throw new Error('no ' + subset + ' subset in the sheet Google returned');
  const source =
    /src:\s*url\(\s*(['"]?)(https:\/\/[^\s'")]+)\1\s*\)\s*format\(\s*(['"])woff2(?:-variations)?\3\s*\)/.exec(
      block,
    );
  if (!source) throw new Error('no woff2 source in the ' + subset + ' block');
  const url = new URL(source[2]);
  if (url.origin !== 'https://fonts.gstatic.com' || url.username || url.password)
    throw new Error('font source is outside Google Fonts');
  return url.href;
}

/** A CSS format label is not enough to accept an HTML error or a legacy font. */
export function woff2(bytes) {
  if (bytes.length < 48 || String.fromCharCode(...bytes.subarray(0, 4)) !== 'wOF2')
    throw new Error('Google Fonts did not return a woff2 file');
  return bytes;
}
