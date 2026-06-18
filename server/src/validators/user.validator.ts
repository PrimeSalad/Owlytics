import { z } from 'zod';

const roles = ['President', 'Secretary', 'Officer', 'Committee', 'Attendance', 'VicePresident', 'Adviser'] as const;

export const createUserSchema = z.object({
  studentId: z.string().min(1),
  name: z.object({ first: z.string().min(1), last: z.string().min(1) }),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(roles),
  sectionId: z.string().uuid('Invalid section ID').optional(),
}).refine(
  (data) => {
    // If role is Attendance, sectionId must be provided
    if (data.role === 'Attendance') {
      return !!data.sectionId;
    }
    return true;
  },
  {
    message: 'Section ID is required for Attendance role',
    path: ['sectionId'],
  }
);

export const updateUserSchema = z.object({
  role: z.enum(roles).optional(),
  isActive: z.boolean().optional(),
  assignedCommitteeId: z.string().nullable().optional(),
  sectionId: z.string().uuid('Invalid section ID').nullable().optional(),
  name: z.object({ first: z.string().min(1), last: z.string().min(1) }).optional(),
  avatarUrl: z.string().nullable().optional(),
  avatarImage: z.string().nullable().optional(), // For base64 images if needed
  avatarColor: z.number().int().min(0).max(50).optional(),
});
