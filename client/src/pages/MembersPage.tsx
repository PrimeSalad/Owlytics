import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Edit2, Trash2, Users as UsersIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout';
import { Button, Card, CardBody, Modal, Input, Badge, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import type { User } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';


const createSchema = z.object({
  studentId: z.string().min(1, 'Student ID required'),
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['President', 'Secretary', 'Officer', 'Committee', 'Attendance']),
});
type CreateForm = z.infer<typeof createSchema>;

const updateSchema = z.object({
  role: z.enum(['President', 'Secretary', 'Officer', 'Committee', 'Attendance']),
  isActive: z.boolean(),
});
type UpdateForm = z.infer<typeof updateSchema>;

export function MembersPage({ isComponent = false }: { isComponent?: boolean }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get<User[]>('/users');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: CreateForm) => {
      await api.post('/users', {
        studentId: values.studentId,
        name: { first: values.firstName, last: values.lastName },
        email: values.email,
        password: values.password,
        role: values.role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setCreateOpen(false);
      toast.success('Member created');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? 'Failed to create member');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: UpdateForm }) => {
      await api.patch(`/users/${id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditUser(null);
      toast.success('Member updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? 'Failed to update member');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Member deactivated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? 'Failed to deactivate member');
    },
  });

  const content = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Organization Staff</h3>
        {!isComponent && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4" /> Add Member
          </Button>
        )}
        {isComponent && (
           <Button size="sm" variant="secondary" onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" /> Add Staff
          </Button>
        )}
      </div>

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="py-16 flex justify-center"><Spinner size="lg" /></div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center">
              <div className="h-12 w-12 bg-surface-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <UsersIcon className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500">No members found.</p>
            </div>

          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-muted/50 border-b border-surface-border text-left">
                    <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Member</th>
                    <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Student ID</th>
                    <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs",
                            u.role === 'President' ? 'bg-brand-500' : 'bg-slate-400'
                          )}>
                            {u.name.first[0]}{u.name.last[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{u.name.first} {u.name.last}</p>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-500">{u.studentId}</td>
                      <td className="px-6 py-4">
                        <Badge variant={u.role === 'President' ? 'primary' : 'default'} className="font-bold text-[10px]">
                          {u.role.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className={cn("h-1.5 w-1.5 rounded-full", u.isActive ? "bg-success-500" : "bg-danger-500")} />
                          <span className={cn("text-[11px] font-bold uppercase", u.isActive ? "text-success-600" : "text-danger-600")}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditUser(u)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Deactivate ${u.name.first} ${u.name.last}?`)) {
                                deleteMutation.mutate(u._id);
                              }
                            }}
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
      title="Members"
      description="Manage organization member accounts and role assignments."
    >
      {content}
    </PageWrapper>
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
    formState: { errors },
    reset,
  } = useForm<CreateForm>({ resolver: zodResolver(createSchema) });

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add New Member"
      description="Create a new organization member account."
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" required error={errors.firstName?.message} {...register('firstName')} />
          <Input label="Last Name" required error={errors.lastName?.message} {...register('lastName')} />
        </div>
        <Input label="Student ID" required error={errors.studentId?.message} {...register('studentId')} />
        <Input label="Email" type="email" required error={errors.email?.message} {...register('email')} />
        <Input
          label="Password"
          type="password"
          required
          hint="Minimum 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1.5 block">
            Role <span className="text-danger">*</span>
          </label>
          <select
            {...register('role')}
            className="w-full rounded border border-surface-border bg-white px-3 py-2 text-sm focus-ring focus:border-brand-400"
          >
            <option value="Secretary">Secretary</option>
            <option value="Officer">Officer</option>
            <option value="Committee">Committee</option>
            <option value="Attendance">Attendance</option>
            <option value="President">President</option>
          </select>
          {errors.role && <p className="text-xs text-danger mt-1">{errors.role.message}</p>}
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Member
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
    formState: { errors },
  } = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
    defaultValues: { role: user.role, isActive: user.isActive },
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit Member"
      description={`Update ${user.name.first} ${user.name.last}'s role and status.`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1.5 block">Role</label>
          <select
            {...register('role')}
            className="w-full rounded border border-surface-border bg-white px-3 py-2 text-sm focus-ring focus:border-brand-400"
          >
            <option value="Secretary">Secretary</option>
            <option value="Officer">Officer</option>
            <option value="Committee">Committee</option>
            <option value="Attendance">Attendance</option>
            <option value="President">President</option>
          </select>
          {errors.role && <p className="text-xs text-danger mt-1">{errors.role.message}</p>}
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" {...register('isActive')} className="rounded border-surface-border" />
          <span className="text-sm text-slate-700">Active</span>
        </label>
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Update
          </Button>
        </div>
      </form>
    </Modal>
  );
}
