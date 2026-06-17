import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { Button, Input, PageSpinner } from '@/components/ui';
import logo from '@/assets/logo.png';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });
type FormData = z.infer<typeof schema>;

type Phase = 'verifying' | 'ready' | 'invalid';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('verifying');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Supabase parses the recovery token from the URL hash and emits PASSWORD_RECOVERY.
  // It may also already have created a session by the time this mounts.
  useEffect(() => {
    let resolved = false;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        resolved = true;
        setPhase('ready');
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        resolved = true;
        setPhase('ready');
      }
    });

    // Give Supabase a moment to process the URL hash before declaring the link invalid.
    const timer = setTimeout(() => {
      if (!resolved) setPhase('invalid');
    }, 2500);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) throw error;
      toast.success('Password updated. Please sign in.');
      await supabase.auth.signOut();
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Could not update password.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (phase === 'verifying') return <PageSpinner />;

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

        {phase === 'invalid' ? (
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Link expired</h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link to="/forgot-password" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
              <ArrowLeft className="h-4 w-4" /> Request a new link
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 h-12 w-12 rounded-full bg-brand-50 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-brand-600" />
            </div>
            <h2 className="font-display text-3xl font-bold text-slate-900 tracking-tight">Set a new password</h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">Choose a strong password you haven&apos;t used before.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
              <Input
                label="New password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />

              <Input
                label="Confirm password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.confirm?.message}
                {...register('confirm')}
              />

              <Button type="submit" className="w-full" loading={loading} size="lg">
                Update password
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
