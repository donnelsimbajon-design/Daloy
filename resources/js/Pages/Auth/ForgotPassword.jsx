import { Head, Link, useForm } from '@inertiajs/react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <>
            <Head title="Forgot Password" />

            <div className="min-h-screen bg-ocean-deep flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-amber-500/[0.03] blur-[120px] animate-pulse" style={{ animationDuration: '9s' }}></div>
                    <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-biolum/[0.03] blur-[100px] animate-pulse" style={{ animationDuration: '11s' }}></div>
                </div>

                {/* Logo */}
                <div className="relative z-10 mb-8 text-center flex flex-col items-center">
                    <div className="flex items-center justify-center gap-0 mb-1">
                        <div className="w-20 h-20 flex items-center justify-center z-10">
                            <img src="/images/logo.png" alt="Daloy Logo" className="w-full h-full object-contain drop-shadow-md" />
                        </div>
                        <h1 className="text-6xl font-medium text-ocean-text tracking-wide -ml-5 mt-2" style={{ fontFamily: '"Pacifico", cursive' }}>aloy</h1>
                    </div>
                    <p className="text-sm text-ocean-text-muted mt-1">Reset your password</p>
                </div>

                {/* Card */}
                <div className="relative z-10 w-full max-w-md">
                    <div className="bg-ocean-card/80 backdrop-blur-xl border border-ocean-border rounded-2xl p-8">
                        <h2 className="text-xl font-bold text-ocean-text mb-1">Forgot your password?</h2>
                        <p className="text-sm text-ocean-text-dim mb-6">
                            No worries. Enter your email address and we'll send you a password reset link.
                        </p>

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
                                    isFocused={true}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="you@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* Submit */}
                            <PrimaryButton disabled={processing}>
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Sending link...
                                    </span>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </PrimaryButton>
                        </form>

                        {/* Back to login */}
                        <div className="mt-6 text-center">
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-1 text-sm text-ocean-text-muted hover:text-biolum transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                </svg>
                                Back to login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
