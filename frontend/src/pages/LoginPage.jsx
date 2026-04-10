import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const checkBanStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Profile/user`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!res.ok) return false;

    const profile = await res.json();

    if (profile.isPermanentlyBanned) {
      await supabase.auth.signOut();
      setError(`This account has been permanently banned. Reason: ${profile.banReason ?? 'No reason provided.'}`);
      return true;
    }

    if (profile.bannedUntil && new Date(profile.bannedUntil) > new Date()) {
      await supabase.auth.signOut();
      setError(`This account is temporarily banned until ${new Date(profile.bannedUntil).toLocaleString()}. Reason: ${profile.banReason ?? 'No reason provided.'}`);
      return true;
    }

    return false;
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: import.meta.env.VITE_DEMO_EMAIL,
      password: import.meta.env.VITE_DEMO_PASSWORD,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const blocked = await checkBanStatus();
    if (!blocked) navigate('/dashboard');
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const blocked = await checkBanStatus();
    if (!blocked) navigate('/dashboard');
    setLoading(false);
  };

  return (
    <div data-theme="dark" className="min-h-screen w-full flex items-center justify-center">
      <div className="card bg-base-100 shadow-xl w-full max-w-sm">
        <div className="card-body">
          <h1 className="card-title text-2xl justify-center mb-2">Welcome</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Email</legend>
              <input
                id="email"
                type="email"
                className="input w-full"
                placeholder="name@nba.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Password</legend>
              <input
                id="password"
                type="password"
                className="input w-full"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </fieldset>

            <div className="text-right">
              <Link to="/forgot-password" className="text-sm link link-primary">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div role="alert" className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : 'Login'}
            </button>

            <button type="button" className="btn btn-ghost" onClick={handleDemoLogin} disabled={loading}>
              Demo
            </button>
          </form>

          <p className="text-center text-sm mt-2">
            Don't have an account? <a className="link link-primary" href="/register">Register</a>
          </p>
        </div>
      </div>
    </div>
  );
}