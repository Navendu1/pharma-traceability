// ==============================================================================
// REQUEST BODY & PARAMS VALIDATION MIDDLEWARE (ZOD)
// File: backend/api/src/middleware/validation.middleware.js
// ==============================================================================

/**
 * Validates request payload against a Zod schema
 * @param {object} schema - Zod object schema
 * @param {'body'|'query'|'params'} source - Request property to inspect
 */
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        try {
            const parsed = schema.parse(req[source]);
            req[source] = parsed; // Replace with sanitized/coerced values
            next();
        } catch (error) {
            const details = error.errors ? error.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message
            })) : error.message;

            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Request payload validation failed',
                    details
                }
            });
        }
    };
};

module.exports = { validate };
