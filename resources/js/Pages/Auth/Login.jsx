import { Head, Link, useForm } from '@inertiajs/react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Login" />

            <div className="min-h-screen bg-ocean-deep flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full bg-biolum/[0.03] blur-[120px] animate-pulse" style={{ animationDuration: '8s' }}></div>
                    <div className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-purple-500/[0.03] blur-[100px] animate-pulse" style={{ animationDuration: '12s' }}></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-biolum/[0.02] blur-[80px] animate-pulse" style={{ animationDuration: '6s' }}></div>
                </div>

                {/* Logo */}
                <div className="relative z-10 mb-8 text-center flex flex-col items-center">
                    <div className="flex items-center justify-center gap-0 mb-1">
                        <h1 className="text-[5rem] leading-none mb-4 font-medium text-ocean-text tracking-wide" style={{ fontFamily: '"Pacifico", cursive' }}>Daloy</h1>
                    </div>
                    <p className="text-sm text-ocean-text-muted mt-1">Dive into the current</p>
                </div>

                {/* Login Card */}
                <div className="relative z-10 w-full max-w-md">
                    <div className="bg-ocean-card/80 backdrop-blur-xl border border-ocean-border rounded-2xl p-8">
                        <h2 className="text-xl font-bold text-ocean-text mb-1">Welcome back</h2>
                        <p className="text-sm text-ocean-text-dim mb-6">Sign in to continue your voyage</p>

                        {status && (
                            <div className="mb-4 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-5">
                            {/* Email */}
                            <div>
                                <InputLabel htmlFor="email" value="Email Address" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    autoComplete="username"
                                    isFocused={true}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="you@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <InputLabel htmlFor="password" value="Password" className="!mb-0" />
                                    {canResetPassword && (
                                        <Link
                                            href="/forgot-password"
                                            className="text-xs text-biolum hover:text-biolum-glow transition-colors"
                                        >
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                />
                                <InputError message={errors.password} />
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center gap-2">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="w-4 h-4 rounded border-ocean-border bg-ocean-surface text-biolum focus:ring-biolum/30 focus:ring-offset-0"
                                />
                                <label htmlFor="remember" className="text-sm text-ocean-text-muted cursor-pointer select-none">
                                    Remember me
                                </label>
                            </div>

                            {/* Submit */}
                            <PrimaryButton disabled={processing}>
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign in'
                                )}
                            </PrimaryButton>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-6">
                            <div className="flex-1 h-px bg-ocean-border"></div>
                            <span className="text-xs text-ocean-text-dim">or</span>
                            <div className="flex-1 h-px bg-ocean-border"></div>
                        </div>

                        {/* Register Link */}
                        <p className="text-center text-sm text-ocean-text-muted">
                            Don't have an account?{' '}
                            <Link
                                href="/register"
                                className="text-biolum font-semibold hover:text-biolum-glow transition-colors"
                            >
                                Create one
                            </Link>
                        </p>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-xs text-ocean-text-dim mt-6">
                        © 2026 Daloy. All rights reserved.
                    </p>
                </div>
            </div>
        </>
    );
}
