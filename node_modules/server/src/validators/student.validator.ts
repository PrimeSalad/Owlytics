import { z } from 'zod';

export const createStudentSchema = z.object({
  studentId: z.string().min(1),
  name: z.object({ first: z.string().min(1), last: z.string().min(1) }),
  email: z.string().email(),
  section: z.string().min(1),
  sectionId: z.string().uuid().optional(),
  yearLevel: z.number().int().min(1).max(4),
});

export const updateStudentSchema = createStudentSchema.partial();

export const bulkCreateStudentsSchema = z.object({
  students: z.array(createStudentSchema).min(1).max(200),
});
