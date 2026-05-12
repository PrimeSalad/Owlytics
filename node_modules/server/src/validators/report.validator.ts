import { z } from 'zod';

export const createReportSchema = z.object({
  eventId: z.string().min(1),
  activityId: z.string().optional(),
  type: z.enum(['Update', 'Emergency', 'Accomplishment']),
  title: z.string().min(1),
  content: z.string().min(1),
  attachments: z.array(z.object({
    url: z.string().url(),
    publicId: z.string(),
    fileType: z.enum(['image', 'pdf', 'document']),
  })).optional(),
});
