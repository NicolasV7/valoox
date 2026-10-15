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
];
