import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../firebase';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const STEPS = { INITIAL: 'initial', PHONE: 'phone', OTP: 'otp', REGISTER: 'register' };

export default function Login() {
  const [step, setStep] = useState(STEPS.INITIAL);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [confirmResult, setConfirmResult] = useState(null);
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, firebaseUser } = useAuth();

  useEffect(() => {
    if (searchParams.get('step') === 'register' && firebaseUser) {
      setName(firebaseUser.displayName || '');
      setStep(STEPS.REGISTER);
    }
  }, [searchParams, firebaseUser]);

  // Clean up reCAPTCHA when the component unmounts
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch {}
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const setupRecaptcha = () => {
    // If a verifier already exists, clear it first to avoid the
    // "reCAPTCHA has already been rendered in this element" error
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch {}
      window.recaptchaVerifier = null;
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {
        // Reset on expiry so next attempt creates a fresh verifier
        window.recaptchaVerifier = null;
      },
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const user = result.user;
      setName(user.displayName || '');
      // Check if already registered in our DB
      try {
        const token = await user.getIdToken();
        await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        navigate('/dashboard');
      } catch {
        // Not registered yet — go to phone step
        setStep(STEPS.PHONE);
      }
    } catch (err) {
      toast.error(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) return toast.error('Enter a valid phone number');
    try {
      setLoading(true);
      setupRecaptcha();
      const formatted = phone.startsWith('+') ? phone : `+91${phone}`;
      const result = await signInWithPhoneNumber(auth, formatted, window.recaptchaVerifier);
      setConfirmResult(result);
      setStep(STEPS.OTP);
      toast.success('OTP sent!');
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP');
      // Clear the verifier so a fresh one is created on retry
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch {}
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) return toast.error('Enter 6-digit OTP');
    try {
      setLoading(true);
      await confirmResult.confirm(otp);
      setStep(STEPS.REGISTER);
    } catch {
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) return toast.error('Name is required');
    try {
      setLoading(true);
      const token = await auth.currentUser.getIdToken();
      const { data } = await api.post('/auth/register', {
        firebaseToken: token,
        name: name.trim(),
        phone: phone || auth.currentUser.phoneNumber || '',
      });
      setUser(data.user);
      toast.success('Welcome to Lost & Found!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center px-4">
      <div id="recaptcha-container" />

      <div className="w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex w-16 h-16 bg-amber-400 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-amber-400/20">
            <svg viewBox="0 0 24 24" className="w-9 h-9" fill="none" stroke="#0D0D0D" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <h1 className="text-3xl font-display font-black text-ink-50">
            Lost<span className="text-amber-400">&</span>Found
          </h1>
          <p className="text-sm text-ink-400 mt-1">Smart City Recovery Platform</p>
        </div>

        <div className="card p-6">
          {/* Step: Initial */}
          {step === STEPS.INITIAL && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl text-ink-50 mb-6">Sign in to continue</h2>
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-ink-700 hover:bg-ink-600 border border-ink-600 hover:border-ink-500 text-ink-50 font-display font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {loading ? 'Signing in…' : 'Continue with Google'}
              </button>

              <div className="relative">
                <div className="divider my-4" />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-ink-800 px-3 text-xs text-ink-500 font-mono">
                  or
                </span>
              </div>

              <button
                onClick={() => setStep(STEPS.PHONE)}
                className="w-full btn-secondary text-sm py-3"
              >
                Continue with Phone Number
              </button>
            </div>
          )}

          {/* Step: Phone */}
          {step === STEPS.PHONE && (
            <div className="space-y-4">
              <button onClick={() => setStep(STEPS.INITIAL)} className="text-ink-500 hover:text-ink-300 text-sm flex items-center gap-1 mb-4">
                ← Back
              </button>
              <h2 className="font-display font-bold text-xl text-ink-50">Enter your phone</h2>
              <p className="text-sm text-ink-400">We'll send an OTP to verify your number</p>

              <div>
                <label className="label">Phone Number</label>
                <div className="flex gap-2">
                  <div className="flex items-center bg-ink-700 border border-ink-600 rounded-lg px-3 text-ink-400 text-sm font-mono shrink-0">
                    +91
                  </div>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="input"
                    maxLength={10}
                  />
                </div>
              </div>

              <button onClick={handleSendOtp} disabled={loading || phone.length < 10} className="btn-primary w-full">
                {loading ? 'Sending…' : 'Send OTP'}
              </button>
            </div>
          )}

          {/* Step: OTP */}
          {step === STEPS.OTP && (
            <div className="space-y-4">
              <button onClick={() => setStep(STEPS.PHONE)} className="text-ink-500 hover:text-ink-300 text-sm flex items-center gap-1 mb-4">
                ← Back
              </button>
              <h2 className="font-display font-bold text-xl text-ink-50">Verify OTP</h2>
              <p className="text-sm text-ink-400">Enter the 6-digit code sent to +91 {phone}</p>

              <div>
                <label className="label">OTP Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input text-center text-2xl font-mono tracking-[0.5em]"
                  maxLength={6}
                />
              </div>

              <button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6} className="btn-primary w-full">
                {loading ? 'Verifying…' : 'Verify OTP'}
              </button>

              <button onClick={handleSendOtp} className="w-full text-center text-sm text-ink-500 hover:text-amber-400 transition-colors font-mono">
                Resend OTP
              </button>
            </div>
          )}

          {/* Step: Register */}
          {step === STEPS.REGISTER && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl text-ink-50">Complete your profile</h2>
              <p className="text-sm text-ink-400">Just a few more details to get you started</p>

              <div>
                <label className="label">Your Name</label>
                <input
                  type="text"
                  placeholder="Aravind Kumar"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input"
                />
              </div>

              {!phone && (
                <div>
                  <label className="label">Phone Number (optional)</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="input"
                  />
                </div>
              )}

              <button onClick={handleRegister} disabled={loading || !name.trim()} className="btn-primary w-full">
                {loading ? 'Setting up…' : 'Get Started →'}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-ink-600 mt-6 font-mono">
          Secured by Firebase Authentication
        </p>
      </div>
    </div>
  );
}