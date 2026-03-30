import { useState } from 'react';
import { useForm, Head } from '@inertiajs/react';

export default function AdminLogin() {
    const [showCode, setShowCode] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        access_code: '',
        remember: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/admin/login');
    };

    return (
        <div className="daloy-admin" style={{ justifyContent: 'center', alignItems: 'center', background: '#f7f7f8', minHeight: '100vh' }}>
            <div style={{
                width: '100%',
                maxWidth: '420px',
                padding: '0 24px',
            }}>
                {/* Brand */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '4px' }}>Daloy</h1>
                    <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#888' }}>
                        Administrative Suite
                    </span>
                </div>

                {/* Login Card */}
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e5e5e5',
                    borderRadius: '12px',
                    padding: '32px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>Admin Access</h2>
                    <p style={{ fontSize: '13px', color: '#888', marginBottom: '24px' }}>
                        Authorized personnel only. Enter your credentials and access code.
                    </p>

                    <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div className="adm-form-group">
                            <label className="adm-form-label">Email Address</label>
                            <input
                                className="adm-form-input"
                                type="email"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                placeholder="admin@daloy.com"
                                autoComplete="email"
                                required
                            />
                            {errors.email && (
                                <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.email}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="adm-form-group">
                            <label className="adm-form-label">Password</label>
                            <input
                                className="adm-form-input"
                                type="password"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        {/* Access Code */}
                        <div className="adm-form-group">
                            <label className="adm-form-label">Access Code</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    className="adm-form-input"
                                    type={showCode ? 'text' : 'password'}
                                    value={data.access_code}
                                    onChange={e => setData('access_code', e.target.value)}
                                    placeholder="Enter admin access code"
                                    autoComplete="off"
                                    required
                                    style={{ paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCode(!showCode)}
                                    style={{
                                        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '12px',
                                    }}
                                >
                                    {showCode ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            {errors.access_code && (
                                <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.access_code}</p>
                            )}
                        </div>

                        {/* Remember */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                            <input
                                type="checkbox"
                                id="remember"
                                checked={data.remember}
                                onChange={e => setData('remember', e.target.checked)}
                                style={{ accentColor: '#111' }}
                            />
                            <label htmlFor="remember" style={{ fontSize: '13px', color: '#555', cursor: 'pointer' }}>
                                Remember this session
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="adm-btn adm-btn-primary"
                            style={{ width: '100%', padding: '12px', fontSize: '14px', justifyContent: 'center' }}
                        >
                            {processing ? 'Authenticating...' : 'Sign In to Admin Panel'}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <p style={{ fontSize: '11px', color: '#aaa' }}>
                        This system is monitored. Unauthorized access attempts will be logged.
                    </p>
                </div>
            </div>
        </div>
    );
}
