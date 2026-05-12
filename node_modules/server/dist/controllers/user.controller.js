"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deactivateUser = deactivateUser;
const supabase_1 = require("../config/supabase");
const errorHandler_1 = require("../middleware/errorHandler");
const user_validator_1 = require("../validators/user.validator");
async function listUsers(_req, res) {
    const { data, error } = await supabase_1.supabase
        .from('profiles')
        .select('id, student_id, first_name, last_name, role, avatar_url, assigned_section, is_active, last_login, created_at')
        .order('created_at', { ascending: false });
    if (error)
        throw new errorHandler_1.AppError(500, error.message);
    // Get emails from auth
    const { data: authList } = await supabase_1.supabase.auth.admin.listUsers();
    const emailMap = Object.fromEntries(authList.users.map((u) => [u.id, u.email]));
    res.json(data.map((p) => ({
        _id: p.id,
        studentId: p.student_id,
        name: { first: p.first_name, last: p.last_name },
        email: emailMap[p.id] ?? '',
        role: p.role,
        avatarUrl: p.avatar_url,
        assignedSection: p.assigned_section,
        isActive: p.is_active,
        lastLogin: p.last_login,
        createdAt: p.created_at,
    })));
}
async function createUser(req, res) {
    const data = user_validator_1.createUserSchema.parse(req.body);
    const { data: existingProfile, error: existingProfileError } = await supabase_1.supabase
        .from('profiles')
        .select('id')
        .eq('student_id', data.studentId)
        .maybeSingle();
    if (existingProfileError)
        throw new errorHandler_1.AppError(500, existingProfileError.message);
    if (existingProfile) {
        throw new errorHandler_1.AppError(409, 'Access ID is already used by another account');
    }
    const { data: authData, error: authError } = await supabase_1.supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
            student_id: data.studentId,
            first_name: data.name.first,
            last_name: data.name.last,
            role: data.role,
        },
    });
    if (authError) {
        throw new errorHandler_1.AppError(400, authError.message === 'Database error creating new user'
            ? 'Supabase could not create the profile. Run the updated auth trigger SQL in supabase_schema.sql, then try again.'
            : authError.message);
    }
    const { error: profileError } = await supabase_1.supabase.from('profiles').upsert({
        id: authData.user.id,
        student_id: data.studentId,
        first_name: data.name.first,
        last_name: data.name.last,
        role: data.role,
        is_active: true,
    });
    if (profileError) {
        await supabase_1.supabase.auth.admin.deleteUser(authData.user.id);
        throw new errorHandler_1.AppError(400, profileError.message);
    }
    res.status(201).json({ _id: authData.user.id, email: data.email, role: data.role });
}
async function updateUser(req, res) {
    const data = user_validator_1.updateUserSchema.parse(req.body);
    const userId = req.params.id;
    const updatePayload = {};
    if (data.role)
        updatePayload.role = data.role;
    if (data.isActive !== undefined)
        updatePayload.is_active = data.isActive;
    if (data.assignedSection !== undefined)
        updatePayload.assigned_section = data.assignedSection;
    const { error } = await supabase_1.supabase.from('profiles').update(updatePayload).eq('id', userId);
    if (error)
        throw new errorHandler_1.AppError(500, error.message);
    res.json({ message: 'User updated successfully' });
}
async function deactivateUser(req, res) {
    const { error } = await supabase_1.supabase.from('profiles').update({ is_active: false }).eq('id', req.params.id);
    if (error)
        throw new errorHandler_1.AppError(500, error.message);
    res.json({ message: 'User deactivated' });
}
