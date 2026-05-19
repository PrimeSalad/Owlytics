import { type ElementType, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import QRCode from 'qrcode';
import {
  Download,
  Edit2,
  GraduationCap,
  Hash,
  Mail,
  Printer,
  QrCode,
  Search,
  Trash2,
  User as UserIcon,
  UserPlus,
  Users as UsersIcon,
  Users2,
  Plus,
  X,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout';
import { Badge, Button, Card, CardBody, Input, Modal, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Student } from '@/types';
import { useAuthStore } from '@/store/authStore';

const PAGE_SIZE = 15;

const schema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  section: z.string().min(1, 'Section is required'),
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
  const [sectionFilter, setSectionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [addDefaultSection, setAddDefaultSection] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [qrStudent, setQrStudent] = useState<Student | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const { data: sections = [], refetch: refetchSections } = useQuery({
    queryKey: ['student-sections'],
    queryFn: async () => (await api.get<string[]>('/students/sections')).data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, search, yearFilter, sectionFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search.trim()) params.set('search', search.trim());
      if (yearFilter) params.set('yearLevel', yearFilter);
      if (sectionFilter) params.set('section', sectionFilter);
      params.set('orderBy', 'section');
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

  const handlePrintFiltered = async () => {
    try {
      setIsPrinting(true);
      const params = new URLSearchParams({ limit: '1000' });
      if (search.trim()) params.set('search', search.trim());
      if (yearFilter) params.set('yearLevel', yearFilter);
      
      const { data } = await api.get(`/students?${params}`);
      const allFiltered: Student[] = data.students;

      if (allFiltered.length === 0) {
        toast.error('No students to print');
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to print');
        return;
      }

      // Generate QRs
      const qrs = await Promise.all(
        allFiltered.map(async (student) => {
          const qrData = `SMS|${student.studentId}|${student.name.first} ${student.name.last}|${student.section}`;
          const url = await QRCode.toDataURL(qrData, {
            width: 256,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
            errorCorrectionLevel: 'H',
          });
          return { ...student, qrUrl: url };
        })
      );

      let html = `
        <html>
          <head>
            <title>QR Codes</title>
            <style>
              body { font-family: sans-serif; margin: 0; padding: 20px; }
              .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
              .card { border: 1px solid #e2e8f0; padding: 15px; text-align: center; border-radius: 8px; page-break-inside: avoid; }
              img { width: 150px; height: 150px; }
              h3 { margin: 10px 0 5px; font-size: 16px; font-weight: bold; }
              p { margin: 0; font-size: 12px; color: #64748b; }
              .badge { display: inline-block; background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-size: 11px; margin-top: 5px; font-weight: bold; }
              @media print {
                body { padding: 0; }
                .grid { gap: 10px; }
              }
            </style>
          </head>
          <body>
            <h2>Student QR Codes ${search ? `(Search: ${search})` : ''} ${yearFilter ? `(Year ${yearFilter})` : ''}</h2>
            <p style="margin-bottom: 20px;">Total: ${allFiltered.length} students</p>
            <div class="grid">
      `;

      qrs.forEach((s) => {
        html += `
          <div class="card">
            <img src="${s.qrUrl}" />
            <h3>${s.name.first} ${s.name.last}</h3>
            <p>${s.studentId}</p>
            <div class="badge">${s.section}</div>
          </div>
        `;
      });

      html += `
            </div>
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate print view');
    } finally {
      setIsPrinting(false);
    }
  };

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
        <div className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-3xl">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name or student ID"
              className="h-10 w-full rounded-lg border border-surface-border bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Section filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={sectionFilter}
              onChange={(e) => { setSectionFilter(e.target.value); setPage(1); }}
              className="h-10 rounded-lg border border-surface-border bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">All sections</option>
              {sections.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <select
            value={yearFilter}
            onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
            className="h-10 rounded-lg border border-surface-border bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All years</option>
            {[1, 2, 3, 4].map((y) => <option key={y} value={y}>{YEAR_LABELS[y]}</option>)}
          </select>
        </div>

        {canManageStudents ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button onClick={handlePrintFiltered} variant="secondary" loading={isPrinting} className="w-full sm:w-auto">
              <Printer className="mr-2 h-4 w-4" /> Print QRs
            </Button>
            <Button onClick={() => setBulkOpen(true)} variant="secondary" className="w-full sm:w-auto">
              <Users2 className="mr-2 h-4 w-4" /> Bulk Add
            </Button>
            <Button onClick={() => setAddOpen(true)} className="w-full sm:w-auto">
              <UserPlus className="mr-2 h-4 w-4" /> Add Student
            </Button>
          </div>
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
        defaultSection={addDefaultSection}
        sections={sections}
        onClose={() => { setAddOpen(false); setAddDefaultSection(''); }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['students'] });
          refetchSections();
          setAddOpen(false);
          setAddDefaultSection('');
        }}
      />
      {editStudent && (
        <StudentFormModal
          open
          student={editStudent}
          sections={sections}
          onClose={() => setEditStudent(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            refetchSections();
            setEditStudent(null);
          }}
        />
      )}
      {qrStudent && (
        <StudentQRModal
          student={qrStudent}
          onClose={() => setQrStudent(null)}
        />
      )}
      {bulkOpen && (
        <BulkAddModal
          sections={sections}
          onClose={() => setBulkOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            refetchSections();
            setBulkOpen(false);
          }}
        />
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

function StudentQRModal({
  student,
  onClose,
}: {
  student: Student;
  onClose: () => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateQR = async () => {
      try {
        setLoading(true);
        // Standardized format: SMS|STUDENT_ID|NAME|SECTION
        const data = `SMS|${student.studentId}|${student.name.first} ${student.name.last}|${student.section}`;
        const url = await QRCode.toDataURL(data, {
          width: 512,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error('Failed to generate QR:', err);
        toast.error('Failed to generate QR code');
      } finally {
        setLoading(false);
      }
    };

    generateQR();
  }, [student]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${student.name.first} ${student.name.last}</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0; 
              font-family: sans-serif;
              text-align: center;
            }
            img { width: 300px; height: 300px; margin-bottom: 20px; }
            h1 { margin: 0; font-size: 24px; }
            p { margin: 5px 0; color: #666; }
            .badge { 
              background: #f1f5f9; 
              padding: 4px 12px; 
              border-radius: 99px; 
              font-size: 12px; 
              font-weight: bold;
              margin-top: 10px;
              display: inline-block;
            }
          </style>
        </head>
        <body>
          <img src="${qrDataUrl}" />
          <h1>${student.name.first} ${student.name.last}</h1>
          <p>${student.studentId}</p>
          <div class="badge">${student.section}</div>
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `QR_${student.studentId}_${student.name.last}.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Student QR Code"
      description="Scan this for attendance or save for printing."
      size="sm"
    >
      <div className="flex flex-col items-center gap-6 py-6">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-tr from-brand-500 to-brand-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative rounded-2xl border border-surface-border bg-white p-5 shadow-xl">
            {loading ? (
              <div className="flex h-48 w-48 items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Student QR Code"
                className="h-48 w-48 object-contain"
              />
            ) : (
              <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-surface-muted text-slate-300">
                <QrCode className="h-12 w-12" />
              </div>
            )}
          </div>
        </div>

        <div className="text-center space-y-1">
          <h4 className="text-lg font-bold text-slate-900 leading-tight">
            {student.name.first} {student.name.last}
          </h4>
          <p className="text-sm font-mono text-slate-500 font-medium">{student.studentId}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 border border-brand-100">
            {student.section}
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={handleDownload} disabled={!qrDataUrl}>
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
          <Button variant="primary" size="sm" onClick={handlePrint} disabled={!qrDataUrl}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      </div>
    </Modal>
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
  defaultSection = '',
  sections = [],
  onClose,
  onSuccess,
}: {
  open: boolean;
  student?: Student;
  defaultSection?: string;
  sections?: string[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = Boolean(student);
  const {
    register,
    handleSubmit,
    setValue,
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
        }
      : { section: defaultSection },
  });

  const mutation = useMutation({
    mutationFn: (values: FormData) => {
      const body = {
        studentId: values.studentId,
        name: { first: values.firstName, last: values.lastName },
        email: values.email,
        section: values.section,
        yearLevel: yearFromSection(values.section),
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
      size="xl"
    >
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-6 pt-2">
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Personal Information</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="First Name" placeholder="Juan" required leftIcon={<UserIcon className="h-4 w-4" />} error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Last Name" placeholder="Dela Cruz" required leftIcon={<UserIcon className="h-4 w-4" />} error={errors.lastName?.message} {...register('lastName')} />
          </div>
          <Input label="Email" type="email" placeholder="juan@university.edu.ph" autoComplete="email" required leftIcon={<Mail className="h-4 w-4" />} error={errors.email?.message} {...register('email')} />
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Academic Details</h4>
          <Input label="Student ID" placeholder="2021-0001" required leftIcon={<Hash className="h-4 w-4" />} hint="Used for QR code generation and matching." error={errors.studentId?.message} {...register('studentId')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <SectionPicker
              value={student?.section ?? defaultSection}
              existingSections={sections}
              error={errors.section?.message}
              onChange={(val) => setValue('section', val, { shouldValidate: true })}
            />
          </div>
        </div>
        
        <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Save Changes' : 'Add Student Record'}</Button>
        </div>
      </form>
    </Modal>
  );
}


const COURSES = ['BSI/T', 'BSIS'];
const YEARS = [1, 2, 3, 4];
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

const DEFAULT_SECTION_OPTIONS = COURSES.flatMap((course) =>
  YEARS.flatMap((year) => LETTERS.map((letter) => `${course} ${year}-${letter}`))
);

function SectionPicker({
  value,
  existingSections,
  error,
  onChange,
}: {
  value?: string;
  existingSections: string[];
  error?: string;
  onChange: (val: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [newSection, setNewSection] = useState('');

  const [managedSections, setManagedSections] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('owlytics_sections');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // Ignore parsing errors and fallback to defaults
    }
    return DEFAULT_SECTION_OPTIONS;
  });

  const saveSections = (sections: string[]) => {
    setManagedSections(sections);
    localStorage.setItem('owlytics_sections', JSON.stringify(sections));
  };

  const handleAdd = () => {
    const trimmed = newSection.trim().toUpperCase();
    if (trimmed && !managedSections.includes(trimmed)) {
      saveSections([...managedSections, trimmed].sort());
    }
    setNewSection('');
  };

  const handleRemove = (sec: string) => {
    saveSections(managedSections.filter((s) => s !== sec));
    if (value === sec) onChange('');
  };

  const sel =
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition hover:border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 cursor-pointer';

  return (
    <div className="relative">
      <div className="mb-1.5 flex items-center justify-between">
        <label className="block text-xs font-medium text-slate-600">
          Section <span className="text-danger-500">*</span>
        </label>
        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="text-[10px] font-bold text-brand-600 hover:text-brand-700 uppercase tracking-wider"
        >
          {isEditing ? 'Done' : 'Edit Options'}
        </button>
      </div>

      {isEditing ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
              placeholder="e.g. BSI/T 5-A"
              className="h-8 flex-1 rounded border border-slate-200 px-2 text-xs outline-none focus:border-brand-500"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            />
            <Button type="button" size="sm" onClick={handleAdd}>
              Add
            </Button>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
            {managedSections.map((opt) => (
              <div key={opt} className="flex items-center justify-between rounded bg-white px-2 py-1.5 border border-slate-100 shadow-sm">
                <span className="text-xs font-medium text-slate-700">{opt}</span>
                <button type="button" onClick={() => handleRemove(opt)} className="text-slate-400 hover:text-danger-500">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {managedSections.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-2">No options.</p>
            )}
          </div>
        </div>
      ) : (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={sel}
        >
          <option value="">Select Section</option>
          {managedSections.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {error && !isEditing && <p className="mt-1 text-xs text-danger-500">{error}</p>}
    </div>
  );
}

// ─── Bulk Add Modal ───────────────────────────────────────────────────────────

interface BulkRow {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
}

function makeRow(id: number): BulkRow {
  return { id, studentId: '', firstName: '', lastName: '', email: '' };
}

/** Derive yearLevel from section string e.g. "BSIT 3-A" → 3 */
function yearFromSection(section: string): number {
  const m = section.match(/\s(\d)-/);
  return m ? Number(m[1]) : 1;
}

function BulkAddModal({
  sections,
  onClose,
  onSuccess,
}: {
  sections: string[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [tab, setTab] = useState<'manual' | 'csv'>('manual');
  const [section, setSection] = useState('');
  const [rows, setRows] = useState<BulkRow[]>([makeRow(1), makeRow(2), makeRow(3)]);
  const [csvText, setCsvText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const nextId = useRef(4);
  const fileRef = useRef<HTMLInputElement>(null);

  const addRow = () => setRows((prev) => [...prev, makeRow(nextId.current++)]);
  const removeRow = (id: number) => setRows((prev) => prev.filter((r) => r.id !== id));
  const updateRow = (id: number, field: keyof Omit<BulkRow, 'id'>, value: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  /** Parse CSV: studentId,firstName,lastName,email (header optional) */
  const parseCsv = (text: string): BulkRow[] => {
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    const parsed: BulkRow[] = [];
    for (const line of lines) {
      const [a, b, c, d] = line.split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
      // skip header row
      if (!a || a.toLowerCase() === 'studentid' || a.toLowerCase() === 'student_id' || a.toLowerCase() === 'student id') continue;
      if (a && b && c && d) {
        parsed.push({ id: nextId.current++, studentId: a, firstName: b, lastName: c, email: d });
      }
    }
    return parsed;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      const parsed = parseCsv(text);
      if (parsed.length) {
        setRows(parsed);
        toast.success(`${parsed.length} rows loaded from CSV`);
      } else {
        toast.error('No valid rows found. Expected: studentId,firstName,lastName,email');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCsvApply = () => {
    const parsed = parseCsv(csvText);
    if (!parsed.length) { toast.error('No valid rows. Expected: studentId,firstName,lastName,email'); return; }
    setRows(parsed);
    toast.success(`${parsed.length} rows loaded`);
  };

  const buildStudents = (sourceRows: BulkRow[]) =>
    sourceRows
      .filter((r) => r.studentId.trim() && r.firstName.trim() && r.lastName.trim() && r.email.trim())
      .map((r) => ({
        studentId: r.studentId.trim(),
        name: { first: r.firstName.trim(), last: r.lastName.trim() },
        email: r.email.trim(),
        section,
        yearLevel: yearFromSection(section),
      }));

  const handleSubmit = async () => {
    if (!section) { toast.error('Please select a section first'); return; }
    const students = buildStudents(rows);
    if (!students.length) { toast.error('Fill in at least one complete row'); return; }
    try {
      setSubmitting(true);
      await api.post('/students/bulk', { students });
      toast.success(`${students.length} student${students.length > 1 ? 's' : ''} added`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Bulk add failed');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'h-9 w-full rounded border border-slate-200 bg-white px-2 text-xs text-slate-800 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20';

  const validCount = buildStudents(rows).length;

  return (
    <Modal open onClose={onClose} title="Bulk Add Students" description="Select a section once — year level is derived automatically." size="2xl">
      <div className="space-y-5 pt-1">
        {/* Section picker */}
        <SectionPicker value={section} existingSections={sections} onChange={setSection} />

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
          {(['manual', 'csv'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'rounded-md px-4 py-1.5 text-xs font-semibold transition-all',
                tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {t === 'manual' ? 'Manual Entry' : 'Import CSV'}
            </button>
          ))}
        </div>

        {tab === 'manual' ? (
          <div>
            {/* Column headers */}
            <div className="mb-2 grid grid-cols-[1.2fr_1fr_1fr_1.5fr_32px] gap-2 px-1">
              {['Student ID', 'First Name', 'Last Name', 'Email', ''].map((h) => (
                <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</span>
              ))}
            </div>

            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {rows.map((row) => (
                <div key={row.id} className="grid grid-cols-[1.2fr_1fr_1fr_1.5fr_32px] gap-2 items-center">
                  <input value={row.studentId} onChange={(e) => updateRow(row.id, 'studentId', e.target.value)} placeholder="2021-0001" className={inputCls} />
                  <input value={row.firstName} onChange={(e) => updateRow(row.id, 'firstName', e.target.value)} placeholder="Juan" className={inputCls} />
                  <input value={row.lastName} onChange={(e) => updateRow(row.id, 'lastName', e.target.value)} placeholder="Dela Cruz" className={inputCls} />
                  <input value={row.email} onChange={(e) => updateRow(row.id, 'email', e.target.value)} placeholder="juan@uni.edu.ph" type="email" className={inputCls} />
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length === 1}
                    className="flex h-9 w-8 items-center justify-center rounded text-slate-400 transition hover:bg-danger-50 hover:text-danger-600 disabled:opacity-30"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button type="button" onClick={addRow} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700">
              <Plus className="h-3.5 w-3.5" /> Add row
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              CSV format: <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">studentId,firstName,lastName,email</code> — one student per line. Header row is optional.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Upload .csv file
              </Button>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileUpload} />
            </div>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={"2021-0001,Juan,Dela Cruz,juan@uni.edu.ph\n2021-0002,Maria,Santos,maria@uni.edu.ph"}
              rows={10}
              className="w-full rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs text-slate-800 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 resize-none"
            />
            <Button variant="secondary" size="sm" onClick={handleCsvApply}>
              Preview rows
            </Button>
            {rows.some((r) => r.studentId) && (
              <p className="text-xs font-semibold text-brand-600">{validCount} valid row{validCount !== 1 ? 's' : ''} ready to submit</p>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting} disabled={!section || validCount === 0}>
            Add {validCount > 0 ? validCount : ''} Student{validCount !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
