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

const Setup = () => {
  const { completeSetup } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: '',
    adminName: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await completeSetup(formData);
      navigate('/login', { state: { message: 'Setup completed successfully. Please sign in.' } });
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to complete initial system setup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="System Setup"
      subtitle="Initialize your organization workspace and primary administrator"
      isPasswordFocused={isPasswordFocused}
      hasError={Boolean(error)}
      loading={loading}
    >
      {error && (
        <div className="auth-error-slide">
          <ErrorBox error={error} />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <label className="auth-label">Company Name</label>
          <div className="auth-input-wrapper">
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Acme Corp"
              className="auth-input"
            />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label">Administrator Name</label>
          <div className="auth-input-wrapper">
            <input
              type="text"
              required
              value={formData.adminName}
              onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
              placeholder="System Administrator"
              className="auth-input"
            />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label">Admin Email</label>
          <div className="auth-input-wrapper">
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@company.com"
              className="auth-input"
            />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label">Admin Password</label>
          <div className="auth-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              placeholder="••••••••"
              className="auth-input auth-input-password"
            />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <EyeIcon visible={showPassword} />
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
              <span>Initializing System...</span>
            </>
          ) : (
            'Complete Setup'
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Setup;
