import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import { createReportSchema, rejectReportSchema, compileReportSchema, updateReportSchema } from '../validators/report.validator';
import { generateAccomplishmentPDF, generateSingleReportPDF } from '../services/pdfService';

export async function updateReport(req: Request, res: Response) {
  const { id } = req.params;
  const body = updateReportSchema.parse(req.body);

  const { data: report, error: fetchErr } = await supabase
    .from('reports')
    .select('author_id, type')
    .eq('id', id)
    .single();

  if (fetchErr || !report) throw new AppError(404, 'Report not found');

  const isAuthor = report.author_id === req.user!.userId;
  const isAdmin  = ['President', 'Secretary'].includes(req.user!.role);

  if (!isAuthor && !isAdmin) {
    throw new AppError(403, 'You do not have permission to edit this report');
  }

  const update: any = { ...body };
  if (body.activityId !== undefined) {
    update.activity_id = body.activityId;
    delete update.activityId;
  }

  const { data: updated, error } = await supabase
    .from('reports')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError(400, error.message);

  await logAction(req.user!.userId, 'UPDATE', 'REPORT', `Updated report ID: ${id}`, id);
  res.json(updated);
}

export async function exportSingleReport(req: Request, res: Response) {
  const { data: report, error } = await supabase
    .from('reports')
    .select('*, profiles!author_id(first_name, last_name, role), report_attachments(id, url, caption, sort_order, file_type), events!inner(title)')
    .eq('id', req.params.id)
    .single();

  if (error || !report) throw new AppError(404, 'Report not found');
  if (report.status !== 'Approved') throw new AppError(400, 'Only approved reports can be exported');

  const pdfBuffer = await generateSingleReportPDF(report, report.events);

  await logAction(req.user!.userId, 'CREATE', 'REPORT', `Exported approved report ID: ${report.id}`, report.id as string);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="report-${report.id.substring(0, 8)}.pdf"`);
  res.send(pdfBuffer);
}
import { generateAccomplishmentWord } from '../services/wordService';
import { logAction } from '../utils/auditLogger';

// ── helpers ──────────────────────────────────────────────────────────────────

async function uploadImage(buffer: Buffer, mimetype: string, reportId: string, idx: number) {
  const ext  = mimetype.split('/')[1] ?? 'jpg';
  const path = `reports/${reportId}/${idx}.${ext}`;
  const { error } = await supabase.storage
    .from('report-images')
    .upload(path, buffer, { contentType: mimetype, upsert: true });
  if (error) throw new AppError(500, `Image upload failed: ${error.message}`);
  const { data } = supabase.storage.from('report-images').getPublicUrl(path);
  return { url: data.publicUrl, path };
}

async function fetchCompilationData(ids: string[], sectionOrder?: string[]) {
  // Fetch events
  const { data: events, error: evErr } = await supabase
    .from('events')
    .select('id, title, start_date, end_date')
    .in('id', ids);
  if (evErr || !events?.length) throw new AppError(404, 'Events not found');

  const allTitles = events.map(e => e.title).join(', ');
  const minStart  = events.reduce((m, e) => !m || new Date(e.start_date) < new Date(m) ? e.start_date : m, '');
  const maxEnd    = events.reduce((m, e) => !m || new Date(e.end_date) > new Date(m) ? e.end_date : m, '');

  // Fetch approved accomplishment reports with attachments
  const { data: reports, error: rErr } = await supabase
    .from('reports')
    .select('*, profiles!author_id(first_name, last_name), report_attachments(url, caption, sort_order)')
    .in('event_id', ids)
    .eq('type', 'Accomplishment')
    .eq('status', 'Approved');
  if (rErr) throw new AppError(500, rErr.message);
  if (!reports?.length) throw new AppError(400, 'No approved accomplishment reports for selected events');

  // Fetch activities for these events
  const { data: activities } = await supabase
    .from('activities')
    .select('id, name, description, start_time, end_time')
    .in('event_id', ids);

  // Group reports by activity
  const activityMap = new Map<string | null, typeof reports>(); 
  for (const r of reports) {
    const key = r.activity_id ?? null;
    if (!activityMap.has(key)) activityMap.set(key, []);
    activityMap.get(key)!.push(r);
  }

  // Build ordered sections
  let orderedActivities = activities ?? [];
  if (sectionOrder?.length) {
    orderedActivities = sectionOrder
      .map((id) => orderedActivities.find((a) => a.id === id))
      .filter(Boolean) as typeof orderedActivities;
  }

  // Include unassigned reports as a catch-all section
  const sections = [
    ...orderedActivities
      .filter((a) => activityMap.has(a.id))
      .map((a) => ({
        name:        a.name,
        description: a.description,
        start_time:  a.start_time,
        end_time:    a.end_time,
        reports:     (activityMap.get(a.id) ?? []).map((r) => ({
          title:       r.title,
          content:     r.content,
          author:      `${r.profiles.first_name} ${r.profiles.last_name}`,
          attachments: r.report_attachments ?? [],
          objective:   r.objective ?? '',
          duration:    r.duration  ?? '',
          remarks:     r.remarks   ?? '',
        })),
      })),
    ...(activityMap.has(null) ? [{
      name:    'General Reports',
      reports: (activityMap.get(null) ?? []).map((r) => ({
        title:       r.title,
        content:     r.content,
        author:      `${r.profiles.first_name} ${r.profiles.last_name}`,
        attachments: r.report_attachments ?? [],
        objective:   r.objective ?? '',
        duration:    r.duration  ?? '',
        remarks:     r.remarks   ?? '',
      })),
    }] : []),
  ];

  return { allTitles, minStart, maxEnd, sections };
}

// ── list ──────────────────────────────────────────────────────────────────────

export async function listReports(req: Request, res: Response) {
  // Handle both 'eventId' and 'eventId[]'
  const eventId = req.query.eventId || req.query['eventId[]'];
  const type    = req.query.type    || req.query['type[]'];
  const status  = req.query.status  || req.query['status[]'];
  const activityId = req.query.activityId || req.query['activityId[]'];

  console.log('[listReports] incoming query:', req.query);
  let q = supabase
    .from('reports')
    .select('*, profiles!author_id(id, first_name, last_name, role), report_attachments(id, url, caption, sort_order, file_type)')
    .order('created_at', { ascending: false });

  if (type) {
    if (Array.isArray(type)) q = q.in('type', type as string[]);
    else q = q.eq('type', type as string);
  }
  
  if (eventId) {
    const ids = Array.isArray(eventId) ? (eventId as string[]) : [eventId as string];
    console.log('[listReports] filtering by event_ids:', ids);
    q = q.in('event_id', ids);
  }

  if (status) {
    if (Array.isArray(status)) q = q.in('status', status as string[]);
    else q = q.eq('status', status as string);
  }

  if (activityId) {
    if (Array.isArray(activityId)) q = q.in('activity_id', activityId as string[]);
    else q = q.eq('activity_id', activityId as string);
  }

  // Committee can only see their own
  if (req.user!.role === 'Committee') {
    console.log('[listReports] restricting to author_id:', req.user!.userId);
    q = q.eq('author_id', req.user!.userId);
  }

  const { data, error } = await q;
  if (error) {
    console.error('[listReports] Supabase error:', error);
    throw new AppError(500, error.message);
  }
  console.log('[listReports] found reports count:', data?.length ?? 0);
  res.json(data);
}

// ── create ────────────────────────────────────────────────────────────────────

export async function createReport(req: Request, res: Response) {
  const raw  = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
  // Sanitize: replace empty strings with undefined before validation
  if (raw.activityId === '') raw.activityId = undefined;
  if (raw.eventId    === '') raw.eventId    = undefined;
  const body = createReportSchema.parse(raw);

  const { data: report, error } = await supabase
    .from('reports')
    .insert({
      event_id:    body.eventId,
      activity_id: body.activityId?.trim() || null,
      author_id:   req.user!.userId,
      type:        body.type,
      title:       body.title,
      content:     body.content,
      objective:   body.objective || null,
      duration:    body.duration  || null,
      remarks:     body.remarks   || null,
      status:      body.status ?? 'Submitted',
    })
    .select()
    .single();

  if (error) {
    console.error('[createReport] insert failed:', error.message, { event_id: body.eventId, activity_id: body.activityId });
    throw new AppError(400, error.message);
  }
  const files = (req.files as Express.Multer.File[]) ?? [];
  if (files.length > 0) {
    try {
      const captions: string[] = JSON.parse(req.body.captions ?? '[]');
      const uploads = await Promise.all(
        files.map((f, i) => uploadImage(f.buffer, f.mimetype, report.id, i))
      );
      await supabase.from('report_attachments').insert(
        uploads.map((u, i) => ({
          report_id:  report.id,
          url:        u.url,
          public_id:  u.path,
          file_type:  'image',
          caption:    captions[i] ?? null,
          sort_order: i,
        }))
      );
    } catch (imgErr: any) {
      console.error('[createReport] image upload failed:', imgErr.message);
    }
  }

  await logAction(req.user!.userId, 'CREATE', 'REPORT', `Created ${body.type} report: "${body.title}"`, report.id);

  // Notify via socket
  if (body.type === 'Emergency') {
    req.app.locals.io?.to('role:President').emit('report:emergency', { reportId: report.id, title: report.title });
    
    // Create DB notifications for Emergency
    const { data: pres } = await supabase.from('profiles').select('id').eq('role', 'President').eq('is_active', true);
    const { data: sec } = await supabase.from('profiles').select('id').eq('role', 'Secretary').eq('is_active', true);
    const recipients = [...(pres || []), ...(sec || [])].map(r => r.id);
    if (recipients.length > 0) {
      await supabase.from('notifications').insert(
        recipients.map(rId => ({
          recipient_id: rId,
          type: 'Report',
          title: 'Emergency Report',
          message: `An emergency report "${body.title}" was submitted.`,
          related_id: report.id,
        }))
      );
    }
  }
  req.app.locals.io?.to('role:Officer').to('role:Secretary').to('role:President')
    .emit('report:new', { reportId: report.id, type: body.type });

  res.status(201).json(report);
}

// ── get single ────────────────────────────────────────────────────────────────

export async function getReport(req: Request, res: Response) {
  const { data, error } = await supabase
    .from('reports')
    .select('*, profiles!author_id(id, first_name, last_name, role), report_attachments(id, url, caption, sort_order, file_type)')
    .eq('id', req.params.id)
    .single();
  if (error || !data) throw new AppError(404, 'Report not found');
  res.json(data);
}

// ── approve ───────────────────────────────────────────────────────────────────

export async function approveReport(req: Request, res: Response) {
  const { error } = await supabase
    .from('reports')
    .update({ status: 'Approved', approved_by: req.user!.userId, approved_at: new Date().toISOString() })
    .eq('id', req.params.id);
  if (error) throw new AppError(400, error.message);

  await logAction(req.user!.userId, 'UPDATE', 'REPORT', `Approved report ID: ${req.params.id}`, req.params.id as string);

  // Notify author
  const { data: report } = await supabase.from('reports').select('author_id, title').eq('id', req.params.id).single();
  if (report) {
    req.app.locals.io?.to(`user:${report.author_id}`).emit('report:approved', { reportId: req.params.id });
    await supabase.from('notifications').insert({
      recipient_id: report.author_id,
      type: 'Report',
      title: 'Report Approved',
      message: `Your report "${report.title}" was approved.`,
      related_id: req.params.id,
    });
  }

  res.json({ message: 'Report approved' });
}

// ── reject ────────────────────────────────────────────────────────────────────

export async function rejectReport(req: Request, res: Response) {
  const { rejectionNote } = rejectReportSchema.parse(req.body);
  const { error } = await supabase
    .from('reports')
    .update({ status: 'Rejected', rejection_note: rejectionNote })
    .eq('id', req.params.id);
  if (error) throw new AppError(400, error.message);

  await logAction(req.user!.userId, 'UPDATE', 'REPORT', `Rejected report ID: ${req.params.id}`, req.params.id as string);

  const { data: report } = await supabase.from('reports').select('author_id').eq('id', req.params.id).single();
  if (report) req.app.locals.io?.to(`user:${report.author_id}`).emit('report:rejected', { reportId: req.params.id, note: rejectionNote });

  res.json({ message: 'Report rejected' });
}

// ── resolve emergency ─────────────────────────────────────────────────────────

export async function resolveReport(req: Request, res: Response) {
  const { error } = await supabase
    .from('reports')
    .update({ is_resolved: true, resolved_by: req.user!.userId, resolved_at: new Date().toISOString() })
    .eq('id', req.params.id);
  if (error) throw new AppError(400, error.message);
  await logAction(req.user!.userId, 'UPDATE', 'REPORT', `Resolved emergency report ID: ${req.params.id}`, req.params.id as string);
  res.json({ message: 'Report resolved' });
}

// ── compile PDF ───────────────────────────────────────────────────────────────

export async function compileAccomplishment(req: Request, res: Response) {
  const { eventId } = req.params;
  const { eventIds: bodyEventIds, sectionOrder, isFinal, presidentName, secretaryName, academicYear, orgName, preparedBy } = compileReportSchema.parse(req.body);

  const ids = bodyEventIds?.length ? bodyEventIds : [eventId];
  if (!ids.length || !ids[0]) throw new AppError(400, 'No event IDs provided');

  const { allTitles, minStart, maxEnd, sections } = await fetchCompilationData(ids, sectionOrder);

  // Get preparedBy name from profile if not provided
  let prepBy = preparedBy;
  if (!prepBy) {
    const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('id', req.user!.userId).single();
    prepBy = profile ? `${profile.first_name} ${profile.last_name}` : req.user!.userId;
  }

  const pdfBuffer = await generateAccomplishmentPDF({
    eventTitle:     allTitles,
    eventDateRange: { start: minStart, end: maxEnd },
    preparedBy:     prepBy,
    presidentName,
    secretaryName,
    academicYear:   academicYear || `${new Date(minStart).getFullYear()} – ${new Date(maxEnd).getFullYear()}`,
    activities:     sections,
    isFinal:        isFinal ?? false,
    orgName:        orgName || 'Student Organization',
  });

  // Save export record linked to the first event
  await supabase.from('accomplishment_exports').insert({
    event_id:     ids[0], 
    exported_by:  req.user!.userId,
    is_final:     isFinal ?? false,
    section_order: sectionOrder ?? [],
  });

  const logMsg = ids.length > 1 
    ? `Compiled multi-event accomplishment PDF for: ${allTitles}`
    : `Compiled accomplishment PDF for: ${allTitles}`;

  await logAction(req.user!.userId, 'CREATE', 'REPORT', logMsg + (isFinal ? ' (Final)' : ''), ids[0]);

  req.app.locals.io?.to('role:President').to('role:Secretary').emit('report:compiled', { eventId: ids[0], isFinal });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="accomplishment-${ids.length > 1 ? 'combined' : ids[0]}.pdf"`);
  res.send(pdfBuffer);
}

