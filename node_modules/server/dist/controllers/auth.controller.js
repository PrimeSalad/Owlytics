"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.logout = logout;
exports.getMe = getMe;
exports.changePassword = changePassword;
const supabase_1 = require("../config/supabase");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_validator_1 = require("../validators/auth.validator");
async function login(req, res) {
    const { email, password } = auth_validator_1.loginSchema.parse(req.body);
    const { data, error } = await supabase_1.supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user)
        throw new errorHandler_1.AppError(401, 'Invalid credentials');
    // Get profile
    const { data: profile } = await supabase_1.supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
    if (!profile?.is_active)
        throw new errorHandler_1.AppError(401, 'Account is deactivated');
    // Update last_login
    await supabase_1.supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', data.user.id);
    res.json({
        access_token: data.session.access_token,
        user: {
            _id: profile.id,
            studentId: profile.student_id,
            name: { first: profile.first_name, last: profile.last_name },
            email: data.user.email,
            role: profile.role,
            avatarUrl: profile.avatar_url,
            isActive: profile.is_active,
        },
    });
}
async function logout(_req, res) {
    res.json({ message: 'Logged out' });
}
async function getMe(req, res) {
    const { data: profile } = await supabase_1.supabase
        .from('profiles')
        .select('*')
        .eq('id', req.user.userId)
        .single();
    if (!profile)
        throw new errorHandler_1.AppError(404, 'User not found');
    const { data: authUser } = await supabase_1.supabase.auth.admin.getUserById(req.user.userId);
    res.json({
        _id: profile.id,
        studentId: profile.student_id,
        name: { first: profile.first_name, last: profile.last_name },
        email: authUser.user?.email,
        role: profile.role,
        avatarUrl: profile.avatar_url,
        isActive: profile.is_active,
        createdAt: profile.created_at,
    });
}
async function changePassword(req, res) {
    const { newPassword } = auth_validator_1.changePasswordSchema.parse(req.body);
    const { error } = await supabase_1.supabase.auth.admin.updateUserById(req.user.userId, { password: newPassword });
    if (error)
        throw new errorHandler_1.AppError(400, error.message);
    res.json({ message: 'Password changed' });
}
