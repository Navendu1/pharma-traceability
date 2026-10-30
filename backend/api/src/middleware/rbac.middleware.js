// ==============================================================================
// ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
// File: backend/api/src/middleware/rbac.middleware.js
// ==============================================================================

/**
 * Authorize access based on user role(s)
 * @param  {...string} allowedRoles - 'SYSTEM_ADMIN', 'ORG_ADMIN', 'OPERATOR', 'INSPECTOR', 'AUDITOR'
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHENTICATED',
                    message: 'User identity is not authenticated'
                }
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: `Access denied. Role '${req.user.role}' is not authorized to perform this operation.`
                }
            });
        }

        next();
    };
};

/**
 * Authorize access based on organization type(s)
 * @param  {...string} allowedTypes - 'MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER', 'PHARMACY', 'REGULATOR'
 */
const authorizeOrgTypes = (...allowedTypes) => {
    return (req, res, next) => {
        if (!req.user || !req.user.orgType) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHENTICATED',
                    message: 'User organization context missing.'
                }
            });
        }

        if (!allowedTypes.includes(req.user.orgType)) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN_ORGANIZATION_TYPE',
                    message: `Operation restricted to organization type(s): [${allowedTypes.join(', ')}]. Current organization is '${req.user.orgType}'.`
                }
            });
        }

        next();
    };
};

module.exports = {
    authorizeRoles,
    authorizeOrgTypes
};
