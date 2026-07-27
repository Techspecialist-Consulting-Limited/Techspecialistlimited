'use client';

import { useEffect, useState } from 'react';
import {
  fetchSettings, updateSettings, type AppSettings,
  fetchHrUsers, inviteHrUser, setHrUserActive, deleteHrUser, type HrTeamMember,
  changePassword,
} from '@/lib/recruitment-api';
import { BrandedLoader, ConfirmDialog } from '@/components/recruitment';

const inputClass = 'w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[14px] text-[var(--heading)] outline-none transition-colors focus:border-[var(--blue)] dark:border-white/10 dark:bg-white/5 dark:text-white';
const labelClass = 'grid gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--body)]';
const cardClass = 'rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 dark:border-white/10 dark:bg-[#101827]';
const btnPrimaryClass = 'rounded-full px-5 py-2.5 text-[13px] font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg';
const btnPrimaryStyle = { background: 'var(--blue)' };

function Toast({ message, kind }: { message: string; kind: 'success' | 'error' }) {
  return (
    <div
      className={`rounded-lg px-4 py-3 text-[13px] font-medium ${
        kind === 'success'
          ? 'border border-green-200 bg-green-50 text-green-700'
          : 'border border-red-200 bg-red-50 text-red-700'
      }`}
    >
      {message}
    </div>
  );
}

