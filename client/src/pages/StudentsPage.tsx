import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Search, Edit2, Trash2, QrCode, Download, Users as UsersIcon } from 'lucide-react';
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

export function StudentsPage({ isComponent = false }: { isComponent?: boolean }) {
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

  const content = (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1 w-full max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name or ID…"
              className="w-full rounded-lg border border-surface-border bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
          <select
            value={yearFilter}
            onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-surface-border bg-white px-3 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
          >
            <option value="">All Years</option>
            {[1,2,3,4].map((y) => <option key={y} value={y}>{YEAR_LABELS[y]}</option>)}
          </select>
        </div>
        
        {!isComponent && (
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4" /> Add Student
          </Button>
        )}
        {isComponent && (
           <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" /> Add Student
          </Button>
        )}
      </div>

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : students.length === 0 ? (
            <div className="py-20 text-center">
              <div className="h-12 w-12 bg-surface-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <UsersIcon className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500">No students found.</p>
            </div>

          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-muted/50 border-b border-surface-border text-left">
                    <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">ID Number</th>
                    <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Section</th>
                    <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Year Level</th>
                    <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {students.map((s) => (
                    <tr key={s._id} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                            {s.name.first[0]}{s.name.last[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{s.name.first} {s.name.last}</p>
                            <p className="text-[11px] text-slate-400">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[11px] bg-surface-muted px-2 py-1 rounded text-slate-600 border border-surface-border">
                          {s.studentId}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{s.section}</td>
                      <td className="px-6 py-4">
                        <Badge variant="default" className="bg-brand-50 text-brand-700 border-brand-100">
                          {YEAR_LABELS[s.yearLevel]}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setQrStudent(s)} 
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all" 
                            title="View QR"
                          >
                            <QrCode className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setEditStudent(s)} 
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => confirm(`Remove ${s.name.first} ${s.name.last}?`) && deleteMutation.mutate(s._id)}
                            className="p-1.5 text-slate-400 hover:text-danger hover:bg-danger-50 rounded-lg transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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
        <div className="flex items-center justify-between px-2 pt-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="h-8 text-xs px-3" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <Button variant="secondary" size="sm" className="h-8 text-xs px-3" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
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
            <div className="p-4 bg-white rounded-2xl border-2 border-surface-border shadow-inner">
              {qrStudent.qrCodeUrl ? (
                <img src={qrStudent.qrCodeUrl} alt="QR Code" className="h-48 w-48 object-contain" />
              ) : (
                <div className="h-48 w-48 flex items-center justify-center text-slate-300">
                  <QrCode className="h-12 w-12" />
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-800">{qrStudent.studentId}</p>
              <p className="text-xs text-slate-400">Scan this code for attendance</p>
            </div>
            <Button variant="secondary" size="sm" className="w-full" onClick={() => window.print()}>
              <Download className="h-4 w-4" /> Download QR
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );

  if (isComponent) return content;

  return (
    <PageWrapper
      title="Students"
      description={`${total} students registered in the system.`}
    >
      {content}
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
