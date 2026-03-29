import { useState } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';

const initialSettings = {
    maintenanceMode: false,
    featureStories: true,
    featureGroups: true,
    featureEvents: true,
    featureMediaUpload: true,
    featureDirectMessages: true,
    featureVerification: true,
    maxUploadSize: '10',
    maxMediaPerPost: '4',
    defaultPrivacy: 'public',
    minPasswordLength: '8',
    requireEmailVerification: true,
    allowPublicProfiles: true,
    enableContentFiltering: true,
    autoFlagThreshold: '3',
};

const changeLog = [
    { admin: 'Admin_Sarah', change: 'Disabled maintenance mode', time: '2 hours ago' },
    { admin: 'Root_User', change: 'Updated max upload size to 10MB', time: '1 day ago' },
    { admin: 'Admin_Mark', change: 'Enabled content filtering', time: '2 days ago' },
    { admin: 'System_Automator', change: 'Auto-updated security policy', time: '3 days ago' },
    { admin: 'Admin_Sarah', change: 'Changed default privacy to public', time: '5 days ago' },
];

export default function Settings() {
    const [settings, setSettings] = useState(initialSettings);
    const [saved, setSaved] = useState(false);

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const ToggleRow = ({ label, description, settingKey }) => (
        <div className="adm-setting-item">
            <div className="adm-setting-info">
                <h4>{label}</h4>
                <p>{description}</p>
            </div>
            <label className="adm-toggle">
                <input type="checkbox" checked={settings[settingKey]} onChange={(e) => updateSetting(settingKey, e.target.checked)} />
                <span className="adm-toggle-slider"></span>
            </label>
        </div>
    );

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* System */}
                    <div className="adm-card">
                        <div className="adm-card-header">
                            <h3>System</h3>
                            {settings.maintenanceMode && <span className="adm-badge adm-badge-critical">Maintenance Active</span>}
                        </div>
                        <div className="adm-card-body-flush">
                            <ToggleRow label="Maintenance Mode" description="Take the platform offline for system updates." settingKey="maintenanceMode" />
                        </div>
                    </div>

                    {/* Feature Toggles */}
                    <div className="adm-card">
                        <div className="adm-card-header"><h3>Feature Toggles</h3></div>
                        <div className="adm-card-body-flush">
                            <ToggleRow label="Stories" description="Allow users to post temporary story content." settingKey="featureStories" />
                            <ToggleRow label="Groups" description="Enable group creation and management." settingKey="featureGroups" />
                            <ToggleRow label="Events" description="Allow groups to create and manage events." settingKey="featureEvents" />
                            <ToggleRow label="Media Upload" description="Allow users to upload images and videos." settingKey="featureMediaUpload" />
                            <ToggleRow label="Direct Messages" description="Enable private messaging between users." settingKey="featureDirectMessages" />
                            <ToggleRow label="Verification" description="Allow users to request account verification." settingKey="featureVerification" />
                        </div>
                    </div>

                    {/* Media Limits */}
                    <div className="adm-card">
                        <div className="adm-card-header"><h3>Media Upload Limits</h3></div>
                        <div className="adm-card-body">
                            <div className="adm-form-row">
                                <div className="adm-form-group">
                                    <label className="adm-form-label">Max File Size (MB)</label>
                                    <input className="adm-form-input" type="number" value={settings.maxUploadSize} onChange={(e) => updateSetting('maxUploadSize', e.target.value)} />
                                </div>
                                <div className="adm-form-group">
                                    <label className="adm-form-label">Max Media Per Post</label>
                                    <input className="adm-form-input" type="number" value={settings.maxMediaPerPost} onChange={(e) => updateSetting('maxMediaPerPost', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Privacy & Security */}
                    <div className="adm-card">
                        <div className="adm-card-header"><h3>Privacy & Security</h3></div>
                        <div className="adm-card-body">
                            <div className="adm-form-group">
                                <label className="adm-form-label">Default Profile Privacy</label>
                                <select className="adm-form-select" value={settings.defaultPrivacy} onChange={(e) => updateSetting('defaultPrivacy', e.target.value)}>
                                    <option value="public">Public</option>
                                    <option value="friends">Friends Only</option>
                                    <option value="private">Private</option>
                                </select>
                            </div>
                            <div className="adm-form-group">
                                <label className="adm-form-label">Minimum Password Length</label>
                                <input className="adm-form-input" type="number" value={settings.minPasswordLength} onChange={(e) => updateSetting('minPasswordLength', e.target.value)} />
                            </div>
                        </div>
                        <div className="adm-card-body-flush" style={{ borderTop: '1px solid #e5e5e5' }}>
                            <ToggleRow label="Require Email Verification" description="New users must verify their email before accessing the platform." settingKey="requireEmailVerification" />
                            <ToggleRow label="Allow Public Profiles" description="Let users set their profiles to be publicly visible." settingKey="allowPublicProfiles" />
                        </div>
                    </div>

                    {/* Content Moderation Settings */}
                    <div className="adm-card">
                        <div className="adm-card-header"><h3>Content Moderation</h3></div>
                        <div className="adm-card-body-flush">
                            <ToggleRow label="AI Content Filtering" description="Automatically scan and flag potentially harmful content." settingKey="enableContentFiltering" />
                        </div>
                        <div className="adm-card-body" style={{ borderTop: '1px solid #e5e5e5' }}>
                            <div className="adm-form-group">
                                <label className="adm-form-label">Auto-Flag Report Threshold</label>
                                <input className="adm-form-input" type="number" value={settings.autoFlagThreshold} onChange={(e) => updateSetting('autoFlagThreshold', e.target.value)} />
                                <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Number of reports before content is auto-hidden.</p>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        {saved && <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: '#10b981', fontWeight: 600 }}>✓ Settings saved</span>}
                        <button className="adm-btn adm-btn-primary" onClick={handleSave}>Save Changes</button>
                    </div>
                </div>

                {/* Settings Change Log */}
                <div>
                    <div className="adm-card" style={{ position: 'sticky', top: '72px' }}>
                        <div className="adm-card-header"><h3>Change Log</h3></div>
                        <div className="adm-card-body-flush">
                            {changeLog.map((log, i) => (
                                <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>
                                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>{log.change}</div>
                                    <div style={{ fontSize: '11px', color: '#888' }}>{log.admin} · {log.time}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Settings.layout = (page) => <AdminLayout currentPage="Admin/Settings">{page}</AdminLayout>;
