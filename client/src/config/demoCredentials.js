/**
 * Demo accounts for login page autofill (development only).
 */
export const demoAccounts = [
  { role: 'Admin', email: 'admin@gmail.com', password: 'Admin@2026Secure' },
  { role: 'Manager', email: 'manager@gmail.com', password: 'Manager@2026Secure' },
  { role: 'Developer', email: 'sahasra@gmail.com', password: 'User@2026Secure' },
  { role: 'Developer', email: 'priya@gmail.com', password: 'User@2026Secure' },
  { role: 'QA', email: 'sneha@gmail.com', password: 'User@2026Secure' },
]

export function getDemoPassword(email) {
  const hit = demoAccounts.find((a) => a.email === email)
  return hit?.password || ''
}
