import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { Button, Input } from '@/components/ui';
import logo from '@/assets/logo.png';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { user, login, isLoading } = useAuthStore();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ??
        'Login failed. Check your credentials.';
      toast.error(msg);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel ─────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-14 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0a1a14 0%, #0d2b1f 50%, #0f3d2a 100%)' }}
      >
        {/* Subtle radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 30% 60%, rgba(16,185,129,0.12) 0%, transparent 70%)' }}
        />

        {/* Brand */}
        <div className="relative flex items-center gap-3">
          <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/8 border border-white/10">
            <img src={logo} alt="Owlytics" className="h-5 w-5 object-contain brightness-0 invert" />
          </div>
          <div>
            <p className="font-display text-base font-semibold tracking-tight">Owlytics</p>
            <p className="text-[10px] text-white/35 uppercase tracking-widest">Student Monitor</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative">
          <h1 className="font-display text-[2.75rem] font-semibold leading-[1.1] tracking-tight text-white">
            Smart attendance.<br />
            <span className="text-brand-400">Zero paperwork.</span>
          </h1>
          <p className="mt-5 text-base text-white/50 leading-relaxed max-w-xs">
            QR-based attendance, real-time emergency alerts, and one-click accomplishment reports for student organizations.
          </p>

          {/* Feature list */}
          <ul className="mt-8 space-y-2.5">
            {[
              'QR code attendance with offline sync',
              'Live emergency reporting to officers',
              'Auto-generated PDF accomplishment reports',
              'Role-based access for your entire org',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/20">
          © {new Date().getFullYear()} Owlytics. Built for high-performance student organizations.
        </p>
      </div>

      {/* ── Right panel ────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center bg-white p-6">
        <div className="w-full max-w-[360px]">

          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#0a1612]">
              <img src={logo} alt="Owlytics" className="h-5 w-5 object-contain brightness-0 invert" />
            </div>
            <div>
              <p className="font-display text-base font-semibold text-slate-900">Owlytics</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Student Monitor</p>
            </div>
          </div>

          <h2 className="font-display text-2xl font-semibold text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-400">Enter your credentials to access your dashboard.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
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

            <Input
              label="Password"
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
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

            <Button type="submit" className="w-full" loading={isLoading} size="lg">
              Sign in to Owlytics
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Forgot your password? Contact your organization administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
