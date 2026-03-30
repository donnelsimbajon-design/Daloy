import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { router } from '@inertiajs/react';

export default function Settings({ settings = {}, changeLog = [] }) {
    const [localSettings, setLocalSettings] = useState({
        maintenance_mode: settings.maintenance_mode === '1',
        feature_stories: settings.feature_stories !== '0',
        feature_groups: settings.feature_groups !== '0',
        feature_events: settings.feature_events !== '0',
        feature_media: settings.feature_media !== '0',
        feature_messages: settings.feature_messages !== '0',
        feature_verification: settings.feature_verification !== '0',
        max_upload_size: settings.max_upload_size || '10',
        max_media_per_post: settings.max_media_per_post || '4',
        default_privacy: settings.default_privacy || 'public',
        min_password_length: settings.min_password_length || '8',
        require_email_verification: settings.require_email_verification !== '0',
        allow_public_profiles: settings.allow_public_profiles !== '0',
        enable_content_filtering: settings.enable_content_filtering !== '0',
        auto_flag_threshold: settings.auto_flag_threshold || '3',
    });
    const [saved, setSaved] = useState(false);

    const updateSetting = (key, value) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const handleSave = () => {
        router.post('/admin/settings', { settings: localSettings }, {
            preserveState: true,
            onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); },
        });
    };

    const ToggleRow = ({ label, description, settingKey }) => (
        <div className="adm-setting-item">
            <div className="adm-setting-info">
                <h4>{label}</h4>
                <p>{description}</p>
            </div>
            <label className="adm-toggle">
                <input type="checkbox" checked={localSettings[settingKey]} onChange={(e) => updateSetting(settingKey, e.target.checked)} />
                <span className="adm-toggle-slider"></span>
            </label>
        </div>
    );

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="adm-card">
                        <div className="adm-card-header">
                            <h3>System</h3>
                            {localSettings.maintenance_mode && <span className="adm-badge adm-badge-critical">Maintenance Active</span>}
                        </div>
                        <div className="adm-card-body-flush">
                            <ToggleRow label="Maintenance Mode" description="Take the platform offline for updates." settingKey="maintenance_mode" />
                        </div>
                    </div>

                    <div className="adm-card">
                        <div className="adm-card-header"><h3>Feature Toggles</h3></div>
                        <div className="adm-card-body-flush">
                            <ToggleRow label="Stories" description="Allow temporary story content." settingKey="feature_stories" />
                            <ToggleRow label="Groups" description="Enable group creation." settingKey="feature_groups" />
                            <ToggleRow label="Events" description="Allow events management." settingKey="feature_events" />
                            <ToggleRow label="Media Upload" description="Allow image/video uploads." settingKey="feature_media" />
                            <ToggleRow label="Direct Messages" description="Enable private messaging." settingKey="feature_messages" />
                            <ToggleRow label="Verification" description="Allow account verification requests." settingKey="feature_verification" />
                        </div>
                    </div>

                    <div className="adm-card">
                        <div className="adm-card-header"><h3>Media Limits</h3></div>
                        <div className="adm-card-body">
                            <div className="adm-form-row">
                                <div className="adm-form-group">
                                    <label className="adm-form-label">Max File Size (MB)</label>
                                    <input className="adm-form-input" type="number" value={localSettings.max_upload_size} onChange={(e) => updateSetting('max_upload_size', e.target.value)} />
                                </div>
                                <div className="adm-form-group">
                                    <label className="adm-form-label">Max Media Per Post</label>
                                    <input className="adm-form-input" type="number" value={localSettings.max_media_per_post} onChange={(e) => updateSetting('max_media_per_post', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="adm-card">
                        <div className="adm-card-header"><h3>Privacy & Security</h3></div>
                        <div className="adm-card-body">
                            <div className="adm-form-group">
                                <label className="adm-form-label">Default Profile Privacy</label>
                                <select className="adm-form-select" value={localSettings.default_privacy} onChange={(e) => updateSetting('default_privacy', e.target.value)}>
                                    <option value="public">Public</option>
                                    <option value="friends">Friends Only</option>
                                    <option value="private">Private</option>
                                </select>
                            </div>
                            <div className="adm-form-group">
                                <label className="adm-form-label">Min Password Length</label>
                                <input className="adm-form-input" type="number" value={localSettings.min_password_length} onChange={(e) => updateSetting('min_password_length', e.target.value)} />
                            </div>
                        </div>
                        <div className="adm-card-body-flush" style={{ borderTop: '1px solid #e5e5e5' }}>
                            <ToggleRow label="Require Email Verification" description="Verify email before accessing the platform." settingKey="require_email_verification" />
                            <ToggleRow label="Allow Public Profiles" description="Let users set profiles as publicly visible." settingKey="allow_public_profiles" />
                        </div>
                    </div>

                    <div className="adm-card">
                        <div className="adm-card-header"><h3>Content Moderation</h3></div>
                        <div className="adm-card-body-flush">
                            <ToggleRow label="AI Content Filtering" description="Auto-scan and flag harmful content." settingKey="enable_content_filtering" />
                        </div>
                        <div className="adm-card-body" style={{ borderTop: '1px solid #e5e5e5' }}>
                            <div className="adm-form-group">
                                <label className="adm-form-label">Auto-Flag Threshold</label>
                                <input className="adm-form-input" type="number" value={localSettings.auto_flag_threshold} onChange={(e) => updateSetting('auto_flag_threshold', e.target.value)} />
                                <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Reports before auto-hiding.</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        {saved && <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: '#10b981', fontWeight: 600 }}>✓ Saved</span>}
                        <button className="adm-btn adm-btn-primary" onClick={handleSave}>Save Changes</button>
                    </div>
                </div>

                <div>
                    <div className="adm-card" style={{ position: 'sticky', top: '72px' }}>
                        <div className="adm-card-header"><h3>Change Log</h3></div>
                        <div className="adm-card-body-flush">
                            {changeLog.length === 0 ? (
                                <div style={{ padding: '20px 16px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>No changes logged</div>
                            ) : (
                                changeLog.map((log, i) => (
                                    <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>
                                        <div style={{ fontWeight: 600, marginBottom: '2px' }}>{log.change}</div>
                                        <div style={{ fontSize: '11px', color: '#888' }}>{log.admin} · {log.time}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Settings.layout = (page) => <AdminLayout currentPage="Admin/Settings">{page}</AdminLayout>;
