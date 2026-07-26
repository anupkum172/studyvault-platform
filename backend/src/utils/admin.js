export function isConfiguredAdmin(email) {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(String(email || '').toLowerCase());
}

export function resolveRole(user) {
  return user?.role === 'admin' || isConfiguredAdmin(user?.email) ? 'admin' : 'user';
}
