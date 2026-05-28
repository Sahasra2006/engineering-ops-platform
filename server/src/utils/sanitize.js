const sanitizeUser = (user) => {
    if (!user) return user;
    const { password_hash, ...safeUser } = user;
    return safeUser;
};

const sanitizeUsers = (users = []) => users.map(sanitizeUser);

module.exports = {
    sanitizeUser,
    sanitizeUsers
};

