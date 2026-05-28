const fs = require('fs/promises');
const path = require('path');

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'activity.log');

const logActivity = async ({ actor_id, action, entity_type, entity_id, details }) => {
    try {
        await fs.mkdir(LOG_DIR, { recursive: true });
        const payload = {
            timestamp: new Date().toISOString(),
            actor_id: actor_id || null,
            action,
            entity_type,
            entity_id: entity_id || null,
            details: details || null
        };
        await fs.appendFile(LOG_FILE, `${JSON.stringify(payload)}\n`, 'utf-8');
    } catch (error) {
        // Never block API flow on file logging failures
        if (process.env.NODE_ENV !== 'test') console.error('Activity log write failed', error);
    }
};

module.exports = {
    logActivity
};

