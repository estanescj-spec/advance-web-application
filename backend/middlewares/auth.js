const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    // fail loudly instead of silently falling back to a guessable default
    throw new Error('JWT_SECRET is not set in environment variables');
}

/* ============================================================
   MUST BE LOGGED IN
   ============================================================ */
exports.isAuthenticatedUser = async (req, res, next) => {
    let token = null;

    if (req.header('Authorization')) {
        token = req.header('Authorization').split(' ')[1];
    } else if (req.query && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ message: 'Login first to access this resource' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // re-check against the DB so a deactivated/deleted user can't keep using an old token
        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'User no longer exists' });
        }
        if (!user.is_active) {
            return res.status(403).json({ message: 'This account has been deactivated' });
        }
        if (user.deleted_at) {
            return res.status(401).json({ message: 'This account has been deleted' });
        }

        // Verify token matches the one stored in database (token revocation)
        if (!user.token || user.token !== token) {
            return res.status(401).json({ message: 'Token has been revoked or is invalid' });
        }

        req.user = { id: user.id, role: user.role };
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired authentication token' });
    }
};

/* ============================================================
   ROLE GUARD — usage: authorizeRoles('admin')
   ============================================================ */
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Role (${req.user?.role}) is not allowed to access this resource` });
        }
        next();
    };
};