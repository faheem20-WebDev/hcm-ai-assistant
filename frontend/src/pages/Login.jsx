import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import ErrorBox from '../components/ErrorBox';

const Login = () => {
  const { login, verifyPin, setupPin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Auth steps: 'CREDENTIALS' | 'PIN_VERIFY' | 'PIN_SETUP'
  const [step, setStep] = useState('CREDENTIALS');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
        // Admin user logged in immediately without PIN
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

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f172a',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '2rem',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.5rem', fontWeight: '700' }}>
            HCM Lite
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
            {step === 'CREDENTIALS' && 'Sign in to access your HR workspace'}
            {step === 'PIN_VERIFY' && 'Two-Factor PIN Authentication'}
            {step === 'PIN_SETUP' && 'Create Your 5-Digit Security PIN'}
          </p>
        </div>

        {message && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#15803d',
            padding: '0.75rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}>
            {message}
          </div>
        )}

        <ErrorBox error={error} />

        {/* STEP 1: EMAIL & PASSWORD */}
        {step === 'CREDENTIALS' && (
          <form onSubmit={handleCredentialsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@company.com"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.5rem',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '0.75rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* STEP 2: VERIFY 5-DIGIT PIN */}
        {step === 'PIN_VERIFY' && (
          <form onSubmit={handlePinVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '0.75rem',
              textAlign: 'center',
              fontSize: '0.85rem',
              color: '#475569'
            }}>
              Authenticating as <strong>{pinData?.name || pinData?.email}</strong> ({pinData?.role?.toUpperCase()})
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem', textAlign: 'center' }}>
                Enter Your 5-Digit Security PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={5}
                required
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="•••••"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '1.5rem',
                  textAlign: 'center',
                  letterSpacing: '0.5em',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || pin.length !== 5}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '0.75rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: (loading || pin.length !== 5) ? 'not-allowed' : 'pointer',
                opacity: (loading || pin.length !== 5) ? 0.7 : 1
              }}
            >
              {loading ? 'Verifying PIN...' : 'Verify & Continue'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={resetToCredentials}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  padding: 0
                }}
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
          <form onSubmit={handlePinSetupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              padding: '0.75rem',
              fontSize: '0.85rem',
              color: '#1e40af'
            }}>
              First-time setup: Create a confidential 5-digit PIN for <strong>{pinData?.email}</strong>.
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                New 5-Digit PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={5}
                required
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="5 numeric digits"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '1.1rem',
                  letterSpacing: '0.2em',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                Confirm 5-Digit PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={5}
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="Re-enter 5 digits"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '1.1rem',
                  letterSpacing: '0.2em',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || pin.length !== 5 || confirmPin.length !== 5}
              style={{
                marginTop: '0.5rem',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '0.75rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Setting PIN...' : 'Save PIN & Sign In'}
            </button>

            <button
              type="button"
              onClick={resetToCredentials}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '0.8rem',
                cursor: 'pointer',
                marginTop: '0.25rem'
              }}
            >
              ← Back to Login
            </button>
          </form>
        )}
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '400px',
            padding: '1.75rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '700' }}>
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
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  marginBottom: '1rem'
                }}>
                  {forgotSuccess}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSuccess(null);
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.65rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  Submit a password reset request to your system administrator. Once approved, you will receive a temporary password.
                </p>

                <ErrorBox error={forgotError} />

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                    Registered Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="user@company.com"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                    Reason / Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={forgotReason}
                    onChange={(e) => setForgotReason(e.target.value)}
                    placeholder="e.g. Locked out of account"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    style={{
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.6rem 1rem',
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
                    style={{
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.6rem 1.25rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: forgotLoading ? 'not-allowed' : 'pointer',
                      opacity: forgotLoading ? 0.7 : 1
                    }}
                  >
                    {forgotLoading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
