import { Head, useForm } from '@inertiajs/react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/reset-password', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Reset Password" />

            <div className="min-h-screen bg-ocean-deep flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-1/4 left-1/3 w-[700px] h-[700px] rounded-full bg-biolum/[0.03] blur-[120px] animate-pulse" style={{ animationDuration: '10s' }}></div>
                    <div className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.03] blur-[100px] animate-pulse" style={{ animationDuration: '8s' }}></div>
                </div>

                {/* Logo */}
                <div className="relative z-10 mb-8 text-center flex flex-col items-center">
                    <div className="flex items-center justify-center gap-0 mb-1">
                        <h1 className="text-[5rem] leading-none mb-4 font-medium text-ocean-text tracking-wide" style={{ fontFamily: '"Pacifico", cursive' }}>Daloy</h1>
                    </div>
                    <p className="text-sm text-ocean-text-muted mt-1">Set your new password</p>
                </div>

                {/* Card */}
                <div className="relative z-10 w-full max-w-md">
                    <div className="bg-ocean-card/80 backdrop-blur-xl border border-ocean-border rounded-2xl p-8">
                        <h2 className="text-xl font-bold text-ocean-text mb-1">Reset Password</h2>
                        <p className="text-sm text-ocean-text-dim mb-6">
                            Choose a strong password to secure your account.
                        </p>

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
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* New Password */}
                            <div>
                                <InputLabel htmlFor="password" value="New Password" />
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    autoComplete="new-password"
                                    isFocused={true}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                />
                                <InputError message={errors.password} />
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <InputLabel htmlFor="password_confirmation" value="Confirm New Password" />
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

                            {/* Submit */}
                            <PrimaryButton disabled={processing}>
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Resetting...
                                    </span>
                                ) : (
                                    'Reset Password'
                                )}
                            </PrimaryButton>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
