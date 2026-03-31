import { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import Modal from '../../Components/Admin/UI/Modal';

/* ── Permission category labels ── */
const PERM_CATEGORIES = {
    users: 'Users', content: 'Content', reports: 'Reports',
    groups: 'Groups', messages: 'Messages', analytics: 'Analytics',
    settings: 'Settings', logs: 'Logs', system: 'System',
};

function ColorDot({ color, size = 10 }) {
    return <span className="adm-color-dot" style={{ width: size, height: size, background: color }} />;
}

export default function Roles({ roles = [], permissions = {}, admins = [] }) {
    const [selectedRole, setSelectedRole] = useState(roles[0] || null);
    const [activeTab, setActiveTab]       = useState('matrix');
    const [createModal, setCreateModal]   = useState(false);
    const [editModal, setEditModal]       = useState(null);
    const [deleteModal, setDeleteModal]   = useState(null);
    const [promoteUser, setPromoteUser]   = useState('');
    const [promoteRole, setPromoteRole]   = useState('');
    const [flash, setFlash]               = useState('');
    const [reassignTo, setReassignTo]     = useState('');
    const [form, setForm]                 = useState({ name: '', display_name: '', description: '', color: '#7c3aed' });

    const selectedPerms = new Set(selectedRole?.permissions?.map((p) => p.id) || []);

    const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 2500); };

    /* ── Handlers ── */
    const handlePermToggle = (permId) => {
        if (!selectedRole) return;
        const current = selectedRole.permissions.map((p) => p.id);
        const updated = current.includes(permId)
            ? current.filter((id) => id !== permId)
            : [...current, permId];

        router.post(`/admin/roles/${selectedRole.id}/permissions`, { permission_ids: updated }, {
            preserveScroll: true,
            onSuccess: () => showFlash('Permissions saved'),
        });
    };

    const handleCreateRole = () => {
        router.post('/admin/roles', form, {
            preserveScroll: true,
            onSuccess: () => { setCreateModal(false); showFlash('Role created'); },
        });
    };

    const handleEditRole = () => {
        router.put(`/admin/roles/${editModal.id}`, form, {
            preserveScroll: true,
            onSuccess: () => { setEditModal(null); showFlash('Role updated'); },
        });
    };

    const handleDeleteRole = () => {
        router.delete(`/admin/roles/${deleteModal.id}`, {
            data: { reassign_to: reassignTo },
            preserveScroll: true,
            onSuccess: () => { setDeleteModal(null); showFlash('Role deleted'); },
        });
    };

    const handlePromote = () => {
        if (!promoteUser || !promoteRole) return;
        router.post(`/admin/admins/${promoteUser}/promote`, { role_id: promoteRole }, {
            preserveScroll: true,
            onSuccess: () => { setPromoteUser(''); setPromoteRole(''); showFlash('User promoted'); },
        });
    };

    const handleChangeRole = (adminId, roleId) => {
        router.patch(`/admin/admins/${adminId}/role`, { role_id: roleId }, { preserveScroll: true });
    };

    const handleRemoveAdmin = (adminId) => {
        if (!confirm('Remove this admin?')) return;
        router.delete(`/admin/admins/${adminId}/remove`, { preserveScroll: true });
    };

    const openCreate = () => {
        setForm({ name: '', display_name: '', description: '', color: '#7c3aed' });
        setCreateModal(true);
    };

    const openEdit = (role) => {
        setForm({ display_name: role.display_name, description: role.description, color: role.color });
        setEditModal(role);
    };

    return (
        <>
            {/* ── Flash Toast ── */}
            {flash && (
                <div className="adm-toast">✓ {flash}</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
                {/* ── Left: Roles List ── */}
                <div className="adm-card">
                    <div className="adm-card-header">
                        <h3>Roles</h3>
                        <button className="adm-btn adm-btn-primary adm-btn-sm" onClick={openCreate}>+ New Role</button>
                    </div>
                    <div className="adm-card-body-flush">
                        {roles.map((role) => (
                            <div key={role.id}>
                                <div
                                    className={`adm-role-item ${selectedRole?.id === role.id ? 'active' : ''}`}
                                    style={{ borderLeftColor: selectedRole?.id === role.id ? role.color : 'transparent' }}
                                    onClick={() => setSelectedRole(role)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <ColorDot color={role.color} size={8} />
                                        <span style={{ fontWeight: 700, fontSize: 13 }}>{role.display_name}</span>
                                        {role.is_system && <span className="adm-badge adm-badge-sm">SYSTEM</span>}
                                    </div>
                                    <div className="adm-table-cell-sub" style={{ marginLeft: 16 }}>{role.description}</div>
                                    <div style={{ fontSize: 11, color: 'var(--adm-text-secondary)', marginLeft: 16, marginTop: 2 }}>
                                        {role.admins_count} admin{role.admins_count !== 1 ? 's' : ''}
                                    </div>
                                </div>
                                {selectedRole?.id === role.id && (
                                    <div className="adm-role-item-actions">
                                        <button className="adm-btn adm-btn-sm adm-btn-outline" onClick={() => openEdit(role)}>Edit</button>
                                        {!role.is_system && (
                                            <button className="adm-btn adm-btn-sm adm-btn-outline" style={{ color: 'var(--adm-danger)', borderColor: 'var(--adm-danger)' }} onClick={() => setDeleteModal(role)}>Delete</button>
                                        )}
                                        {role.is_system && <span className="adm-table-cell-sub">🔒 System</span>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Right: Tabs Panel ── */}
                <div>
                    <div className="adm-tabs" style={{ borderRadius: '8px 8px 0 0', border: '1px solid var(--adm-border)', borderBottom: 'none' }}>
                        {[['matrix', 'Permission Matrix'], ['admins', 'Admin Accounts'], ['promote', 'Promote User']].map(([key, label]) => (
                            <button key={key} className={`adm-tab ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="adm-card" style={{ borderRadius: '0 0 8px 8px' }}>
                        {/* ── Permission Matrix ── */}
                        {activeTab === 'matrix' && selectedRole && (
                            <div className="adm-card-body">
                                <div style={{ marginBottom: 16 }}>
                                    <h3>Permissions for <span style={{ color: selectedRole.color }}>{selectedRole.display_name}</span></h3>
                                    <div className="adm-card-header-sub">Toggles auto-save on change</div>
                                </div>
                                {Object.entries(permissions).map(([cat, perms]) => (
                                    <div key={cat} style={{ marginBottom: 20 }}>
                                        <div className="adm-permission-category-label">{PERM_CATEGORIES[cat] || cat}</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {perms.map((perm) => (
                                                <div key={perm.id} className="adm-permission-row">
                                                    <div>
                                                        <div className="adm-permission-row-label">{perm.label}</div>
                                                        <div className="adm-permission-row-key">{perm.key}</div>
                                                    </div>
                                                    <label className="adm-toggle">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPerms.has(perm.id)}
                                                            onChange={() => handlePermToggle(perm.id)}
                                                            disabled={selectedRole.is_system && selectedRole.name === 'super_admin'}
                                                        />
                                                        <span className="adm-toggle-slider" />
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Admin Accounts ── */}
                        {activeTab === 'admins' && (
                            <div className="adm-table-wrapper">
                                <table className="adm-table">
                                    <thead>
                                        <tr>
                                            <th>ADMIN</th>
                                            <th>EMAIL</th>
                                            <th>CURRENT ROLE</th>
                                            <th>JOINED</th>
                                            <th>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {admins.map((admin) => (
                                            <tr key={admin.id}>
                                                <td>
                                                    <div className="adm-table-cell-user">
                                                        <div className="adm-table-cell-user-avatar">
                                                            {admin.avatar
                                                                ? <img src={admin.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                                : admin.name?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="adm-table-cell-bold">{admin.name}</div>
                                                            <div className="adm-table-cell-sub">@{admin.username}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="adm-table-cell-sub">{admin.email}</td>
                                                <td>
                                                    <span className="adm-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                        <ColorDot color={admin.role_color} size={7} />
                                                        {admin.role_label}
                                                    </span>
                                                </td>
                                                <td className="adm-table-cell-sub">{admin.joined}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                        <select
                                                            className="adm-filter-select"
                                                            defaultValue={admin.role_id || ''}
                                                            onChange={(e) => handleChangeRole(admin.id, e.target.value)}
                                                            style={{ fontSize: 11, padding: '4px 8px' }}
                                                        >
                                                            {roles.map((r) => <option key={r.id} value={r.id}>{r.display_name}</option>)}
                                                        </select>
                                                        <button
                                                            className="adm-btn adm-btn-sm adm-btn-outline"
                                                            style={{ color: 'var(--adm-danger)', borderColor: 'var(--adm-danger)' }}
                                                            onClick={() => handleRemoveAdmin(admin.id)}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ── Promote User ── */}
                        {activeTab === 'promote' && (
                            <div className="adm-card-body">
                                <p className="adm-table-cell-sub" style={{ marginBottom: 20, lineHeight: 1.6 }}>
                                    Enter a platform user's numeric ID to promote them to an admin role.
                                </p>
                                <div className="adm-form-row">
                                    <div className="adm-form-group">
                                        <label className="adm-form-label">User ID (numeric)</label>
                                        <input className="adm-form-input" type="number" value={promoteUser} onChange={(e) => setPromoteUser(e.target.value)} placeholder="Enter user ID..." />
                                    </div>
                                    <div className="adm-form-group">
                                        <label className="adm-form-label">Assign Role</label>
                                        <select className="adm-form-select" value={promoteRole} onChange={(e) => setPromoteRole(e.target.value)}>
                                            <option value="">Select role...</option>
                                            {roles.map((r) => <option key={r.id} value={r.id}>{r.display_name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <button className="adm-btn adm-btn-primary" onClick={handlePromote} disabled={!promoteUser || !promoteRole}>
                                    Promote to Admin
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Create Role Modal ── */}
            <Modal
                isOpen={createModal}
                onClose={() => setCreateModal(false)}
                title="Create New Role"
                size="sm"
                footer={<>
                    <button className="adm-btn adm-btn-outline" onClick={() => setCreateModal(false)}>Cancel</button>
                    <button className="adm-btn adm-btn-primary" onClick={handleCreateRole}>Create Role</button>
                </>}
            >
                <RoleForm form={form} setForm={setForm} />
            </Modal>

            {/* ── Edit Role Modal ── */}
            <Modal
                isOpen={!!editModal}
                onClose={() => setEditModal(null)}
                title={`Edit: ${editModal?.display_name}`}
                size="sm"
                footer={<>
                    <button className="adm-btn adm-btn-outline" onClick={() => setEditModal(null)}>Cancel</button>
                    <button className="adm-btn adm-btn-primary" onClick={handleEditRole}>Save Changes</button>
                </>}
            >
                <RoleForm form={form} setForm={setForm} hideName />
            </Modal>

            {/* ── Delete Role Modal ── */}
            <Modal
                isOpen={!!deleteModal}
                onClose={() => setDeleteModal(null)}
                title={`Delete: ${deleteModal?.display_name}`}
                size="sm"
                footer={<>
                    <button className="adm-btn adm-btn-outline" onClick={() => setDeleteModal(null)}>Cancel</button>
                    <button className="adm-btn adm-btn-danger" onClick={handleDeleteRole}>Delete Role</button>
                </>}
            >
                <p style={{ fontSize: 13, marginBottom: 16 }}>
                    This will permanently delete the role. You must reassign any admins currently holding it.
                </p>
                <div className="adm-form-group">
                    <label className="adm-form-label">Reassign {deleteModal?.admins_count || 0} admin(s) to:</label>
                    <select className="adm-form-select" value={reassignTo} onChange={(e) => setReassignTo(e.target.value)}>
                        <option value="">Select role...</option>
                        {roles.filter((r) => r.id !== deleteModal?.id).map((r) => (
                            <option key={r.id} value={r.id}>{r.display_name}</option>
                        ))}
                    </select>
                </div>
            </Modal>
        </>
    );
}

/* ── Shared Role Form ── */
function RoleForm({ form, setForm, hideName = false }) {
    const upd = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {!hideName && (
                <div className="adm-form-group">
                    <label className="adm-form-label">Role Key (lowercase_underscore)</label>
                    <input className="adm-form-input" value={form.name} onChange={(e) => upd('name', e.target.value)} placeholder="e.g. content_reviewer" />
                </div>
            )}
            <div className="adm-form-group">
                <label className="adm-form-label">Display Name</label>
                <input className="adm-form-input" value={form.display_name} onChange={(e) => upd('display_name', e.target.value)} placeholder="e.g. Content Reviewer" />
            </div>
            <div className="adm-form-group">
                <label className="adm-form-label">Description</label>
                <textarea className="adm-form-textarea" value={form.description} onChange={(e) => upd('description', e.target.value)} placeholder="Brief description..." style={{ height: 80 }} />
            </div>
            <div className="adm-form-group">
                <label className="adm-form-label">Color</label>
                <div className="adm-color-picker-row">
                    <input type="color" value={form.color} onChange={(e) => upd('color', e.target.value)} />
                    <span className="adm-color-hex">{form.color}</span>
                </div>
            </div>
        </div>
    );
}

Roles.layout = (page) => <AdminLayout currentPage="Admin/Roles">{page}</AdminLayout>;
