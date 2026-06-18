import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import { createStudentSchema, updateStudentSchema, bulkCreateStudentsSchema } from '../validators/student.validator';
import { generateStudentQRCode } from '../utils/qrcode';

export async function listSections(_req: Request, res: Response) {
  const { data, error } = await supabase
    .from('students')
    .select('section')
    .order('section', { ascending: true });
  if (error) throw new AppError(500, error.message);
  const sections = [...new Set((data ?? []).map((r) => r.section).filter(Boolean))];
  res.json(sections);
}

export async function listStudents(req: Request, res: Response) {
  const { page = 1, limit = 20, search, yearLevel, section, course, block, sectionId, orderBy } = req.query;
  const assignedSectionId = req.assignedSectionId;
  const from = (Number(page) - 1) * Number(limit);
  const to = from + Number(limit) - 1;

  // Try to join with sections for display_name, but fallback to simple select if table/relation is missing
  let query = supabase.from('students').select('*, sections(display_name)', { count: 'exact' });

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,student_id.ilike.%${search}%`);
  }
  if (yearLevel) {
    query = query.eq('year_level', Number(yearLevel));
  }
  
  if (section) {
    query = query.eq('section', section as string);
  } else {
    if (course) {
      query = query.ilike('section', `${course} %`);
    }
    if (block) {
      query = query.ilike('section', `%-${block}`);
    }
  }

  if (assignedSectionId) {
    query = query.eq('section_id', assignedSectionId);
  } else if (sectionId) {
    query = query.eq('section_id', sectionId);
  }

  const sortCol = orderBy === 'section' ? 'section' : 'created_at';
  let { data, error, count } = await query.range(from, to).order(sortCol, { ascending: true });

  // Fallback if join fails for any reason (missing table, column, or relationship)
  if (error) {
    let fallbackQuery = supabase.from('students').select('*', { count: 'exact' });
    if (search) {
      fallbackQuery = fallbackQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,student_id.ilike.%${search}%`);
    }
    if (yearLevel) {
      fallbackQuery = fallbackQuery.eq('year_level', Number(yearLevel));
    }
    
    if (section) {
      fallbackQuery = fallbackQuery.eq('section', section as string);
    } else {
      if (course) {
        fallbackQuery = fallbackQuery.ilike('section', `${course} %`);
      }
      if (block) {
        fallbackQuery = fallbackQuery.ilike('section', `%-${block}`);
      }
    }

    if (assignedSectionId) {
      fallbackQuery = fallbackQuery.eq('section_id', assignedSectionId);
    } else if (sectionId) {
      fallbackQuery = fallbackQuery.eq('section_id', sectionId);
    }
    
    const fallbackRes = await fallbackQuery.range(from, to).order(sortCol, { ascending: true });
    data = fallbackRes.data;
    error = fallbackRes.error;
    count = fallbackRes.count;
  }

  if (error) throw new AppError(500, error.message);

  const students = (data || []).map((s: any) => ({
    _id: s.id,
    studentId: s.student_id,
    name: { first: s.first_name, last: s.last_name },
    email: s.email,
    section: s.section,
    sectionId: s.section_id,
    assignedSection: s.sections?.display_name,
    yearLevel: s.year_level,
    createdAt: s.created_at,
  }));

  res.json({
    students,
    total: count ?? 0,
    page: Number(page),
    limit: Number(limit),
  });
}

export async function createStudent(req: Request, res: Response) {
  const data = createStudentSchema.parse(req.body);
  
  // Generate QR code with student info
  const { qrData, qrUrl } = await generateStudentQRCode(
    data.studentId,
    data.name.first,
    data.name.last,
    data.section
  );
  
  const insertData: any = {
    student_id: data.studentId,
    first_name: data.name.first,
    last_name: data.name.last,
    email: data.email,
    section: data.section,
    year_level: data.yearLevel,
    qr_code_data: qrData,
  };

  if (data.sectionId) {
    insertData.section_id = data.sectionId;
  }
  
  const { data: student, error } = await supabase.from('students').insert(insertData).select().single();

  if (error) throw new AppError(400, error.message);
  
  res.status(201).json({ 
    ...student, 
    _id: student.id,
    studentId: student.student_id,
    name: { first: student.first_name, last: student.last_name },
  });
}

export async function importStudents(_req: Request, res: Response) {
  res.json({ message: 'Import endpoint ready — Phase 2' });
}

export async function getStudent(req: Request, res: Response) {
  const { data, error } = await supabase.from('students').select('*').eq('id', req.params.id).single();
  if (error || !data) throw new AppError(404, 'Student not found');
  
  res.json({ 
    _id: data.id, 
    studentId: data.student_id, 
    name: { first: data.first_name, last: data.last_name }, 
    email: data.email, 
    section: data.section, 
    yearLevel: data.year_level, 
  });
}

export async function updateStudent(req: Request, res: Response) {
  const data = updateStudentSchema.parse(req.body);
  
  // Get current student to check if we need to regenerate QR
  const { data: currentStudent } = await supabase.from('students').select('*').eq('id', req.params.id).single();
  if (!currentStudent) throw new AppError(404, 'Student not found');
  
  const update: Record<string, unknown> = {};
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
  if (data.email) update.email = data.email;
  if (data.section) {
    update.section = data.section;
    needsQRRegeneration = true;
  }
  if (data.sectionId) update.section_id = data.sectionId;
  if (data.yearLevel) update.year_level = data.yearLevel;

  // Regenerate QR data if student ID or name changed (but not stored in DB, generated on-the-fly)
  if (needsQRRegeneration) {
    const studentId = data.studentId || currentStudent.student_id;
    const firstName = data.name?.first || currentStudent.first_name;
    const lastName = data.name?.last || currentStudent.last_name;
    const section = data.section || currentStudent.section;
    
    const { qrData } = await generateStudentQRCode(studentId, firstName, lastName, section);
    update.qr_code_data = qrData;
  }

  const { error } = await supabase.from('students').update(update).eq('id', req.params.id);
  if (error) throw new AppError(400, error.message);
  res.json({ message: 'Student updated successfully' });
}

export async function deleteStudent(req: Request, res: Response) {
  await supabase.from('students').delete().eq('id', req.params.id);
  res.json({ message: 'Student removed' });
}

export async function getStudentQR(req: Request, res: Response) {
  const { data, error } = await supabase.from('students').select('*').eq('id', req.params.id).single();
  if (error || !data) throw new AppError(404, 'Student not found');
  
  const { qrData, qrUrl } = await generateStudentQRCode(data.student_id, data.first_name, data.last_name, data.section);
  
  res.json({ qrData, qrUrl });
}


export async function bulkCreateStudents(req: Request, res: Response) {
  const { students } = bulkCreateStudentsSchema.parse(req.body);

  // Generate QR codes in parallel
  const rows = await Promise.all(
    students.map(async (s) => {
      const { qrData } = await generateStudentQRCode(s.studentId, s.name.first, s.name.last, s.section);
      return {
        student_id: s.studentId,
        first_name: s.name.first,
        last_name: s.name.last,
        email: s.email,
        section: s.section,
        year_level: s.yearLevel,
        qr_code_data: qrData,
      };
    }),
  );

  const { data, error } = await supabase
    .from('students')
    .insert(rows)
    .select('id, student_id, first_name, last_name, section, year_level');

  if (error) throw new AppError(400, error.message);

  res.status(201).json({ inserted: data?.length ?? 0, students: data });
}
