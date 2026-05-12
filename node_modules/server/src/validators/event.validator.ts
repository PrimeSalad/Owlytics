import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  venue: z.string().optional(),
  dateRange: z.object({ start: z.coerce.date(), end: z.coerce.date() }),
  assignedOfficers: z.array(z.string()).optional(),
});

export const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(['Planning', 'Ongoing', 'Completed', 'Cancelled']).optional(),
});

export const activitySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  committeeId: z.string().optional(),
});
