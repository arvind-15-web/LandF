import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider, linkWithPhoneNumber, PhoneAuthProvider, signInWithCredential, linkWithCredential } from 'firebase/auth';
import { auth, RecaptchaVerifier } from '../firebase';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const STEPS = { GOOGLE: 'google', PHONE: 'phone', OTP: 'otp', REGISTER: 'register' };
const OTP_ERRORS = {
  'auth/invalid-phone-number':   'Invalid phone number. Enter a valid 10-digit number.',
  'auth/too-many-requests':      'Too many attempts. Please wait a few minutes.',
  'auth/captcha-check-failed':   'reCAPTCHA failed. Please refresh and try again.',
  'auth/quota-exceeded':         'SMS quota exceeded. Add a test number in Firebase Console.',
  'auth/app-not-authorized':     'Phone Auth not authorised — see setup steps below.',
  'auth/operation-not-allowed':  'Phone sign-in is disabled. Enable it in Firebase Console → Authentication → Sign-in method.',
  'auth/network-request-failed': 'Network error. Check your internet connection.',
};
const clearRecaptcha = () => {
  if (window.recaptchaVerifier) { try { window.recaptchaVerifier.clear(); } catch {} window.recaptchaVerifier = null; }
};

export default function Login() {
  const [step, setStep]                         = useState(STEPS.GOOGLE);
  const [loading, setLoading]                   = useState(false);
  const [phone, setPhone]                       = useState('');
  const [otp, setOtp]                           = useState('');
  const [name, setName]                         = useState('');
  const [confirmResult, setConfirmResult]       = useState(null);
  const [googleUser, setGoogleUser]             = useState(null);
  const [googleCredential, setGoogleCredential] = useState(null);
  const [setupError, setSetupError]             = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => () => clearRecaptcha(), []);

  const setupRecaptcha = () => {
    clearRecaptcha();
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible', callback: () => {}, 'expired-callback': clearRecaptcha });
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const fbUser = result.user;
      const cred   = GoogleAuthProvider.credentialFromResult(result);
      try {
        const token = await fbUser.getIdToken();
        await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        navigate('/dashboard'); return;
      } catch {}
      setGoogleUser(fbUser); setGoogleCredential(cred); setName(fbUser.displayName || ''); setStep(STEPS.PHONE);
      toast.success('Google verified! Now confirm your phone.');
    } catch (err) { toast.error(err.message || 'Google sign-in failed'); }
    finally { setLoading(false); }
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) return toast.error('Enter a valid 10-digit number');
    setSetupError(false);
    try {
      setLoading(true); setupRecaptcha(); await window.recaptchaVerifier.render();
      const result = await linkWithPhoneNumber(auth.currentUser, `+91${phone}`, window.recaptchaVerifier);
      setConfirmResult(result); setStep(STEPS.OTP); toast.success('OTP sent to +91 ' + phone);
    } catch (err) {
      console.error('[OTP send error]', err.code, err.message); clearRecaptcha();
      if (err.code === 'auth/provider-already-linked') { setStep(STEPS.REGISTER); return; }
      setSetupError(['auth/app-not-authorized','auth/operation-not-allowed'].includes(err.code));
      toast.error(OTP_ERRORS[err.code] || err.message || 'Failed to send OTP', { duration: 8000 });
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) return toast.error('Enter the 6-digit OTP');
    try {
      setLoading(true); await confirmResult.confirm(otp); setStep(STEPS.REGISTER);
    } catch (err) {
      console.error('[OTP verify error]', err.code, err.message);
      if (err.code === 'auth/account-exists-with-different-credential') {
        try {
          toast.loading('Merging accounts…', { id: 'merge' });
          const phoneCred = PhoneAuthProvider.credential(confirmResult.verificationId, otp);
          await signInWithCredential(auth, phoneCred);
          if (googleCredential) await linkWithCredential(auth.currentUser, googleCredential);
          toast.dismiss('merge'); toast.success('Accounts merged!'); setStep(STEPS.REGISTER);
        } catch (mergeErr) {
          toast.dismiss('merge');
          toast.error('Merge failed. Delete the phone-only user in Firebase Console → Authentication → Users, then try again.', { duration: 10000 });
        }
        return;
      }
      toast.error(err.code === 'auth/invalid-verification-code' ? 'Incorrect OTP.' : err.code === 'auth/code-expired' ? 'OTP expired. Tap Resend.' : 'OTP verification failed.');
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!name.trim()) return toast.error('Name is required');
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      const token = await currentUser.getIdToken(true);
      const { data } = await api.post('/auth/register', { firebaseToken: token, name: name.trim(), phone: currentUser.phoneNumber || `+91${phone}` });
      setUser(data.user); toast.success('Welcome to Lost & Found! 🎉'); navigate('/dashboard');
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const stepIndex = [STEPS.PHONE, STEPS.OTP, STEPS.REGISTER].indexOf(step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-4">
      <div id="recaptcha-container" />
      <div className="w-full max-w-sm animate-fade-up">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-blue-600 rounded-2xl items-center justify-center mb-4 shadow-blue">
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="white" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Lost<span className="text-blue-600">&</span>Found</h1>
          <p className="text-sm text-slate-400 mt-1">Smart City Recovery Platform</p>
        </div>

        {step !== STEPS.GOOGLE && (
          <div className="flex items-center gap-2 justify-center mb-6">
            {[STEPS.PHONE, STEPS.OTP, STEPS.REGISTER].map((s, i) => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${i <= stepIndex ? 'bg-blue-600 w-10' : 'bg-slate-200 w-5'}`}/>
            ))}
          </div>
        )}

        <div className="card p-6 shadow-card-lg">
          {step === STEPS.GOOGLE && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Sign in to continue</h2>
                <p className="text-sm text-slate-500">Sign in with Google, then verify your phone for security.</p>
              </div>
              <button onClick={handleGoogleSignIn} disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold py-3 px-4 rounded-lg transition-all shadow-sm disabled:opacity-50">
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {loading ? 'Signing in…' : 'Continue with Google'}
              </button>
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">How it works</p>
                {[['1','Sign in with your Google account'],['2','Verify your phone number via OTP'],['3','Access your Lost & Found dashboard']].map(([n,t]) => (
                  <div key={n} className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0">{n}</span>{t}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === STEPS.PHONE && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 p-3 bg-green-50 border border-green-200 rounded-xl">
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-blue-100 flex items-center justify-center">
                  {googleUser?.photoURL ? <img src={googleUser.photoURL} alt="" className="w-full h-full object-cover"/> : <span className="text-xs font-bold text-blue-600">{googleUser?.displayName?.[0]}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-green-700">✓ Google verified</p>
                  <p className="text-xs text-slate-500 truncate">{googleUser?.email}</p>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Verify your phone</h2>
                <p className="text-sm text-slate-500">We'll send an OTP to confirm your identity</p>
              </div>
              <div>
                <label className="label">Phone Number</label>
                <div className="flex gap-2">
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 text-slate-500 text-sm font-medium shrink-0">+91</div>
                  <input type="tel" inputMode="numeric" placeholder="9876543210" value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))} className="input" maxLength={10} autoFocus/>
                </div>
              </div>
              {setupError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1">
                  <p className="font-bold">⚠ Firebase Phone Auth not configured</p>
                  <p>1. Firebase Console → Authentication → Sign-in method → Phone → <strong>Enable</strong></p>
                  <p>2. Add <strong>localhost</strong> to Authorised domains</p>
                  <p>3. Add a test phone number under Phone → Test phone numbers</p>
                </div>
              )}
              <button onClick={handleSendOtp} disabled={loading || phone.length < 10} className="btn-primary w-full py-3">
                {loading ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Sending OTP…</span> : 'Send OTP →'}
              </button>
            </div>
          )}

          {step === STEPS.OTP && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Enter OTP</h2>
                <p className="text-sm text-slate-500">6-digit code sent to <span className="font-semibold text-slate-800">+91 {phone}</span></p>
              </div>
              <input type="text" inputMode="numeric" placeholder="• • • • • •" value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                className="input text-center text-2xl font-bold tracking-[0.5em] py-4" maxLength={6} autoFocus/>
              <button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6} className="btn-primary w-full py-3">
                {loading ? 'Verifying…' : 'Verify OTP'}
              </button>
              <button onClick={handleSendOtp} disabled={loading}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-40 transition-colors">
                Resend OTP
              </button>
            </div>
          )}

          {step === STEPS.REGISTER && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-green-50 border border-green-200 rounded-xl text-center">
                  <p className="text-xs font-semibold text-green-700">✓ Google</p>
                  <p className="text-[10px] text-slate-400 truncate">{auth.currentUser?.email}</p>
                </div>
                <div className="p-2.5 bg-green-50 border border-green-200 rounded-xl text-center">
                  <p className="text-xs font-semibold text-green-700">✓ Phone</p>
                  <p className="text-[10px] text-slate-400">+91 {phone}</p>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Almost there!</h2>
                <p className="text-sm text-slate-500">Confirm your name to complete setup</p>
              </div>
              <div>
                <label className="label">Your Name</label>
                <input type="text" placeholder="Ranjith Kumar M" value={name} onChange={e => setName(e.target.value)} className="input" autoFocus/>
              </div>
              <button onClick={handleRegister} disabled={loading || !name.trim()} className="btn-primary w-full py-3">
                {loading ? 'Setting up…' : 'Get Started →'}
              </button>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-slate-400 mt-5">Secured by Firebase Authentication</p>
      </div>
    </div>
  );
}