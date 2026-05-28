/**
 * Demo account passwords for local development only.
 * Per-email mapping so bcrypt self-heal uses the correct hash per user.
 */
const DEMO_CREDENTIALS = {
    'admin@gmail.com': 'Admin@2026Secure',
    'manager@gmail.com': 'Manager@2026Secure',
    'sahasra@gmail.com': 'User@2026Secure',
    'priya@gmail.com': 'User@2026Secure',
    'sneha@gmail.com': 'User@2026Secure'
};

const DEMO_EMAILS = new Set(Object.keys(DEMO_CREDENTIALS));

const getDemoPassword = (email) => DEMO_CREDENTIALS[String(email || '').toLowerCase()] || null;

module.exports = {
    DEMO_CREDENTIALS,
    DEMO_EMAILS,
    getDemoPassword
};