function NotificationsAndBrandingCard() {
  const [settings, setSettingsState] = useState<AppSettings | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchSettings().then(setSettingsState).catch(() => setStatus({ kind: 'error', message: 'Failed to load settings.' }));
  }, []);

  if (!settings) {
    return (
      <div className={cardClass}>
        <BrandedLoader text="Loading settings..." />
      </div>
    );
  }

  const addEmail = () => {
    const email = emailInput.trim();
    if (!email) return;
    if (!settings.notification_emails.includes(email)) {
      setSettingsState({ ...settings, notification_emails: [...settings.notification_emails, email] });
    }
    setEmailInput('');
  };

  const removeEmail = (email: string) => {
    setSettingsState({ ...settings, notification_emails: settings.notification_emails.filter((e) => e !== email) });
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const updated = await updateSettings(settings);
      setSettingsState(updated);
      setStatus({ kind: 'success', message: 'Settings saved.' });
    } catch {
      setStatus({ kind: 'error', message: 'Failed to save settings. Please try again.' });
    }
    setSaving(false);
  };

  return (
    <div className={cardClass}>
      <h2 className="mb-1 text-[16px] font-bold text-[var(--heading)]" style={{ fontFamily: "'Roboto Slab', sans-serif" }}>Notifications &amp; Branding</h2>
      <p className="mb-5 text-[13px] text-[var(--body)]">
        Control who gets emailed when a new applicant applies, and how outbound emails look.
      </p>

      <div className="space-y-5">
        <label className={labelClass}>
          Notification Emails
          <div className="flex flex-wrap gap-2 rounded-md border border-[var(--border)] bg-[var(--bg)] p-2.5 dark:border-white/10 dark:bg-white/5">
            {settings.notification_emails.map((email) => (
              <span
                key={email}
                className="flex items-center gap-1.5 rounded-full bg-[rgba(69,132,237,0.08)] px-3 py-1 text-[12px] font-medium normal-case tracking-normal text-[var(--blue)]"
              >
                {email}
                <button type="button" onClick={() => removeEmail(email)} className="text-[var(--blue)] hover:text-red-500" aria-label={`Remove ${email}`}>
                  &times;
                </button>
              </span>
            ))}
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addEmail(); } }}
              onBlur={addEmail}
              placeholder="Add an email and press Enter"
              className="min-w-[200px] flex-1 border-none bg-transparent px-2 py-1 text-[13px] normal-case tracking-normal text-[var(--heading)] outline-none"
            />
          </div>
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className={labelClass}>
            Company Name
            <input value={settings.company_name} onChange={(e) => setSettingsState({ ...settings, company_name: e.target.value })} className={inputClass} />
          </label>
          <label className={labelClass}>
            Sender Display Name
            <input value={settings.sender_display_name} onChange={(e) => setSettingsState({ ...settings, sender_display_name: e.target.value })} className={inputClass} />
          </label>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={labelClass}>
            Logo URL
            <input value={settings.logo_url} onChange={(e) => setSettingsState({ ...settings, logo_url: e.target.value })} className={inputClass} />
          </label>
          <label className={labelClass}>
            Brand Color
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.brand_color}
                onChange={(e) => setSettingsState({ ...settings, brand_color: e.target.value })}
                className="h-[42px] w-[52px] cursor-pointer rounded-md border border-[var(--border)] bg-transparent dark:border-white/10"
              />
              <input value={settings.brand_color} onChange={(e) => setSettingsState({ ...settings, brand_color: e.target.value })} className={inputClass} />
            </div>
          </label>
        </div>

        {status && <Toast message={status.message} kind={status.kind} />}

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving} className={`${btnPrimaryClass} disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none`} style={btnPrimaryStyle}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function HrTeamCard() {
  const [users, setUsers] = useState<HrTeamMember[] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HrTeamMember | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const load = () => fetchHrUsers().then(setUsers).catch(() => setStatus({ kind: 'error', message: 'Failed to load HR team.' }));

  useEffect(() => { load(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setStatus(null);
    try {
      await inviteHrUser(name, email);
      setName('');
      setEmail('');
      setStatus({ kind: 'success', message: `Invitation sent to ${email}.` });
      load();
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Failed to send invitation.' });
    }
    setInviting(false);
  };

  const handleToggleActive = async (user: HrTeamMember) => {
    setStatus(null);
    try {
      await setHrUserActive(user.id, !user.is_active);
      load();
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Failed to update account.' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const user = deleteTarget;
    setDeleteTarget(null);
    setStatus(null);
    try {
      await deleteHrUser(user.id);
      load();
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Failed to remove account.' });
    }
  };

  return (
    <div className={cardClass}>
      <h2 className="mb-1 text-[16px] font-bold text-[var(--heading)]" style={{ fontFamily: "'Roboto Slab', sans-serif" }}>HR Team</h2>
      <p className="mb-5 text-[13px] text-[var(--body)]">
        Manage who has access to the HR Portal. New teammates get an email to set their own password.
      </p>

      {!users ? (
        <BrandedLoader text="Loading team..." />
      ) : (
        <div className="mb-5 space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-4 py-3 dark:border-white/10"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--blue), #7c5cff)' }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-[var(--heading)]">{user.name}</div>
                  <div className="truncate text-[12px] text-[var(--body)]">{user.email}</div>
                </div>
                <span
                  className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    user.is_active ? 'bg-[rgba(34,197,94,0.1)] text-green-600' : 'bg-[rgba(148,163,184,0.15)] text-[var(--body)]'
                  }`}
                >
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <button
                  onClick={() => handleToggleActive(user)}
                  className="rounded-md border border-[var(--border)] px-3 py-1.5 text-[12px] font-semibold text-[var(--body)] transition-colors hover:border-[var(--blue)] hover:text-[var(--blue)] dark:border-white/10"
                >
                  {user.is_active ? 'Deactivate' : 'Reactivate'}
                </button>
                <button
                  onClick={() => setDeleteTarget(user)}
                  className="rounded-md border border-[var(--border)] px-3 py-1.5 text-[12px] font-semibold text-red-500 transition-colors hover:border-red-400 dark:border-white/10"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {status && <div className="mb-4"><Toast message={status.message} kind={status.kind} /></div>}

      <form onSubmit={handleInvite} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className={labelClass}>
          Name
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Jane Doe" />
        </label>
        <label className={labelClass}>
          Email
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="jane@techspecialistlimited.com" />
        </label>
        <button type="submit" disabled={inviting} className={`${btnPrimaryClass} whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none`} style={btnPrimaryStyle}>
          {inviting ? 'Sending...' : 'Invite Teammate'}
        </button>
      </form>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove HR Account"
        description={deleteTarget ? `Remove ${deleteTarget.name} (${deleteTarget.email}) from the HR team?` : ''}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (newPassword.length < 8) {
      setStatus({ kind: 'error', message: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ kind: 'error', message: 'New passwords do not match.' });
      return;
    }

    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatus({ kind: 'success', message: 'Password updated.' });
    } catch {
      setStatus({ kind: 'error', message: 'Current password is incorrect.' });
    }
    setSaving(false);
  };

  return (
    <div className={cardClass}>
      <h2 className="mb-1 text-[16px] font-bold text-[var(--heading)]" style={{ fontFamily: "'Roboto Slab', sans-serif" }}>Change Password</h2>
      <p className="mb-5 text-[13px] text-[var(--body)]">Update the password for your own HR account.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className={labelClass}>
          Current Password
          <input required type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={labelClass}>
            New Password
            <input required type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} placeholder="At least 8 characters" />
          </label>
          <label className={labelClass}>
            Confirm New Password
            <input required type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
          </label>
        </div>

        {status && <Toast message={status.message} kind={status.kind} />}

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className={`${btnPrimaryClass} disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none`} style={btnPrimaryStyle}>
            {saving ? 'Saving...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function HrSettingsPage() {
  return (
    <div className="mx-auto max-w-[800px]">
      <h1 className="mb-2 text-[26px] font-extrabold tracking-[-0.02em] text-[var(--heading)]" style={{ fontFamily: "'Roboto Slab', sans-serif" }}>Settings</h1>
      <p className="mb-8 text-[13px] text-[var(--body)]">Manage notifications, branding, your HR team, and your account.</p>

      <div className="space-y-6">
        <NotificationsAndBrandingCard />
        <HrTeamCard />
        <ChangePasswordCard />
      </div>
    </div>
  );
}