// ── compile Word ──────────────────────────────────────────────────────────────

export async function compileAccomplishmentWord(req: Request, res: Response) {
  const { eventId } = req.params;
  const { eventIds: bodyEventIds, sectionOrder, isFinal, presidentName, secretaryName, academicYear, orgName, preparedBy } = compileReportSchema.parse(req.body);

  const ids = bodyEventIds?.length ? bodyEventIds : [eventId];
  if (!ids.length || !ids[0]) throw new AppError(400, 'No event IDs provided');

  const { allTitles, minStart, maxEnd, sections } = await fetchCompilationData(ids, sectionOrder);

  let prepBy = preparedBy;
  if (!prepBy) {
    const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('id', req.user!.userId).single();
    prepBy = profile ? `${profile.first_name} ${profile.last_name}` : req.user!.userId;
  }

  const wordBuffer = await generateAccomplishmentWord({
    eventTitle: allTitles,
    eventDateRange: { start: minStart, end: maxEnd },
    preparedBy: prepBy,
    presidentName: presidentName ?? prepBy,
    secretaryName,
    academicYear: academicYear ?? `${new Date(minStart).getFullYear()} – ${new Date(maxEnd).getFullYear()}`,
    activities: sections,
    isFinal: isFinal ?? false,
    orgName: orgName || 'Student Organization'
  });

  const logMsg = ids.length > 1 
    ? `Compiled multi-event accomplishment Word for: ${allTitles}`
    : `Compiled accomplishment Word for: ${allTitles}`;

  await logAction(req.user!.userId, 'CREATE', 'REPORT', logMsg + (isFinal ? ' (Final)' : ''), ids[0]);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename="accomplishment-${ids.length > 1 ? 'combined' : ids[0]}.docx"`);
  res.send(wordBuffer);
}

// ── list exports ──────────────────────────────────────────────────────────────

export async function listExports(req: Request, res: Response) {
  const { data, error } = await supabase
    .from('accomplishment_exports')
    .select('*, profiles!exported_by(first_name, last_name)')
    .eq('event_id', req.params.eventId)
    .order('created_at', { ascending: false });
  if (error) throw new AppError(500, error.message);
  res.json(data);
}


// ── delete ────────────────────────────────────────────────────────────────────

export async function deleteReport(req: Request, res: Response) {
  const { data: report, error: fetchErr } = await supabase
    .from('reports')
    .select('author_id')
    .eq('id', req.params.id)
    .single();

  if (fetchErr || !report) throw new AppError(404, 'Report not found');

  const isOwner = report.author_id === req.user!.userId;
  const isAdmin = ['President', 'Secretary'].includes(req.user!.role);
  if (!isOwner && !isAdmin) throw new AppError(403, 'Insufficient permissions');

  // Try to remove storage files — non-fatal
  try {
    const { data: attachments } = await supabase
      .from('report_attachments')
      .select('public_id')
      .eq('report_id', req.params.id);
    if (attachments?.length) {
      await supabase.storage
        .from('report-images')
        .remove(attachments.map((a) => a.public_id).filter(Boolean));
    }
  } catch (e: any) {
    console.warn('[deleteReport] storage cleanup failed:', e.message);
  }

  const { error } = await supabase.from('reports').delete().eq('id', req.params.id);
  if (error) {
    console.error('[deleteReport] DB error:', error.message);
    throw new AppError(400, error.message);
  }
  await logAction(req.user!.userId, 'DELETE', 'REPORT', `Deleted report ID: ${req.params.id}`, req.params.id as string);
  res.json({ message: 'Report deleted' });
}
