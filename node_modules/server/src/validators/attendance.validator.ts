import { z } from 'zod';

const sessionLabels = ['AM In', 'AM Out', 'PM In', 'PM Out'] as const;

export const createScheduleSchema = z.object({
  eventId: z.string().min(1),
  label: z.string().min(1),
  sessions: z.array(z.object({
    label: z.enum(sessionLabels),
    openAt: z.coerce.date(),
    closeAt: z.coerce.date(),
    gracePeriodMinutes: z.number().int().min(0).default(15),
  })),
  assignedScanners: z.array(z.string()).optional(),
});

export const scanSchema = z.object({
  qrData: z.string().min(1),
  sessionId: z.string().min(1),
  scheduleId: z.string().min(1),
  eventId: z.string().min(1),
  locationData: z.object({ lat: z.number(), lng: z.number() }).optional(),
});
