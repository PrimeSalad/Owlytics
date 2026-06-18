import { type ElementType, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit2,
  Info,
  LockKeyhole,
  MapPin,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users as UsersIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout';
import { Badge, Button, Card, CardBody, EmptyState, Input, Modal, SectionSelector, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { User, UserRole } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn, roleLabel, roleSatisfies } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const roles = ['President', 'Secretary', 'Officer', 'Committee', 'Attendance', 'VicePresident', 'Adviser'] as const;

const createSchema = z.object({
  studentId: z.string().min(1, 'Access ID is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(roles),
  sectionId: z.string().uuid('Invalid section ID').optional(),
}).refine(
  (data) => {
    if (data.role === 'Attendance') return !!data.sectionId;
    return true;
  },
  { message: 'Section is required for Attendance role', path: ['sectionId'] }
);
type CreateForm = z.infer<typeof createSchema>;

const updateSchema = z.object({
  role: z.enum(roles),
  isActive: z.boolean(),
  sectionId: z.string().nullable().optional(),
}).refine(
  (data) => {
    if (data.role === 'Attendance') return !!data.sectionId;
    return true;
  },
  { message: 'Section is required for Attendance role', path: ['sectionId'] }
);
type UpdateForm = z.infer<typeof updateSchema>;

const roleBadge: Record<UserRole, 'primary' | 'info' | 'warning' | 'default' | 'success'> = {
  President: 'primary',
  Secretary: 'info',
  Officer: 'warning',
  Committee: 'default',
  Attendance: 'success',
  Adviser: 'primary',
  VicePresident: 'info',
};

export function MembersPage({ isComponent = false }: { isComponent?: boolean }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | UserRole>('All');
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const canManageAccess = roleSatisfies(user?.role, ['President']);

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get<User[]>('/users');
      return data;
    },
  });

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        !q ||
        `${u.name.first} ${u.name.last}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.studentId.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [roleFilter, search, users]);

  const activeCount = users.filter((u) => u.isActive).length;
  const managerCount = users.filter((u) => roleSatisfies(u.role, ['President', 'Secretary'])).length;

  const createMutation = useMutation({
    mutationFn: async (values: CreateForm) => {
      await api.post('/users', {
        studentId: values.studentId,
        name: { first: values.firstName, last: values.lastName },
        email: values.email,
        password: values.password,
        role: values.role,
        sectionId: values.sectionId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setCreateOpen(false);
      toast.success('Account access created');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? 'Failed to create account access');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: UpdateForm }) => {
      await api.patch(`/users/${id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditUser(null);
      toast.success('Account access updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? 'Failed to update account access');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Account deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? 'Failed to delete account'),
  });

  const content = (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <AccessMetric label="Total accounts" value={users.length} icon={UsersIcon} />
        <AccessMetric label="Active access" value={activeCount} icon={ShieldCheck} />
        <AccessMetric label="Admin roles" value={managerCount} icon={LockKeyhole} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-2xl">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search account, email, or access ID"
              className="h-10 w-full rounded-lg border border-surface-border bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'All' | UserRole)}
            className="h-10 rounded-lg border border-surface-border bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            aria-label="Filter accounts by role"
          >
            <option value="All">All roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>{roleLabel(role)}</option>
            ))}
          </select>
        </div>

        {canManageAccess ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
              <UserPlus className="h-4 w-4" /> Add Account Access
            </Button>
          </div>
        ) : (
          <Badge variant="default" className="w-fit">View only</Badge>
        )}
      </div>

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : error ? (
            <EmptyState
              icon={Info}
              title="Failed to load accounts"
              description={(error as any)?.response?.data?.error ?? (error as any)?.message ?? 'Unknown error'}
            />
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="No account access found"
              description="Adjust the search or role filter."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-muted/70 text-left">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Account</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Access ID</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Role</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Assigned</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="transition-colors hover:bg-surface-muted/40">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                              roleSatisfies(u.role, ['President']) ? 'bg-brand-600' : 'bg-slate-500'
                            )}
                          >
                            {u.name.first[0]}{u.name.last[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">{u.name.first} {u.name.last}</p>
                            <p className="truncate text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{u.studentId}</td>
                      <td className="px-6 py-4">
                        <Badge variant={roleBadge[u.role]}>{roleLabel(u.role)}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        {u.assignedSection ? (
                          <span className="inline-flex max-w-[180px] items-center gap-1.5 rounded-lg border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{u.assignedSection}</span>
                          </span>
                        ) : u.role === 'Attendance' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                            <Info className="h-3 w-3 shrink-0" /> No section yet
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn('h-2 w-2 rounded-full', u.isActive ? 'bg-success-500' : 'bg-danger-500')} />
                          <span className={cn('text-xs font-bold uppercase', u.isActive ? 'text-success-700' : 'text-danger-700')}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {canManageAccess ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setEditUser(u)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-brand-50 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                              aria-label={`Edit ${u.name.first} ${u.name.last}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete ${u.name.first} ${u.name.last}'s account? This cannot be undone.`)) {
                                  deleteMutation.mutate(u._id);
                                }
                              }}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-danger-50 hover:text-danger-700 focus:outline-none focus:ring-2 focus:ring-danger-500/30"
                              aria-label={`Delete ${u.name.first} ${u.name.last}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-right text-xs font-medium text-slate-400">Restricted</p>
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

      <CreateMemberModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(v) => createMutation.mutate(v)}
        loading={createMutation.isPending}
      />

      {editUser && (
        <EditMemberModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSubmit={(v) => updateMutation.mutate({ id: editUser._id, values: v })}
          loading={updateMutation.isPending}
        />
      )}
    </div>
  );

  if (isComponent) return content;

  return (
    <PageWrapper
      title="People"
      description="Create and control account access for organization users."
    >
      {content}
    </PageWrapper>
  );
}

/** Explains what assigning a section to an Attendance member actually does. */
function AttendanceAssignmentNote() {
  return (
    <div className="flex gap-2.5 rounded-xl border border-brand-100 bg-brand-50/60 p-3">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
      <p className="text-xs leading-relaxed text-brand-800">
        <span className="font-semibold">Attendance members are tied to one section.</span> Pick the section
        below and this account will only see and scan the students assigned to it.
      </p>
    </div>
  );
}

function AccessMetric({
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

function CreateMemberModal({
  open,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (v: CreateForm) => void;
  loading: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'Officer' },
  });

  const selectedRole = watch('role');
  const sectionId = watch('sectionId');

  // Drop any stale section assignment the moment the role no longer needs one,
  // so a non-Attendance account can never be saved with a leftover section.
  useEffect(() => {
    if (selectedRole !== 'Attendance' && sectionId) {
      setValue('sectionId', undefined, { shouldValidate: true });
    }
  }, [selectedRole, sectionId, setValue]);

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add Account Access"
      description="Create login credentials and assign the correct system role."
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First Name" required error={errors.firstName?.message} {...register('firstName')} />
          <Input label="Last Name" required error={errors.lastName?.message} {...register('lastName')} />
        </div>
        <Input
          label="Access ID"
          required
          hint="Use an org ID or school ID for traceability."
          error={errors.studentId?.message}
          {...register('studentId')}
        />
        <Input label="Email" type="email" autoComplete="email" required error={errors.email?.message} {...register('email')} />
        <Input
          label="Temporary Password"
          type="password"
          autoComplete="new-password"
          required
          hint="Minimum 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Role <span className="text-danger">*</span>
          </label>
          <select
            {...register('role')}
            className="h-10 w-full rounded-lg border border-surface-border bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="Officer">Officer</option>
            <option value="Committee">Committee</option>
            <option value="Attendance">Attendance Committee</option>
            <option value="Secretary">Secretary</option>
            <option value="VicePresident">Vice President</option>
            <option value="President">President</option>
            <option value="Adviser">Adviser</option>
          </select>
          {errors.role && <p className="mt-1 text-xs text-danger">{errors.role.message}</p>}
        </div>

        {selectedRole === 'Attendance' && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
            <AttendanceAssignmentNote />
            <SectionSelector
              value={sectionId}
              onChange={(id) => setValue('sectionId', id || undefined, { shouldValidate: true })}
              required
              onlyActiveDirectory={true}
              error={errors.sectionId?.message}
              hint="This member will only scan and manage students in this section."
            />
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Account
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EditMemberModal({
  user,
  onClose,
  onSubmit,
  loading,
}: {
  user: User;
  onClose: () => void;
  onSubmit: (v: UpdateForm) => void;
  loading: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
    defaultValues: { 
      role: user.role, 
      isActive: user.isActive, 
      sectionId: user.sectionId || null 
    },
  });
  
  const selectedRole = watch('role');
  const sectionId = watch('sectionId');

  // When the role moves away from Attendance, explicitly clear the section so the
  // backend wipes section_id (null) instead of keeping a stale assignment.
  useEffect(() => {
    if (selectedRole !== 'Attendance' && sectionId) {
      setValue('sectionId', null, { shouldValidate: true });
    }
  }, [selectedRole, sectionId, setValue]);

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit Account Access"
      description={`Update ${user.name.first} ${user.name.last}'s role and active status.`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">Role</label>
          <select
            {...register('role')}
            className="h-10 w-full rounded-lg border border-surface-border bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          >
            {roles.map((role) => (
              <option key={role} value={role}>{roleLabel(role)}</option>
            ))}
          </select>
          {errors.role && <p className="mt-1 text-xs text-danger">{errors.role.message}</p>}
        </div>
        
        {selectedRole === 'Attendance' && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
            <AttendanceAssignmentNote />
            <SectionSelector
              value={sectionId || undefined}
              onChange={(id) => setValue('sectionId', id || null, { shouldValidate: true })}
              required
              onlyActiveDirectory={true}
              error={errors.sectionId?.message}
              hint="This member will only scan and manage students in this section."
            />
          </div>
        )}
        
        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-surface-border px-3 py-2">
          <input type="checkbox" {...register('isActive')} className="rounded border-surface-border text-brand-600 focus:ring-brand-500" />
          <span className="text-sm font-medium text-slate-700">Account is active</span>
        </label>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Update Access
          </Button>
        </div>
      </form>
    </Modal>
  );
}
