import { type ElementType, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  Edit2,
  GraduationCap,
  QrCode,
  Search,
  Trash2,
  UserPlus,
  Users as UsersIcon,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout';
import { Badge, Button, Card, CardBody, Input, Modal, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { Student } from '@/types';
import { useAuthStore } from '@/store/authStore';

const PAGE_SIZE = 15;

const schema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  section: z.string().min(1, 'Section is required'),
  yearLevel: z.coerce.number().int().min(1).max(4),
});
type FormData = z.infer<typeof schema>;

const YEAR_LABELS: Record<number, string> = {
  1: '1st Year',
  2: '2nd Year',
  3: '3rd Year',
  4: '4th Year',
};

export function StudentsPage({ isComponent = false }: { isComponent?: boolean }) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const canManageStudents = user?.role === 'President' || user?.role === 'Secretary';
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [qrStudent, setQrStudent] = useState<Student | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, search, yearFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search.trim()) params.set('search', search.trim());
      if (yearFilter) params.set('yearLevel', yearFilter);
      const { data } = await api.get(`/students?${params}`);
      return data as { students: Student[]; total: number; page: number; limit: number };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student removed');
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Failed to remove student'),
  });

  const students = data?.students ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const content = (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <DirectoryMetric label="Total students" value={total} icon={UsersIcon} />
        <DirectoryMetric label="Visible records" value={students.length} icon={GraduationCap} />
        <DirectoryMetric label="Page" value={page} icon={Search} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-2xl">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name or student ID"
              className="h-10 w-full rounded-lg border border-surface-border bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <select
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-surface-border bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            aria-label="Filter students by year level"
          >
            <option value="">All years</option>
            {[1, 2, 3, 4].map((year) => (
              <option key={year} value={year}>{YEAR_LABELS[year]}</option>
            ))}
          </select>
        </div>

        {canManageStudents ? (
          <Button onClick={() => setAddOpen(true)} className="w-full sm:w-auto">
            <UserPlus className="h-4 w-4" /> Add Student
          </Button>
        ) : (
          <Badge variant="default" className="w-fit">Directory view</Badge>
        )}
      </div>

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : students.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted">
                <UsersIcon className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No students found</p>
              <p className="mt-1 text-xs text-slate-400">Student records added here become the attendance directory.</p>
              {canManageStudents && (
                <Button size="sm" className="mt-4" onClick={() => setAddOpen(true)}>
                  <UserPlus className="h-4 w-4" /> Add first student
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-muted/70 text-left">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Student</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">ID Number</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Section</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Year Level</th>
                    <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {students.map((student) => (
                    <tr key={student._id} className="transition-colors hover:bg-surface-muted/40">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                            {student.name.first[0]}{student.name.last[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">{student.name.first} {student.name.last}</p>
                            <p className="truncate text-xs text-slate-400">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded border border-surface-border bg-surface-muted px-2 py-1 font-mono text-xs text-slate-600">
                          {student.studentId}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600">{student.section}</td>
                      <td className="px-6 py-4">
                        <Badge variant="primary">{YEAR_LABELS[student.yearLevel]}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        {canManageStudents ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setQrStudent(student)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-brand-50 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                              aria-label={`View QR for ${student.name.first} ${student.name.last}`}
                            >
                              <QrCode className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditStudent(student)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-brand-50 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                              aria-label={`Edit ${student.name.first} ${student.name.last}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Remove ${student.name.first} ${student.name.last}?`)) {
                                  deleteMutation.mutate(student._id);
                                }
                              }}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-danger-50 hover:text-danger-700 focus:outline-none focus:ring-2 focus:ring-danger-500/30"
                              aria-label={`Remove ${student.name.first} ${student.name.last}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-right text-xs font-medium text-slate-400">Read only</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {totalPages > 1 && (
        <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <StudentFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['students'] });
          setAddOpen(false);
        }}
      />
      {editStudent && (
        <StudentFormModal
          open
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            setEditStudent(null);
          }}
        />
      )}
      {qrStudent && (
        <Modal
          open
          onClose={() => setQrStudent(null)}
          title={`QR Code - ${qrStudent.name.first} ${qrStudent.name.last}`}
          description="Use this QR for attendance scanning."
          size="sm"
        >
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="rounded-xl border-2 border-surface-border bg-white p-4 shadow-inner">
              {qrStudent.qrCodeUrl ? (
                <img src={qrStudent.qrCodeUrl} alt={`QR code for ${qrStudent.name.first} ${qrStudent.name.last}`} className="h-48 w-48 object-contain" />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-surface-muted text-slate-300">
                  <QrCode className="h-12 w-12" />
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-800">{qrStudent.studentId}</p>
              <p className="text-xs text-slate-400">{qrStudent.section} - {YEAR_LABELS[qrStudent.yearLevel]}</p>
            </div>
            <Button variant="secondary" size="sm" className="w-full" onClick={() => window.print()}>
              <Download className="h-4 w-4" /> Print QR
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );

  if (isComponent) return content;

  return (
    <PageWrapper
      title="Student Directory"
      description={`${total} student records registered for attendance and reporting.`}
    >
      {content}
    </PageWrapper>
  );
}

function DirectoryMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: ElementType;
}) {
  return (
    <Card>
      <CardBody className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Icon className="h-5 w-5" />
        </div>
      </CardBody>
    </Card>
  );
}

function StudentFormModal({
  open,
  student,
  onClose,
  onSuccess,
}: {
  open: boolean;
  student?: Student;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = Boolean(student);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: student
      ? {
          studentId: student.studentId,
          firstName: student.name.first,
          lastName: student.name.last,
          email: student.email,
          section: student.section,
          yearLevel: student.yearLevel,
        }
      : { yearLevel: 1 },
  });

  const mutation = useMutation({
    mutationFn: (values: FormData) => {
      const body = {
        studentId: values.studentId,
        name: { first: values.firstName, last: values.lastName },
        email: values.email,
        section: values.section,
        yearLevel: values.yearLevel,
      };
      return isEdit ? api.patch(`/students/${student!._id}`, body) : api.post('/students', body);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Student updated' : 'Student added');
      reset();
      onSuccess();
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Failed to save student'),
  });

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={isEdit ? 'Edit Student' : 'Add Student'}
      description="Student records live here. Account access is created from People."
      size="lg"
    >
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First Name" required error={errors.firstName?.message} {...register('firstName')} />
          <Input label="Last Name" required error={errors.lastName?.message} {...register('lastName')} />
        </div>
        <Input label="Student ID" required error={errors.studentId?.message} {...register('studentId')} />
        <Input label="Email" type="email" autoComplete="email" required error={errors.email?.message} {...register('email')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Section" placeholder="e.g. BSIT 3-A" required error={errors.section?.message} {...register('section')} />
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Year Level <span className="text-danger">*</span>
            </label>
            <select
              {...register('yearLevel')}
              className="h-10 w-full rounded-lg border border-surface-border bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              {[1, 2, 3, 4].map((year) => (
                <option key={year} value={year}>{YEAR_LABELS[year]}</option>
              ))}
            </select>
            {errors.yearLevel && <p className="mt-1 text-xs text-danger">{errors.yearLevel.message}</p>}
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Update Student' : 'Add Student'}</Button>
        </div>
      </form>
    </Modal>
  );
}
