const REFERRAL_LENGTH = 6;

export function generateReferralCode(fullName = '') {
  const base = fullName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 6);

  const random = Math.random().toString(36).slice(2, 2 + REFERRAL_LENGTH);
  return `${base || 'user'}-${random}`;
}

