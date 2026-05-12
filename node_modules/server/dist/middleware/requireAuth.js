"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const supabase_1 = require("../config/supabase");
const errorHandler_1 = require("./errorHandler");
async function requireAuth(req, _res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token)
        throw new errorHandler_1.AppError(401, 'Not authenticated');
    const { data: { user }, error } = await supabase_1.supabase.auth.getUser(token);
    if (error || !user)
        throw new errorHandler_1.AppError(401, 'Invalid or expired token');
    // Get role from profile
    const { data: profile } = await supabase_1.supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .single();
    if (!profile?.is_active)
        throw new errorHandler_1.AppError(401, 'Account is deactivated');
    req.user = { userId: user.id, role: profile.role };
    next();
}
