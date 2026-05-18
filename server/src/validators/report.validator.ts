import { z } from 'zod';

export const createReportSchema = z.object({
  eventId:    z.string().min(1),
  activityId: z.string().optional().transform(v => v || undefined),
  type:       z.enum(['Update', 'Emergency', 'Accomplishment']),
  title:      z.string().min(1).max(200),
  content:    z.string().min(1).max(5000),
  status:     z.enum(['Draft', 'Submitted']).default('Submitted'),
  objective:  z.string().max(500).optional(),
  duration:   z.string().max(200).optional(),
  remarks:    z.string().max(500).optional(),
  // attachments come via multipart — handled separately
});

export const rejectReportSchema = z.object({
  rejectionNote: z.string().min(1).max(500),
});

export const compileReportSchema = z.object({
  eventIds:      z.array(z.string()).optional(),
  sectionOrder:  z.array(z.string()).optional(),
  isFinal:       z.boolean().default(false),
  presidentName: z.string().optional(),
  secretaryName: z.string().optional(),
  academicYear:  z.string().optional(),
  orgName:       z.string().optional(),
  preparedBy:    z.string().optional(),
});

