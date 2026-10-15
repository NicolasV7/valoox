/** Only fixed provider endpoints, with identities resolved before the call. */
export const notifications = [
  {
    method: 'POST',
    pattern: /^https:\/\/api\.resend\.com\/emails$/,
    why: 'sends email verification codes and alerts to a verified inbox',
  },
  {
    method: 'POST',
    pattern: /^https:\/\/discord\.com\/api\/v10\/channels\/[1-9]\d{16,19}\/messages$/,
    why: 'tests a signed bot DM conversation and sends opted-in wishlist alerts there',
  },
  {
    method: 'GET',
    pattern: /^https:\/\/discord\.com\/api\/v10\/users\/[1-9]\d{16,19}$/,
    why: 'refreshes the public avatar of the signed, opted-in Discord recipient',
  },
  {
    method: 'GET',
    pattern:
      /^https:\/\/cdn\.discordapp\.com\/(?:avatars\/[1-9]\d{16,19}\/(?:a_)?[a-f0-9]{32}\.png\?size=128|embed\/avatars\/[0-5]\.png)$/,
    why: 'proxies a bounded profile picture without exposing Discord identity to the browser',
  },
];
