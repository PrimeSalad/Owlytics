import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Report, AccomplishmentExport, Event } from '@/types';

export function useReports(filters: { type?: string; eventId?: string; status?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.type)    params.set('type', filters.type);
  if (filters.eventId) params.set('eventId', filters.eventId);
  if (filters.status)  params.set('status', filters.status);
  const qs = params.toString();

  return useQuery({
    queryKey: ['reports', filters],
    queryFn: () => api.get<Report[]>(`/reports${qs ? `?${qs}` : ''}`).then((r) => r.data),
  });
}

export function useReport(id: string | null) {
  return useQuery({
    queryKey: ['report', id],
    queryFn: () => api.get<Report>(`/reports/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useApproveReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/reports/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useRejectReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      api.patch(`/reports/${id}/reject`, { rejectionNote: note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useResolveReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/reports/${id}/resolve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) =>
      api.post<Report>('/reports', form, {
        headers: { 'Content-Type': undefined }, // let browser set multipart boundary
      }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/reports/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useCompileReport() {
  return useMutation({
    mutationFn: async ({ eventId, ...options }: { 
      eventId: string; 
      sectionOrder: string[]; 
      isFinal: boolean;
      presidentName?: string;
      secretaryName?: string;
      academicYear?: string;
      orgName?: string;
      preparedBy?: string;
    }) => {
      const res = await api.post(`/reports/compile/${eventId}`, options, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `accomplishment-${eventId}.pdf`; a.click();
      URL.revokeObjectURL(url);
    },
  });
}

export function useCompileReportWord() {
  return useMutation({
    mutationFn: async ({ eventId, ...options }: { 
      eventId: string; 
      sectionOrder: string[]; 
      isFinal: boolean;
      presidentName?: string;
      secretaryName?: string;
      academicYear?: string;
      orgName?: string;
      preparedBy?: string;
    }) => {
      const res = await api.post(`/reports/compile-word/${eventId}`, options, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
      const a = document.createElement('a');
      a.href = url; a.download = `accomplishment-${eventId}.docx`; a.click();
      URL.revokeObjectURL(url);
    },
  });
}


export function useExports(eventId: string | null) {
  return useQuery({
    queryKey: ['exports', eventId],
    queryFn: () => api.get<AccomplishmentExport[]>(`/reports/exports/${eventId}`).then((r) => r.data),
    enabled: !!eventId,
  });
}

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => api.get<Event[]>('/events').then((r) => r.data),
  });
}
