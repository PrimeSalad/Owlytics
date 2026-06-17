import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, Mail, Shield, Camera, Check, X, Hash, Calendar, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout';
import { Button, Card, CardBody, Input, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { cn, roleLabel, AVATAR_COLORS } from '@/lib/utils';

/** Downscale + center-crop to a small square JPEG so avatars stay compact and load fast. */
function resizeImage(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode failed'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no canvas'));
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function SettingsPage() {
  const { user, fetchMe } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.name.first || '');
  const [lastName, setLastName] = useState(user?.name.last || '');
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor ?? 0);
  const [avatarImage, setAvatarImage] = useState<string | null>(user?.avatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: { firstName: string; lastName: string; avatarColor?: number; avatarImage?: string | null }) =>
      api.patch(`/users/${user!._id}`, {
        name: { first: data.firstName, last: data.lastName },
        avatarColor: data.avatarColor,
        avatarImage: data.avatarImage,
      }),
    onSuccess: async () => {
      toast.success('Profile updated successfully');
      await fetchMe();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Failed to update profile'),
  });

  const passwordMutation = useMutation({
    mutationFn: () => api.patch('/auth/me/password', { currentPassword, newPassword }),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Failed to change password'),
  });

  const handleChangePassword = () => {
    if (newPassword.length < 8) return toast.error('New password must be at least 8 characters');
    if (newPassword !== confirmPassword) return toast.error('New passwords do not match');
    passwordMutation.mutate();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    try {
      setAvatarImage(await resizeImage(file));
    } catch {
      toast.error('Could not read that image. Try another one.');
    } finally {
      // allow re-selecting the same file
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const currentColor = AVATAR_COLORS[avatarColor];

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    }).format(new Date(dateString));
  };

  return (
    <PageWrapper title="Profile & Settings" description="Manage your account details and system preferences.">
      <div className="space-y-6">
        <Card>
          <CardBody className="p-8 space-y-8">
            {/* Header & Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Account Configuration</h3>
                <p className="mt-1 text-sm text-slate-500">Update your operational identity within Owlytics.</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className={cn(
                  "font-bold uppercase tracking-wider",
                  user?.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                )}>
                  {user?.isActive ? 'Active Account' : 'Deactivated'}
                </Badge>
                <Badge variant="default" className="bg-brand-50 text-brand-700 font-bold uppercase tracking-wider">
                  {roleLabel(user?.role ?? '')}
                </Badge>
              </div>
            </div>

            {/* Avatar Section */}
            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Visual Identity</h4>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {avatarImage ? (
                    <img src={avatarImage} alt="Avatar" className="h-24 w-24 rounded-full object-cover shadow-lg ring-4 ring-white" />
                  ) : (
                    <div className={cn('flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br text-2xl font-bold text-white shadow-lg ring-4 ring-white', currentColor.from, currentColor.to)}>
                      {firstName[0]}{lastName[0]}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg transition hover:bg-brand-600"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-700">Avatar Color Theme</p>
                    {avatarImage && (
                      <button
                        onClick={() => setAvatarImage(null)}
                        className="text-xs font-medium text-slate-400 hover:text-slate-600 underline"
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_COLORS.map((color, idx) => (
                      <button
                        key={idx}
                        onClick={() => setAvatarColor(idx)}
                        className={cn(
                          'relative h-10 w-10 rounded-full bg-gradient-to-br shadow-sm transition hover:scale-110',
                          color.from,
                          color.to,
                          avatarColor === idx && 'ring-2 ring-slate-900 ring-offset-2 shadow-md'
                        )}
                      >
                        {avatarColor === idx && (
                          <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Profile Information */}
            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Personal Information</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  leftIcon={<User className="h-4 w-4" />}
                  required
                />
                <Input
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  leftIcon={<User className="h-4 w-4" />}
                  required
                />
              </div>
            </div>

            {/* System Details (Read-only) */}
            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">System Identifiers (Read-only)</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Student ID Number"
                  value={user?.studentId || ''}
                  disabled
                  leftIcon={<Hash className="h-4 w-4" />}
                  hint="Your official university identification."
                />
                <Input
                  label="Email Address"
                  value={user?.email || ''}
                  disabled
                  leftIcon={<Mail className="h-4 w-4" />}
                  hint="Used for authentication and notifications."
                />
                <Input
                  label="Access Role"
                  value={roleLabel(user?.role ?? '')}
                  disabled
                  leftIcon={<Shield className="h-4 w-4" />}
                  hint="Determines your system permissions."
                />
                <Input
                  label="Date Joined"
                  value={formatDate(user?.createdAt)}
                  disabled
                  leftIcon={<Calendar className="h-4 w-4" />}
                  hint="When this account was provisioned."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-6">
              <button
                onClick={() => {
                  setFirstName(user?.name.first || '');
                  setLastName(user?.name.last || '');
                  setAvatarColor(user?.avatarColor ?? 0);
                  setAvatarImage(user?.avatarUrl || null);
                }}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
              >
                <X className="h-4 w-4" />
                Discard Changes
              </button>
              <Button
                onClick={() => mutation.mutate({ firstName, lastName, avatarColor, avatarImage })}
                loading={mutation.isPending}
                disabled={!firstName.trim() || !lastName.trim()}
                size="lg"
              >
                <Check className="h-4 w-4" />
                Save Profile
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Password & Security */}
        <Card>
          <CardBody className="p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Password & Security</h3>
                <p className="mt-0.5 text-sm text-slate-500">Change the password you use to sign in.</p>
              </div>
            </div>

            <div className="grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
              <Input
                label="Current Password"
                type={showPw ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                autoComplete="current-password"
                placeholder="••••••••"
                rightIcon={
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="text-slate-400 hover:text-slate-600" aria-label={showPw ? 'Hide passwords' : 'Show passwords'}>
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <div className="hidden sm:block" />
              <Input
                label="New Password"
                type={showPw ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                hint="Use at least 8 characters."
              />
              <Input
                label="Confirm New Password"
                type={showPw ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                autoComplete="new-password"
                placeholder="Re-type new password"
                error={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : undefined}
              />
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-6">
              <Button
                onClick={handleChangePassword}
                loading={passwordMutation.isPending}
                disabled={!currentPassword || !newPassword || !confirmPassword}
              >
                <KeyRound className="h-4 w-4" />
                Update Password
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </PageWrapper>
  );
}
