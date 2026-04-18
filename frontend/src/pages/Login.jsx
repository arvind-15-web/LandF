import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithPopup,
  GoogleAuthProvider,
  linkWithPhoneNumber,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { auth, RecaptchaVerifier } from '../firebase';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

// Steps: Google login → Phone entry → OTP verify → Profile complete
const STEPS = { GOOGLE: 'google', PHONE: 'phone', OTP: 'otp', REGISTER: 'register' };

const OTP_ERRORS = {
  'auth/invalid-phone-number': 'Invalid phone number. Enter a valid 10-digit number.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes.',
  'auth/captcha-check-failed': 'reCAPTCHA failed. Please refresh and try again.',
  'auth/quota-exceeded': 'SMS quota exceeded. Add a test number in Firebase Console.',
  'auth/app-not-authorized': 'Phone Auth not authorised — see setup steps below.',
  'auth/operation-not-allowed': 'Phone sign-in is disabled. Enable it in Firebase Console → Authentication → Sign-in method.',
  'auth/network-request-failed': 'Network error. Check your internet connection.',
  'auth/provider-already-linked': 'Phone already linked to this account.',
};

const clearRecaptcha = () => {
  if (window.recaptchaVerifier) {
    try { window.recaptchaVerifier.clear(); } catch { }
    window.recaptchaVerifier = null;
  }
};

