import { useNavigate } from 'react-router-dom';

const steps = [
  { icon: '📋', title: 'Report Item', desc: 'Report a lost or found item with photos, description, and location.' },
  { icon: '🤖', title: 'Smart Matching', desc: 'Our system automatically matches items by category, keywords, and location.' },
  { icon: '🤝', title: 'Connect Safely', desc: 'Request contact — shared only after mutual approval, protecting your privacy.' },
  { icon: '✅', title: 'Verify & Return', desc: 'Use the secret code to verify the handshake and complete the return.' },
];

const stats = [
  { value: '2,400+', label: 'Items Recovered' },
  { value: '94%',    label: 'Match Accuracy' },
  { value: '48h',    label: 'Avg. Return Time' },
  { value: '12',     label: 'City Districts' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <span className="font-bold text-slate-900">Lost<span className="text-blue-600">&</span>Found</span>
          </div>
          <button onClick={() => navigate('/login')} className="btn-primary text-sm py-2 px-4">
            Login
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="max-w-4xl mx-auto text-center animate-fade-up">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Smart City Initiative · Chennai
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
            Lost something?<br/>
            <span className="text-blue-600">We'll help you find it.</span>
          </h1>
          <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto leading-relaxed">
            A secure, community-driven platform that reunites people with their lost belongings using intelligent matching and privacy-first contact sharing.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/login')} className="btn-primary text-base py-3 px-8">
              Get Started — It's Free
            </button>
            <button
              onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-secondary text-base py-3 px-8">
              How It Works
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-100 bg-slate-50 py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold text-blue-600 mb-1">{s.value}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">Process</p>
          <h2 className="text-3xl font-extrabold text-slate-900">How it works</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, i) => (
            <div key={i} className="card p-5 hover:shadow-card-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl mb-4">{step.icon}</div>
              <div className="text-xs font-bold text-blue-600 mb-1">0{i + 1}</div>
              <h3 className="font-bold text-slate-800 mb-1.5">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 border-y border-slate-100 px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-2">Security & Privacy</p>
            <h2 className="text-3xl font-extrabold text-slate-900">Built with trust</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: '🔐', title: 'Firebase Auth', desc: 'Google login + Phone OTP — two layers of verified identity.' },
              { icon: '🔒', title: 'Contact Gating', desc: 'Phone numbers are hidden until both parties approve sharing.' },
              { icon: '🤝', title: 'Secret Handshake', desc: 'Bcrypt-encrypted codes verify physical exchange before marking resolved.' },
            ].map((f) => (
              <div key={f.title} className="card p-5">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-slate-800 mb-1">{f.title}</h3>
                <p className="text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center bg-blue-600">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-extrabold text-white mb-4">Ready to recover?</h2>
          <p className="text-blue-100 mb-8">Join thousands of citizens helping each other reconnect with lost belongings.</p>
          <button onClick={() => navigate('/login')}
            className="bg-white text-blue-700 font-bold py-3 px-10 rounded-lg hover:bg-blue-50 transition-colors text-base">
            Start Now →
          </button>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-6 py-5 text-center">
        <p className="text-xs text-slate-400">Lost & Found · Smart City Platform · Built for the community</p>
      </footer>
    </div>
  );
}