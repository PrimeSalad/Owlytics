import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';

export async function getSections(req: Request, res: Response) {
  const { courseId, yearLevel, block, onlyActive } = req.query;

  let query = supabase
    .from('section_details')
    .select('id, course_id, course_code, course_name, academic_year, block, display_name, total_students, created_at')
    .order('course_name', { ascending: true })
    .order('academic_year', { ascending: true })
    .order('block', { ascending: true });

  if (courseId) query = query.eq('course_id', courseId as string);
  if (yearLevel) query = query.eq('academic_year', parseInt(yearLevel as string));
  if (block) query = query.eq('block', block as string);

  // If onlyActive is true, we filter sections that have students in the directory
  if (onlyActive === 'true') {
    const { data: activeSections } = await supabase
      .from('students')
      .select('section_id')
      .not('section_id', 'is', null);
    
    const activeIds = [...new Set((activeSections || []).map(s => s.section_id))];
    if (activeIds.length > 0) {
      query = query.in('id', activeIds);
    } else {
      return res.json([]); // No active sections in directory
    }
  }

  const { data, error } = await query;

  if (error) throw new AppError(500, error.message);

  res.json(data);
}

export async function getSectionById(req: Request, res: Response) {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('section_details')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new AppError(error.code === 'PGRST116' ? 404 : 500, error.message);

  res.json(data);
}

export async function getCourses(req: Request, res: Response) {
  const { data, error } = await supabase
    .from('courses')
    .select('id, course_code, course_name')
    .eq('is_active', true)
    .order('course_name', { ascending: true });

  if (error) throw new AppError(500, error.message);

  res.json(data);
}

export async function getSectionsByYear(req: Request, res: Response) {
  const { yearLevel } = req.params;

  const { data, error } = await supabase
    .from('section_details')
    .select('id, course_name, academic_year, block, display_name, total_students')
    .eq('academic_year', parseInt(yearLevel))
    .order('course_name', { ascending: true })
    .order('block', { ascending: true });

  if (error) throw new AppError(500, error.message);

  res.json(data);
}
