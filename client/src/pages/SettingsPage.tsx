import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, Mail, Shield, Camera, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/layout';
import { Button, Card, CardBody, Input, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const AVATAR_COLORS = [
  { name: 'Brand', from: 'from-brand-400', to: 'to-brand-600' },
  { name: 'Purple', from: 'from-purple-400', to: 'to-purple-600' },
  { name: 'Blue', from: 'from-blue-400', to: 'to-blue-600' },
  { name: 'Green', from: 'from-green-400', to: 'to-green-600' },
  { name: 'Orange', from: 'from-orange-400', to: 'to-orange-600' },
  { name: 'Pink', from: 'from-pink-400', to: 'to-pink-600' },
  { name: 'Red', from: 'from-red-400', to: 'to-red-600' },
  { name: 'Teal', from: 'from-teal-400', to: 'to-teal-600' },
];

export function SettingsPage() {
  const { user, fetchMe } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.name.first || '');
  const [lastName, setLastName] = useState(user?.name.last || '');
  const [avatarColor, setAvatarColor] = useState(0);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: (data: { firstName: string; lastName: string; avatarColor?: number; avatarImage?: string | null }) =>
      api.patch(`/users/${user!._id}`, { 
        name: { first: data.firstName, last: data.lastName },
        avatarColor: data.avatarColor,
        avatarImage: data.avatarImage,
      }),
    onSuccess: () => {
      toast.success('Profile updated successfully');
      fetchMe();
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setAvatarImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const currentColor = AVATAR_COLORS[avatarColor];

  return (
    <PageWrapper title="Settings" description="Manage your profile and preferences.">
      <div className="space-y-6">
        {/* Profile Card */}
        <Card>
          <CardBody className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Profile Settings</h3>
                <p className="mt-1 text-sm text-slate-500">Customize your profile appearance and information</p>
              </div>
              <Badge variant="default" className="bg-brand-50 text-brand-700 font-bold">
                {user?.role}
              </Badge>
            </div>

            {/* Avatar Section */}
            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h4 className="text-sm font-bold text-slate-700">Profile Picture</h4>
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
                    <p className="text-sm font-semibold text-slate-700">Avatar Color</p>
                    {avatarImage && (
                      <button
                        onClick={() => setAvatarImage(null)}
                        className="text-xs text-slate-400 hover:text-slate-600 underline"
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
                          'relative h-10 w-10 rounded-full bg-gradient-to-br shadow-md transition hover:scale-110',
                          color.from,
                          color.to,
                          avatarColor === idx && 'ring-2 ring-slate-900 ring-offset-2'
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

            {/* Personal Info */}
            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h4 className="text-sm font-bold text-slate-700">Personal Information</h4>
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

              <Input
                label="Email Address"
                value={user?.email || ''}
                disabled
                leftIcon={<Mail className="h-4 w-4" />}
                hint="Contact an administrator to change your email"
              />

              <Input
                label="Role"
                value={user?.role || ''}
                disabled
                leftIcon={<Shield className="h-4 w-4" />}
                hint="Your role determines your access permissions"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-6">
              <button
                onClick={() => {
                  setFirstName(user?.name.first || '');
                  setLastName(user?.name.last || '');
                  setAvatarColor(0);
                  setAvatarImage(null);
                }}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
              >
                <X className="h-4 w-4" />
                Reset Changes
              </button>
              <Button
                onClick={() => mutation.mutate({ firstName, lastName, avatarColor, avatarImage })}
                loading={mutation.isPending}
                disabled={!firstName.trim() || !lastName.trim()}
                size="lg"
              >
                <Check className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </PageWrapper>
  );
}
