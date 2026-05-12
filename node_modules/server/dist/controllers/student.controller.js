"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listStudents = listStudents;
exports.createStudent = createStudent;
exports.importStudents = importStudents;
exports.getStudent = getStudent;
exports.updateStudent = updateStudent;
exports.deleteStudent = deleteStudent;
exports.getStudentQR = getStudentQR;
const supabase_1 = require("../config/supabase");
const errorHandler_1 = require("../middleware/errorHandler");
const student_validator_1 = require("../validators/student.validator");
const qrcode_1 = require("../utils/qrcode");
async function listStudents(req, res) {
    const { page = 1, limit = 20, search, yearLevel, section } = req.query;
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;
    let query = supabase_1.supabase.from('students').select('*', { count: 'exact' });
    if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,student_id.ilike.%${search}%`);
    }
    if (yearLevel)
        query = query.eq('year_level', Number(yearLevel));
    if (section)
        query = query.eq('section', section);
    const { data, error, count } = await query.range(from, to).order('created_at', { ascending: false });
    if (error)
        throw new errorHandler_1.AppError(500, error.message);
    // Generate QR URLs for each student
    const studentsWithQR = await Promise.all(data.map(async (s) => {
        const { qrUrl } = await (0, qrcode_1.generateStudentQRCode)(s.student_id, s.first_name, s.last_name, s.section);
        return {
            _id: s.id,
            studentId: s.student_id,
            name: { first: s.first_name, last: s.last_name },
            email: s.email,
            section: s.section,
            yearLevel: s.year_level,
            qrCodeUrl: qrUrl,
            createdAt: s.created_at,
        };
    }));
    res.json({
        students: studentsWithQR,
        total: count ?? 0,
        page: Number(page),
        limit: Number(limit),
    });
}
async function createStudent(req, res) {
    const data = student_validator_1.createStudentSchema.parse(req.body);
    // Generate QR code with student info
    const { qrData, qrUrl } = await (0, qrcode_1.generateStudentQRCode)(data.studentId, data.name.first, data.name.last, data.section);
    const { data: student, error } = await supabase_1.supabase.from('students').insert({
        student_id: data.studentId,
        first_name: data.name.first,
        last_name: data.name.last,
        email: data.email,
        section: data.section,
        year_level: data.yearLevel,
        qr_code_data: qrData,
    }).select().single();
    if (error)
        throw new errorHandler_1.AppError(400, error.message);
    // Return with generated QR URL
    res.status(201).json({
        ...student,
        qr_code_url: qrUrl,
        _id: student.id,
        studentId: student.student_id,
        name: { first: student.first_name, last: student.last_name },
    });
}
async function importStudents(_req, res) {
    res.json({ message: 'Import endpoint ready — Phase 2' });
}
async function getStudent(req, res) {
    const { data, error } = await supabase_1.supabase.from('students').select('*').eq('id', req.params.id).single();
    if (error || !data)
        throw new errorHandler_1.AppError(404, 'Student not found');
    const { qrUrl } = await (0, qrcode_1.generateStudentQRCode)(data.student_id, data.first_name, data.last_name, data.section);
    res.json({
        _id: data.id,
        studentId: data.student_id,
        name: { first: data.first_name, last: data.last_name },
        email: data.email,
        section: data.section,
        yearLevel: data.year_level,
        qrCodeUrl: qrUrl
    });
}
async function updateStudent(req, res) {
    const data = student_validator_1.updateStudentSchema.parse(req.body);
    // Get current student to check if we need to regenerate QR
    const { data: currentStudent } = await supabase_1.supabase.from('students').select('*').eq('id', req.params.id).single();
    if (!currentStudent)
        throw new errorHandler_1.AppError(404, 'Student not found');
    const update = {};
    let needsQRRegeneration = false;
    if (data.studentId) {
        update.student_id = data.studentId;
        needsQRRegeneration = true;
    }
    if (data.name?.first) {
        update.first_name = data.name.first;
        needsQRRegeneration = true;
    }
    if (data.name?.last) {
        update.last_name = data.name.last;
        needsQRRegeneration = true;
    }
    if (data.email)
        update.email = data.email;
    if (data.section) {
        update.section = data.section;
        needsQRRegeneration = true;
    }
    if (data.yearLevel)
        update.year_level = data.yearLevel;
    // Regenerate QR data if student ID or name changed (but not stored in DB, generated on-the-fly)
    if (needsQRRegeneration) {
        const studentId = data.studentId || currentStudent.student_id;
        const firstName = data.name?.first || currentStudent.first_name;
        const lastName = data.name?.last || currentStudent.last_name;
        const section = data.section || currentStudent.section;
        const { qrData } = await (0, qrcode_1.generateStudentQRCode)(studentId, firstName, lastName, section);
        update.qr_code_data = qrData;
    }
    const { error } = await supabase_1.supabase.from('students').update(update).eq('id', req.params.id);
    if (error)
        throw new errorHandler_1.AppError(400, error.message);
    res.json({ message: 'Student updated successfully' });
}
async function deleteStudent(req, res) {
    await supabase_1.supabase.from('students').delete().eq('id', req.params.id);
    res.json({ message: 'Student removed' });
}
async function getStudentQR(req, res) {
    const { data, error } = await supabase_1.supabase.from('students').select('*').eq('id', req.params.id).single();
    if (error || !data)
        throw new errorHandler_1.AppError(404, 'Student not found');
    const { qrData, qrUrl } = await (0, qrcode_1.generateStudentQRCode)(data.student_id, data.first_name, data.last_name, data.section);
    res.json({ qrData, qrUrl });
}
