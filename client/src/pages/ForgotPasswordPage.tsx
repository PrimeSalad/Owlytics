import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Mail, MailCheck } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Button, Input } from '@/components/ui';
import logo from '@/assets/logo.png';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { user } = useAuthStore();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      // Always show success to avoid leaking which emails exist.
      setSent(true);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Could not send reset email.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="w-full max-w-[380px]">
        <div className="mb-10 flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#0a1612] shadow-sm">
            <img src={logo} alt="Owlytics" className="h-5 w-5 object-contain brightness-0 invert" />
          </div>
          <div>
            <p className="font-display text-xl font-bold text-slate-900 tracking-tight">Owlytics</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">Student Monitor</p>
          </div>
        </div>

        {sent ? (
          <div className="space-y-5">
            <div className="h-12 w-12 rounded-full bg-success-50 flex items-center justify-center">
              <MailCheck className="h-6 w-6 text-success-600" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Check your email</h2>
              <p className="mt-2 text-sm text-slate-500 font-medium leading-relaxed">
                If an account exists for <span className="font-semibold text-slate-700">{getValues('email')}</span>, we&apos;ve
                sent a password reset link. Open it on this device to choose a new password.
              </p>
            </div>
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h2 className="font-display text-3xl font-bold text-slate-900 tracking-tight">Forgot password?</h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              Enter your email and we&apos;ll send you a secure link to reset it.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
              <Input
                label="Email address"
                type="email"
                placeholder="you@org.edu"
                autoComplete="email"
                required
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <Button type="submit" className="w-full" loading={loading} size="lg">
                Send reset link
              </Button>
            </form>

            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
