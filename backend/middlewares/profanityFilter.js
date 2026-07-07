/**
 * Profanity Filter Middleware
 * Validates and sanitizes user inputs for profanity
 */

const { validateField } = require('../utils/profanityFilter');

/**
 * Middleware to validate profanity in request body
 * Options:
 *   - strict: boolean - if true, reject requests with profanity; if false, censor and continue
 *   - fields: string[] - specific fields to check (default: all string fields)
 *   - allowCensored: boolean - if false, reject; if true, allow censored content (default: true)
 */
function profanityFilterMiddleware(options = {}) {
    const {
        strict = false,
        fields = null,
        allowCensored = true
    } = options;

    return (req, res, next) => {
        if (!req.body || typeof req.body !== 'object') {
            return next();
        }

        const violations = [];
        const sanitized = {};

        // Determine which fields to check
        const fieldsToCheck = fields || Object.keys(req.body);

        fieldsToCheck.forEach(fieldName => {
            if (fieldName in req.body) {
                const value = req.body[fieldName];

                // Only check string fields
                if (typeof value === 'string' && value.trim().length > 0) {
                    const validation = validateField(value, fieldName, strict);

                    if (!validation.isValid) {
                        violations.push({
                            field: fieldName,
                            message: validation.message,
                            violations: validation.violations
                        });
                    }

                    if (!strict && validation.violations.length > 0) {
                        // Censor the field
                        sanitized[fieldName] = validation.sanitized;
                    } else {
                        sanitized[fieldName] = value;
                    }
                } else {
                    sanitized[fieldName] = value;
                }
            }
        });

        // Handle violations
        if (violations.length > 0) {
            if (strict || !allowCensored) {
                // Reject the request
                return res.status(400).json({
                    success: false,
                    message: 'Request contains inappropriate language',
                    violations: violations
                });
            }

            // Non-strict mode: censor and continue with warning
            req.body = sanitized;
            req.profanityWarnings = violations;
            return next();
        }

        next();
    };
}

/**
 * Middleware to check specific fields (strict mode)
 * Rejects requests with any profanity
 */
function strictProfanityFilter(...fields) {
    return profanityFilterMiddleware({ strict: true, fields });
}

/**
 * Middleware to censor profanity (non-strict mode)
 * Censors inappropriate content and continues
 */
function censoringProfanityFilter(...fields) {
    return profanityFilterMiddleware({ strict: false, fields, allowCensored: true });
}

module.exports = {
    profanityFilterMiddleware,
    strictProfanityFilter,
    censoringProfanityFilter
};
