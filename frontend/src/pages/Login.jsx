import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
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

const PinDigitBoxes = ({ value, onChange, autoFocus = true, hasError = false }) => {
  const inputRef = useRef(null);

  const handleClick = () => {
    inputRef.current?.focus();
  };

  const digits = [0, 1, 2, 3, 4].map((i) => value[i] || '');
  const activeIndex = Math.min(value.length, 4);

  return (
    <div className={`auth-pin-boxes ${hasError ? 'shake' : ''}`} onClick={handleClick}>
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        maxLength={5}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 5))}
        className="auth-pin-hidden-input"
        aria-label="5-digit PIN"
      />
      {digits.map((digit, idx) => (
        <div
          key={idx}
          className={`auth-pin-box ${idx === activeIndex ? 'active' : ''} ${digit ? 'filled' : ''}`}
        >
          {digit ? '•' : ''}
        </div>
      ))}
    </div>
  );
};

const Login = () => {
  const { login, verifyPin, setupPin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Auth steps: 'CREDENTIALS' | 'PIN_VERIFY' | 'PIN_SETUP'
  const [step, setStep] = useState('CREDENTIALS');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // PIN states
  const [pinData, setPinData] = useState(null); // { requirePin, hasPin, email, role, name }
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotReason, setForgotReason] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(null);
  const [forgotError, setForgotError] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const message = location.state?.message;

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res?.requirePin) {
        setPinData(res);
        setPin('');
        setConfirmPin('');
        setStep(res.hasPin ? 'PIN_VERIFY' : 'PIN_SETUP');
      } else {
        handlePostAuthRedirect(res);
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinVerifySubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (pin.length !== 5 || !/^\d{5}$/.test(pin)) {
      setError('Please enter a valid 5-digit numeric PIN.');
      return;
    }

    setLoading(true);
    try {
      const user = await verifyPin(pinData.email, pin);
      handlePostAuthRedirect(user);
    } catch (err) {
      setError(err?.response?.data?.error || 'Invalid 5-digit PIN.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSetupSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (pin.length !== 5 || !/^\d{5}$/.test(pin)) {
      setError('PIN must be exactly 5 numeric digits.');
      return;
    }

    if (pin !== confirmPin) {
      setError('PIN and Confirmation PIN do not match.');
      return;
    }

    setLoading(true);
    try {
      const user = await setupPin(pinData.email, pin);
      handlePostAuthRedirect(user);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to configure PIN.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostAuthRedirect = (user) => {
    if (user?.mustChangePassword) {
      navigate('/change-password', { replace: true });
    } else {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      const res = await api.post('/auth/forgot-password', {
        email: forgotEmail,
        reason: forgotReason
      });
      setForgotSuccess(res.data?.message || 'Password reset request submitted. Contact administrator for approval.');
    } catch (err) {
      setForgotError(err?.response?.data?.error || 'Failed to submit reset request.');
    } finally {
      setForgotLoading(false);
    }
  };

  const resetToCredentials = () => {
    setStep('CREDENTIALS');
    setPin('');
    setConfirmPin('');
    setPinData(null);
    setError(null);
  };

  const pageTitle =
    step === 'CREDENTIALS' ? 'Welcome Back' :
    step === 'PIN_VERIFY' ? 'Security PIN' : 'Setup 5-Digit PIN';

  const pageSubtitle =
    step === 'CREDENTIALS' ? 'Sign in to access your HR workspace' :
    step === 'PIN_VERIFY' ? `Enter 5-digit PIN for ${pinData?.name || pinData?.email}` :
    `Configure your confidential 5-digit PIN for ${pinData?.email}`;

  return (
    <AuthLayout
      title={pageTitle}
      subtitle={pageSubtitle}
      isPasswordFocused={isPasswordFocused}
      hasError={Boolean(error || forgotError)}
    >
      {message && (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#15803d',
          padding: '0.75rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem',
          marginBottom: '1rem'
        }}>
          {message}
        </div>
      )}

      {error && (
        <div className="auth-error-slide">
          <ErrorBox error={error} />
        </div>
      )}

      {/* STEP 1: EMAIL & PASSWORD */}
      {step === 'CREDENTIALS' && (
        <form onSubmit={handleCredentialsSubmit}>
          <div className="auth-field">
            <label className="auth-label">Work Email</label>
            <div className="auth-input-wrapper">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@company.com"
                className="auth-input"
              />
            </div>
          </div>

          <div className="auth-field">
            <div className="auth-label">
              <span>Password</span>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgotModal(true);
                }}
                className="auth-btn-secondary"
                style={{ padding: 0, fontSize: '0.75rem' }}
              >
                Forgot password?
              </button>
            </div>
            <div className="auth-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                <span>Authenticating...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      )}

      {/* STEP 2: VERIFY 5-DIGIT PIN */}
      {step === 'PIN_VERIFY' && (
        <form onSubmit={handlePinVerifySubmit}>
          <div style={{
            backgroundColor: 'var(--color-primary-bg)',
            border: '1px solid #c7d2fe',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: '#3730a3',
            marginBottom: '1rem'
          }}>
            Authenticating as <strong>{pinData?.name || pinData?.email}</strong> ({pinData?.role?.toUpperCase()})
          </div>

          <div className="auth-pin-container">
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>
              Enter 5-Digit PIN
            </span>
            <PinDigitBoxes
              value={pin}
              onChange={setPin}
              hasError={Boolean(error)}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || pin.length !== 5}
            className="auth-btn-primary"
          >
            {loading ? (
              <>
                <span className="auth-spinner" />
                <span>Verifying PIN...</span>
              </>
            ) : (
              'Verify & Continue'
            )}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={resetToCredentials}
              className="auth-btn-secondary"
            >
              ← Back to Login
            </button>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Forgot PIN? Contact Admin
            </span>
          </div>
        </form>
      )}

      {/* STEP 3: SETUP 5-DIGIT PIN */}
      {step === 'PIN_SETUP' && (
        <form onSubmit={handlePinSetupSubmit}>
          <div style={{
            backgroundColor: 'var(--color-primary-bg)',
            border: '1px solid #c7d2fe',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            fontSize: '0.85rem',
            color: '#3730a3',
            marginBottom: '1rem'
          }}>
            First-time setup: Configure a secure 5-digit PIN for future sign-ins.
          </div>

          <div className="auth-field">
            <label className="auth-label">New 5-Digit PIN</label>
            <PinDigitBoxes
              value={pin}
              onChange={setPin}
              hasError={Boolean(error)}
              autoFocus
            />
          </div>

          <div className="auth-field" style={{ marginTop: '1rem' }}>
            <label className="auth-label">Confirm 5-Digit PIN</label>
            <PinDigitBoxes
              value={confirmPin}
              onChange={setConfirmPin}
              hasError={Boolean(error)}
              autoFocus={false}
            />
          </div>

          <button
            type="submit"
            disabled={loading || pin.length !== 5 || confirmPin.length !== 5}
            className="auth-btn-primary"
          >
            {loading ? (
              <>
                <span className="auth-spinner" />
                <span>Configuring PIN...</span>
              </>
            ) : (
              'Save PIN & Sign In'
            )}
          </button>

          <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={resetToCredentials}
              className="auth-btn-secondary"
            >
              ← Back to Login
            </button>
          </div>
        </form>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '420px',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            animation: 'authSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) backwards'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: '700' }}>
                Reset Password Request
              </h3>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSuccess(null);
                  setForgotError(null);
                }}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#64748b', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {forgotSuccess ? (
              <div>
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  marginBottom: '1.25rem'
                }}>
                  {forgotSuccess}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSuccess(null);
                  }}
                  className="auth-btn-primary"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit}>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.4 }}>
                  Submit a reset request to your system administrator. Once approved, you will receive a temporary password.
                </p>

                {forgotError && (
                  <div className="auth-error-slide">
                    <ErrorBox error={forgotError} />
                  </div>
                )}

                <div className="auth-field">
                  <label className="auth-label">Registered Work Email</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="user@company.com"
                    className="auth-input"
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label">Reason / Note (Optional)</label>
                  <input
                    type="text"
                    value={forgotReason}
                    onChange={(e) => setForgotReason(e.target.value)}
                    placeholder="e.g. Locked out of account"
                    className="auth-input"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    style={{
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.65rem 1.15rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="auth-btn-primary"
                    style={{ width: 'auto', marginTop: 0 }}
                  >
                    {forgotLoading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AuthLayout>
  );
};

export default Login;
