import React, { useState } from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { Button, PasswordInput, showToast } from '../ui';

const ChangePasswordCard = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    const fbUser = auth.currentUser;
    if (!fbUser || !fbUser.email) {
      const msg = 'Please sign in with your email and password to change your password.';
      setError(msg);
      showToast.error(msg);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const credential = EmailAuthProvider.credential(fbUser.email, currentPassword);
      await reauthenticateWithCredential(fbUser, credential);
      await updatePassword(fbUser, newPassword);

      showToast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const code = err?.code || '';
      const msg =
        code === 'auth/wrong-password' || code === 'auth/invalid-credential'
          ? 'Current password is incorrect.'
          : err?.message || 'Failed to change password.';
      setError(msg);
      showToast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-brand-white dark:bg-gray-900 rounded-card border border-gray-200 dark:border-gray-600/30 p-5 sm:p-6 shadow-card space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-600/20">
        <div className="w-10 h-10 rounded-card bg-brand-yellowSoft dark:bg-brand-yellow/15 border border-brand-yellow text-brand-ink dark:text-brand-yellow flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" strokeWidth={2} />
        </div>
        <div>
          <h3 className="font-display font-bold text-ds-16 text-brand-ink dark:text-brand-white">
            Security &amp; Password
          </h3>
          <p className="text-ds-12 text-gray-600 dark:text-gray-400">Update your partner login password</p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-card bg-rose-500/10 border border-status-danger/30 text-status-danger text-ds-12 font-semibold flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordInput
          label="Current Password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Enter current password"
        />

        <PasswordInput
          label="New Password"
          required
          minLength={6}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Minimum 6 characters"
        />

        <PasswordInput
          label="Confirm New Password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
        />

        <Button type="submit" variant="secondary" fullWidth loading={submitting}>
          Update Password
        </Button>
      </form>
    </div>
  );
};

export default ChangePasswordCard;
