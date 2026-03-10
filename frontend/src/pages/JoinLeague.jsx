import { useState } from 'react';
import { UserPlus, Hash, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Layout from '../components/Layout';
import './LeagueForms.css';

const JoinLeague = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      // Match CreateLeague auth flow
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setErrorMsg('You must be logged in to join a league.');
        navigate('/');
        return;
      }

      const token = session.access_token;
      const userId = session.user.id;

      // Use the same API root style as CreateLeague to avoid route mismatch
      const response = await fetch('http://localhost:5050/api/League/join-by-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          inviteCode: code.trim().toUpperCase(),
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        const message = typeof data === 'string'
          ? data
          : data?.message || 'Unable to join league.';
        throw new Error(message);
      }

      setSuccessMsg(
        typeof data === 'object' && data?.leagueName
          ? `Joined "${data.leagueName}" successfully.`
          : 'Joined league successfully.'
      );

      if (typeof data === 'object' && data?.leagueId) {
        setTimeout(() => navigate(`/leagues/${data.leagueId}`), 600);
      } else {
        setTimeout(() => navigate('/dashboard'), 600);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="form-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Join a League</h1>
            <p className="page-subtitle">Enter your invite code to jump into the action.</p>
          </div>
        </div>

        <div className="form-card">
          <div className="form-card__icon-wrap" style={{ background: 'rgba(88,166,255,0.12)', color: '#58a6ff' }}>
            <UserPlus size={28} strokeWidth={1.6} />
          </div>
          <h2 className="form-card__title">League Invite Code</h2>
          <p className="form-card__desc">
            Ask your league commissioner for the invite code, then paste it below.
          </p>

          <form onSubmit={handleSubmit} className="league-form">
            <div className="form-field">
              <label className="form-label" htmlFor="league-code">
                <Hash size={14} /> Invite Code
              </label>
              <input
                id="league-code"
                type="text"
                className="form-input"
                placeholder="e.g. HOOP-2025-XK7"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={20}
                required
              />
            </div>

            {errorMsg ? <p className="form-error">{errorMsg}</p> : null}
            {successMsg ? <p className="form-success">{successMsg}</p> : null}

            <button type="submit" className="btn-primary" disabled={!code.trim() || loading}>
              {loading ? 'Joining...' : <>Join League <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <p className="form-hint">
          Don't have a code?{' '}
          <a href="/create-league" className="form-hint__link">Create your own league →</a>
        </p>
      </div>
    </Layout>
  );
};

export default JoinLeague;