export default function Login() {
  const [step, setStep] = useState(STEPS.GOOGLE);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [confirmResult, setConfirmResult] = useState(null);
  const [googleUser, setGoogleUser] = useState(null); // keep Google user reference
  const [setupError, setSetupError] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => () => clearRecaptcha(), []);

  const setupRecaptcha = () => {
    clearRecaptcha();
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => { },
      'expired-callback': clearRecaptcha,
    });
  };

  // ── Step 1: Google sign-in ──────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const fbUser = result.user;

      // Check if already fully registered in our DB
      try {
        const token = await fbUser.getIdToken();
        await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        // Already registered — go straight to dashboard
        navigate('/dashboard');
        return;
      } catch {
        // Not registered yet — continue to phone step
      }

      setGoogleUser(fbUser);
      setName(fbUser.displayName || '');
      setStep(STEPS.PHONE);
      toast.success('Google verified! Now confirm your phone number.');
    } catch (err) {
      toast.error(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Send OTP — linked to the existing Google account ───────────
  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) return toast.error('Enter a valid 10-digit number');
    setSetupError(false);
    try {
      setLoading(true);
      setupRecaptcha();
      await window.recaptchaVerifier.render();

      const formatted = `+91${phone}`;
      console.log('[OTP] Linking phone to Google account:', formatted);

      // Use linkWithPhoneNumber so the Google session is preserved with its email
      const result = await linkWithPhoneNumber(auth.currentUser, formatted, window.recaptchaVerifier);
      setConfirmResult(result);
      setStep(STEPS.OTP);
      toast.success('OTP sent to +91 ' + phone);
    } catch (err) {
      console.error('[OTP send error]', err.code, err.message);
      clearRecaptcha();

      // If phone is already linked to this account, skip OTP and go to register
      if (err.code === 'auth/provider-already-linked') {
        setStep(STEPS.REGISTER);
        return;
      }

      const isSetup = ['auth/app-not-authorized', 'auth/operation-not-allowed'].includes(err.code);
      setSetupError(isSetup);
      toast.error(OTP_ERRORS[err.code] || err.message || 'Failed to send OTP', { duration: 8000 });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Verify OTP ─────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) return toast.error('Enter the 6-digit OTP');
    try {
      setLoading(true);
      await confirmResult.confirm(otp);
      // auth.currentUser now has both Google (email) + Phone linked
      setStep(STEPS.REGISTER);
    } catch (err) {
      console.error('[OTP verify error]', err.code, err.message);
      toast.error(
        err.code === 'auth/invalid-verification-code' ? 'Incorrect OTP. Check and try again.' :
          err.code === 'auth/code-expired' ? 'OTP expired. Request a new one.' :
            'OTP verification failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Step 4: Save to our DB ─────────────────────────────────────────────
  const handleRegister = async () => {
    if (!name.trim()) return toast.error('Name is required');
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      const token = await currentUser.getIdToken();

      const { data } = await api.post('/auth/register', {
        firebaseToken: token,
        name: name.trim(),
        // email comes from Google provider; phone from Phone provider
        phone: currentUser.phoneNumber || `+91${phone}`,
      });

      setUser(data.user);
      toast.success('Welcome to Lost & Found! 🎉');
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

        {/* Progress dots */}
        {step !== STEPS.GOOGLE && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {[STEPS.PHONE, STEPS.OTP, STEPS.REGISTER].map((s, i) => {
              const current = [STEPS.PHONE, STEPS.OTP, STEPS.REGISTER].indexOf(step);
              return (
                <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${i <= current ? 'bg-amber-400 w-8' : 'bg-ink-700 w-4'
                  }`} />
              );
            })}
          </div>
        )}

        <div className="card p-6">

          {/* ── STEP: Google ── */}
          {step === STEPS.GOOGLE && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display font-bold text-xl text-ink-50 mb-1">Sign in to continue</h2>
                <p className="text-sm text-ink-400">Sign in with Google, then verify your phone number for security.</p>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-ink-700 hover:bg-ink-600 border border-ink-600 hover:border-ink-500 text-ink-50 font-display font-semibold py-3.5 px-4 rounded-lg transition-all disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {loading ? 'Signing in…' : 'Continue with Google'}
              </button>

              {/* How it works */}
              <div className="border-t border-ink-700 pt-4">
                <p className="text-xs text-ink-500 font-mono uppercase tracking-wider mb-3">How it works</p>
                <div className="space-y-2">
                  {[
                    { n: '1', text: 'Sign in with your Google account' },
                    { n: '2', text: 'Verify your phone number via OTP' },
                    { n: '3', text: 'Access your Lost & Found dashboard' },
                  ].map(({ n, text }) => (
                    <div key={n} className="flex items-center gap-3 text-sm text-ink-400">
                      <span className="w-5 h-5 rounded-full bg-ink-700 text-ink-300 font-mono text-xs flex items-center justify-center shrink-0">{n}</span>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP: Phone ── */}
          {step === STEPS.PHONE && (
            <div className="space-y-4">
              {/* Google verified badge */}
              <div className="flex items-center gap-2 p-3 bg-signal-green/10 border border-signal-green/25 rounded-lg mb-2">
                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                  {googleUser?.photoURL
                    ? <img src={googleUser.photoURL} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-ink-600 flex items-center justify-center text-xs font-bold">{googleUser?.displayName?.[0]}</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-signal-green font-semibold truncate">✓ Google verified</p>
                  <p className="text-xs text-ink-400 truncate">{googleUser?.email}</p>
                </div>
              </div>

              <div>
                <h2 className="font-display font-bold text-xl text-ink-50">Verify your phone</h2>
                <p className="text-sm text-ink-400 mt-1">We'll send an OTP to confirm your identity</p>
              </div>

              <div>
                <label className="label">Phone Number</label>
                <div className="flex gap-2">
                  <div className="flex items-center bg-ink-700 border border-ink-600 rounded-lg px-3 text-ink-400 text-sm font-mono shrink-0">+91</div>
                  <input
                    type="tel" inputMode="numeric" placeholder="9876543210"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="input" maxLength={10} autoFocus
                  />
                </div>
              </div>

              {setupError && (
                <div className="p-3 bg-signal-red/10 border border-signal-red/30 rounded-lg text-xs text-signal-red space-y-1">
                  <p className="font-bold">⚠ Firebase Phone Auth not configured</p>
                  <p>1. Firebase Console → <strong>Authentication → Sign-in method → Phone → Enable</strong></p>
                  <p>2. Add <strong>localhost</strong> to Authorised domains</p>
                  <p>3. For dev: add a test phone number under Phone → Test phone numbers</p>
                </div>
              )}

              <button onClick={handleSendOtp} disabled={loading || phone.length < 10} className="btn-primary w-full">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-ink-900/40 border-t-ink-900 rounded-full animate-spin" />
                    Sending OTP…
                  </span>
                ) : 'Send OTP →'}
              </button>
            </div>
          )}

          {/* ── STEP: OTP ── */}
          {step === STEPS.OTP && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display font-bold text-xl text-ink-50">Enter OTP</h2>
                <p className="text-sm text-ink-400 mt-1">
                  6-digit code sent to <span className="text-ink-100 font-semibold">+91 {phone}</span>
                </p>
              </div>

              <input
                type="text" inputMode="numeric" placeholder="• • • • • •"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="input text-center text-3xl font-mono tracking-[0.6em] py-5"
                maxLength={6} autoFocus
              />

              <button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6} className="btn-primary w-full">
                {loading ? 'Verifying…' : 'Verify OTP'}
              </button>

              <button onClick={handleSendOtp} disabled={loading}
                className="w-full text-center text-sm text-ink-500 hover:text-amber-400 transition-colors font-mono disabled:opacity-40">
                Resend OTP
              </button>
            </div>
          )}

          {/* ── STEP: Register ── */}
          {step === STEPS.REGISTER && (
            <div className="space-y-4">
              {/* Both verified badge */}
              <div className="flex gap-2 mb-2">
                <div className="flex-1 p-2.5 bg-signal-green/10 border border-signal-green/25 rounded-lg text-center">
                  <p className="text-xs text-signal-green font-semibold">✓ Google</p>
                  <p className="text-[10px] text-ink-500 truncate">{auth.currentUser?.email}</p>
                </div>
                <div className="flex-1 p-2.5 bg-signal-green/10 border border-signal-green/25 rounded-lg text-center">
                  <p className="text-xs text-signal-green font-semibold">✓ Phone</p>
                  <p className="text-[10px] text-ink-500">+91 {phone}</p>
                </div>
              </div>

              <div>
                <h2 className="font-display font-bold text-xl text-ink-50">Almost there!</h2>
                <p className="text-sm text-ink-400 mt-1">Confirm your name to complete setup</p>
              </div>

              <div>
                <label className="label">Your Name</label>
                <input type="text" placeholder="Ranjith Kumar M" value={name}
                  onChange={e => setName(e.target.value)} className="input" autoFocus />
              </div>

              <button onClick={handleRegister} disabled={loading || !name.trim()} className="btn-primary w-full py-3.5">
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