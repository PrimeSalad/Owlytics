import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import { createStudentSchema, updateStudentSchema } from '../validators/student.validator';

export async function listStudents(req: Request, res: Response) {
  const { page = 1, limit = 20, search, yearLevel, section } = req.query;
  const from = (Number(page) - 1) * Number(limit);
  const to = from + Number(limit) - 1;

  let query = supabase.from('students').select('*', { count: 'exact' });

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,student_id.ilike.%${search}%`);
  }
  if (yearLevel) query = query.eq('year_level', Number(yearLevel));
  if (section) query = query.eq('section', section);

  const { data, error, count } = await query.range(from, to).order('created_at', { ascending: false });
  if (error) throw new AppError(500, error.message);

  res.json({
    students: data.map((s) => ({
      _id: s.id, studentId: s.student_id,
      name: { first: s.first_name, last: s.last_name },
      email: s.email, section: s.section, yearLevel: s.year_level,
      qrCodeUrl: s.qr_code_url, createdAt: s.created_at,
    })),
    total: count ?? 0, page: Number(page), limit: Number(limit),
  });
}

export async function createStudent(req: Request, res: Response) {
  const data = createStudentSchema.parse(req.body);
  const { data: student, error } = await supabase.from('students').insert({
    student_id: data.studentId,
    first_name: data.name.first,
    last_name: data.name.last,
    email: data.email,
    section: data.section,
    year_level: data.yearLevel,
  }).select().single();

  if (error) throw new AppError(400, error.message);
  res.status(201).json(student);
}

export async function importStudents(_req: Request, res: Response) {
  res.json({ message: 'Import endpoint ready — Phase 2' });
}

export async function getStudent(req: Request, res: Response) {
  const { data, error } = await supabase.from('students').select('*').eq('id', req.params.id).single();
  if (error || !data) throw new AppError(404, 'Student not found');
  res.json({ _id: data.id, studentId: data.student_id, name: { first: data.first_name, last: data.last_name }, email: data.email, section: data.section, yearLevel: data.year_level, qrCodeUrl: data.qr_code_url });
}

export async function updateStudent(req: Request, res: Response) {
  const data = updateStudentSchema.parse(req.body);
  const update: Record<string, unknown> = {};
  if (data.studentId) update.student_id = data.studentId;
  if (data.name?.first) update.first_name = data.name.first;
  if (data.name?.last) update.last_name = data.name.last;
  if (data.email) update.email = data.email;
  if (data.section) update.section = data.section;
  if (data.yearLevel) update.year_level = data.yearLevel;

  const { error } = await supabase.from('students').update(update).eq('id', req.params.id);
  if (error) throw new AppError(400, error.message);
  res.json({ message: 'Updated' });
}

export async function deleteStudent(req: Request, res: Response) {
  await supabase.from('students').delete().eq('id', req.params.id);
  res.json({ message: 'Student removed' });
}

export async function getStudentQR(req: Request, res: Response) {
  const { data, error } = await supabase.from('students').select('qr_code_url, qr_code_data').eq('id', req.params.id).single();
  if (error || !data) throw new AppError(404, 'Student not found');
  res.json(data);
}
