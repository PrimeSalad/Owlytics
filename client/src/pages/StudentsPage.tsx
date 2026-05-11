import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Search, Edit2, Trash2, QrCode } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout';
import { Button, Card, CardBody, Modal, Input, Badge, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { Student } from '@/types';

const schema = z.object({
  studentId: z.string().min(1, 'Required'),
  firstName: z.string().min(1, 'Required'),
  lastName:  z.string().min(1, 'Required'),
  email:     z.string().email('Valid email required'),
  section:   z.string().min(1, 'Required'),
  yearLevel: z.coerce.number().int().min(1).max(4),
});
type FormData = z.infer<typeof schema>;

const YEAR_LABELS: Record<number, string> = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year' };

export function StudentsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [qrStudent, setQrStudent] = useState<Student | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, search, yearFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.set('search', search);
      if (yearFilter) params.set('yearLevel', yearFilter);
      const { data } = await api.get(`/students?${params}`);
      return data as { students: Student[]; total: number; limit: number };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/students/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); toast.success('Student removed'); },
    onError: () => toast.error('Failed to remove student'),
  });

  const students = data?.students ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 15);

  return (
    <PageWrapper
      title="Students"
      description={`${total} students total`}
      actions={
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <UserPlus className="h-4 w-4" />Add Student
        </Button>
      }
    >
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name or ID…"
            className="w-full rounded border border-surface-border bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-brand-400"
          />
        </div>
        <select
          value={yearFilter}
          onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
          className="rounded border border-surface-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
        >
          <option value="">All Years</option>
          {[1,2,3,4].map((y) => <option key={y} value={y}>{YEAR_LABELS[y]}</option>)}
        </select>
      </div>

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : students.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">No students found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-muted border-b border-surface-border">
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wide">
                    <th className="px-5 py-3 font-medium">Student</th>
                    <th className="px-5 py-3 font-medium">ID</th>
                    <th className="px-5 py-3 font-medium">Section</th>
                    <th className="px-5 py-3 font-medium">Year</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {students.map((s) => (
                    <tr key={s._id} className="hover:bg-surface-muted transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-800">{s.name.first} {s.name.last}</p>
                        <p className="text-xs text-slate-400">{s.email}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-600 font-mono text-xs">{s.studentId}</td>
                      <td className="px-5 py-3 text-slate-600">{s.section}</td>
                      <td className="px-5 py-3">
                        <Badge variant="default">{YEAR_LABELS[s.yearLevel]}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right space-x-2">
                        <button onClick={() => setQrStudent(s)} className="text-slate-400 hover:text-brand-600 transition-colors" title="View QR">
                          <QrCode className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditStudent(s)} className="text-slate-400 hover:text-brand-600 transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => confirm(`Remove ${s.name.first} ${s.name.last}?`) && deleteMutation.mutate(s._id)}
                          className="text-slate-400 hover:text-danger transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <StudentFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => { qc.invalidateQueries({ queryKey: ['students'] }); setAddOpen(false); }}
      />
      {editStudent && (
        <StudentFormModal
          open
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['students'] }); setEditStudent(null); }}
        />
      )}
      {qrStudent && (
        <Modal open onClose={() => setQrStudent(null)} title={`QR Code — ${qrStudent.name.first} ${qrStudent.name.last}`} size="sm">
          <div className="flex flex-col items-center gap-4 py-4">
            {qrStudent.qrCodeUrl ? (
              <img src={qrStudent.qrCodeUrl} alt="QR Code" className="h-48 w-48 object-contain" />
            ) : (
              <p className="text-sm text-slate-400">QR code not generated yet.</p>
            )}
            <p className="text-xs text-slate-400">{qrStudent.studentId}</p>
          </div>
        </Modal>
      )}
    </PageWrapper>
  );
}

function StudentFormModal({
  open, student, onClose, onSuccess,
}: {
  open: boolean;
  student?: Student;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!student;
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: student ? {
      studentId: student.studentId,
      firstName: student.name.first,
      lastName: student.name.last,
      email: student.email,
      section: student.section,
      yearLevel: student.yearLevel,
    } : undefined,
  });

  const mutation = useMutation({
    mutationFn: (values: FormData) => {
      const body = { studentId: values.studentId, name: { first: values.firstName, last: values.lastName }, email: values.email, section: values.section, yearLevel: values.yearLevel };
      return isEdit ? api.patch(`/students/${student!._id}`, body) : api.post('/students', body);
    },
    onSuccess: () => { toast.success(isEdit ? 'Student updated' : 'Student added'); reset(); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Failed'),
  });

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={isEdit ? 'Edit Student' : 'Add Student'} size="lg">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" required error={errors.firstName?.message} {...register('firstName')} />
          <Input label="Last Name" required error={errors.lastName?.message} {...register('lastName')} />
        </div>
        <Input label="Student ID" required error={errors.studentId?.message} {...register('studentId')} />
        <Input label="Email" type="email" required error={errors.email?.message} {...register('email')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Section" placeholder="e.g. BSIT 3-A" required error={errors.section?.message} {...register('section')} />
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Year Level <span className="text-danger">*</span></label>
            <select {...register('yearLevel')} className="w-full rounded border border-surface-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-brand-400">
              {[1,2,3,4].map((y) => <option key={y} value={y}>{YEAR_LABELS[y]}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Update' : 'Add Student'}</Button>
        </div>
      </form>
    </Modal>
  );
}
