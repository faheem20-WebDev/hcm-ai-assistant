import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import ErrorBox from '../components/ErrorBox';

const EyeIcon = ({ visible }) => (
  visible ? (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
    </svg>
  ) : (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
);

const ChangePassword = () => {
  const { changePassword, user } = useAuth();
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const pageTitle = user?.mustChangePassword ? 'Password Reset Required' : 'Change Password';
  const pageSubtitle = user?.mustChangePassword
    ? 'You are signed in with a temporary password. Set a permanent password to continue.'
    : 'Choose a strong, unique password to secure your account.';

  return (
    <AuthLayout
      title={pageTitle}
      subtitle={pageSubtitle}
      isPasswordFocused={isPasswordFocused}
      hasError={Boolean(error)}
    >
      {error && (
        <div className="auth-error-slide">
          <ErrorBox error={error} />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <label className="auth-label">Current Password</label>
          <div className="auth-input-wrapper">
            <input
              type={showOldPassword ? 'text' : 'password'}
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              placeholder="••••••••"
              className="auth-input auth-input-password"
            />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setShowOldPassword(!showOldPassword)}
              aria-label={showOldPassword ? 'Hide current password' : 'Show current password'}
            >
              <EyeIcon visible={showOldPassword} />
            </button>
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label">New Password</label>
          <div className="auth-input-wrapper">
            <input
              type={showNewPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              placeholder="••••••••"
              className="auth-input auth-input-password"
            />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setShowNewPassword(!showNewPassword)}
              aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
            >
              <EyeIcon visible={showNewPassword} />
            </button>
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label">Confirm New Password</label>
          <div className="auth-input-wrapper">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              placeholder="••••••••"
              className="auth-input auth-input-password"
            />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              <EyeIcon visible={showConfirmPassword} />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="auth-btn-primary"
        >
          {loading ? (
            <>
              <span className="auth-spinner" />
              <span>Updating Password...</span>
            </>
          ) : (
            'Update Password'
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ChangePassword;
