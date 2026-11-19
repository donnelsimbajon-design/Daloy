import { Head, Link, useForm } from '@inertiajs/react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/register', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Register" />

            <div className="min-h-[100dvh] bg-ocean-deep flex flex-col items-center justify-center px-3 py-8 sm:p-6 relative overflow-x-clip">
                {/* Animated background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] rounded-full bg-emerald-500/[0.03] blur-[120px] animate-pulse" style={{ animationDuration: '10s' }}></div>
                    <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-biolum/[0.03] blur-[100px] animate-pulse" style={{ animationDuration: '14s' }}></div>
                    <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] rounded-full bg-purple-500/[0.02] blur-[80px] animate-pulse" style={{ animationDuration: '7s' }}></div>
                </div>

                {/* Logo */}
                <div className="relative z-10 mb-8 text-center flex flex-col items-center">
                    <div className="flex items-center justify-center gap-0 mb-1">
                        <h1 className="text-6xl sm:text-[5rem] leading-none mb-4 font-medium text-ocean-text tracking-wide" style={{ fontFamily: '"Pacifico", cursive' }}>Daloy</h1>
                    </div>
                    <p className="text-sm text-ocean-text-muted mt-1">Join the current</p>
                </div>

                {/* Register Card */}
                <div className="relative z-10 w-full max-w-md">
                    <div className="bg-ocean-card/80 backdrop-blur-xl border border-ocean-border rounded-2xl p-5 sm:p-8>
                        <h2 className="text-xl font-bold text-ocean-text mb-1">Create your account</h2>
                        <p className="text-sm text-ocean-text-dim mb-6">Start your voyage through the deep</p>

                        <form onSubmit={submit} className="space-y-4 sm:space-y-5">
                            {/* Name */}
                            <div>
                                <InputLabel htmlFor="name" value="Full Name" />
                                <TextInput
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    autoComplete="name"
                                    isFocused={true}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Juan dela Cruz"
                                />
                                <InputError message={errors.name} />
                            </div>

                            {/* Username */}
                            <div>
                                <InputLabel htmlFor="username" value="Username" />
                                <TextInput
                                    id="username"
                                    name="username"
                                    value={data.username}
                                    autoComplete="username"
                                    onChange={(e) => setData('username', e.target.value)}
                                    placeholder="@juandelacruz"
                                />
                                <InputError message={errors.username} />
                            </div>

                            {/* Email */}
                            <div>
                                <InputLabel htmlFor="email" value="Email Address" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    autoComplete="username"
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="you@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* Password */}
                            <div>
                                <InputLabel htmlFor="password" value="Password" />
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    autoComplete="new-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                />
                                <InputError message={errors.password} />
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <InputLabel htmlFor="password_confirmation" value="Confirm Password" />
                                <TextInput
                                    id="password_confirmation"
                                    type="password"
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    autoComplete="new-password"
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="••••••••"
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>

                            {/* Terms */}
                            <p className="text-xs text-ocean-text-dim leading-relaxed">
                                By creating an account, you agree to our{' '}
                                <span className="text-biolum cursor-pointer hover:underline">Terms of Service</span>
                                {' '}and{' '}
                                <span className="text-biolum cursor-pointer hover:underline">Privacy Policy</span>.
                            </p>

                            {/* Submit */}
                            <PrimaryButton disabled={processing}>
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Creating account...
                                    </span>
                                ) : (
                                    'Create Account'
                                )}
                            </PrimaryButton>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-6">
                            <div className="flex-1 h-px bg-ocean-border"></div>
                            <span className="text-xs text-ocean-text-dim">or</span>
                            <div className="flex-1 h-px bg-ocean-border"></div>
                        </div>

                        {/* Login Link */}
                        <p className="text-center text-sm text-ocean-text-muted">
                            Already have an account?{' '}
                            <Link
                                href="/login"
                                className="text-biolum font-semibold hover:text-biolum-glow transition-colors"
                            >
                                Sign in
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
