const getPagination = (query = {}) => {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

const getSort = (query = {}, allowedFields = ['id']) => {
    const sortBy = allowedFields.includes(query.sortBy) ? query.sortBy : 'id';
    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';
    return { [sortBy]: sortOrder };
};

module.exports = {
    getPagination,
    getSort
};

