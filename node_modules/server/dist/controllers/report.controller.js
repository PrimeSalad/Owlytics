"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listReports = listReports;
exports.createReport = createReport;
exports.getReport = getReport;
exports.resolveReport = resolveReport;
exports.generateAccomplishment = generateAccomplishment;
const supabase_1 = require("../config/supabase");
const errorHandler_1 = require("../middleware/errorHandler");
const report_validator_1 = require("../validators/report.validator");
async function listReports(req, res) {
    const { type, eventId } = req.query;
    let query = supabase_1.supabase.from('reports')
        .select('*, profiles!author_id(id, first_name, last_name, role)')
        .order('created_at', { ascending: false });
    if (type)
        query = query.eq('type', type);
    if (eventId)
        query = query.eq('event_id', eventId);
    const { data, error } = await query;
    if (error)
        throw new errorHandler_1.AppError(500, error.message);
    res.json(data);
}
async function createReport(req, res) {
    const data = report_validator_1.createReportSchema.parse(req.body);
    const { data: report, error } = await supabase_1.supabase.from('reports').insert({
        event_id: data.eventId, activity_id: data.activityId,
        author_id: req.user.userId, type: data.type,
        title: data.title, content: data.content,
    }).select().single();
    if (error)
        throw new errorHandler_1.AppError(400, error.message);
    if (data.attachments?.length) {
        await supabase_1.supabase.from('report_attachments').insert(data.attachments.map((a) => ({ report_id: report.id, url: a.url, public_id: a.publicId, file_type: a.fileType })));
    }
    if (data.type === 'Emergency') {
        req.app.locals.io?.to('role:President').emit('report:emergency', {
            reportId: report.id, title: report.title,
        });
    }
    res.status(201).json(report);
}
async function getReport(req, res) {
    const { data, error } = await supabase_1.supabase.from('reports')
        .select('*, profiles!author_id(id, first_name, last_name, role), report_attachments(*)')
        .eq('id', req.params.id).single();
    if (error || !data)
        throw new errorHandler_1.AppError(404, 'Report not found');
    res.json(data);
}
async function resolveReport(req, res) {
    const { error } = await supabase_1.supabase.from('reports').update({
        is_resolved: true, resolved_by: req.user.userId, resolved_at: new Date().toISOString(),
    }).eq('id', req.params.id);
    if (error)
        throw new errorHandler_1.AppError(400, error.message);
    res.json({ message: 'Report resolved' });
}
async function generateAccomplishment(_req, res) {
    res.json({ message: 'PDF generation endpoint ready — Phase 5' });
}
