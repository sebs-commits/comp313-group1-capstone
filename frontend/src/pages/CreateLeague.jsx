import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { PlusCircle, Users, Lock, Globe, ArrowRight, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout';
import './LeagueForms.css';

const CreateLeague = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name:        '',
    description: '',
    visibility:  'private',
  });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [created, setCreated]   = useState(null);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Get Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setError('You must be logged in to create a league');
      setLoading(false);
      navigate('/');
      return;
    }

    const token  = session.access_token;
    const userId = session.user.id;

    try {
      const res = await fetch('http://localhost:5050/api/League', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name:            form.name.trim(),
          description:     form.description.trim(),
          isPublic:        form.visibility === 'public',
          createdByUserId: userId,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Server error: ${res.status}`);
      }

      const data = await res.json();
      setCreated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ── */
  if (created) {
    return (
      <Layout>
        <div className="form-page">
          <div className="form-card form-card--success">
            <div className="form-card__icon-wrap" style={{ background: 'rgba(63,185,80,0.12)', color: '#3fb950' }}>
              <CheckCircle size={28} strokeWidth={1.6} />
            </div>
            <h2 className="form-card__title">League Created!</h2>
            <p className="form-card__desc">
              <strong>{created.name}</strong> is ready to go. Share the invite code with your friends.
            </p>

            {created.inviteCode && (
              <div className="invite-code-box">
                <span className="invite-code-label">Invite Code</span>
                <span className="invite-code-value">{created.inviteCode}</span>
              </div>
            )}

            <div className="success-actions">
              <button
                className="btn-primary"
                onClick={() => navigate(`/leagues/${created.id}`)}
              >
                Go to League <ArrowRight size={16} />
              </button>
              <button
                className="btn-secondary"
                onClick={() => navigate('/dashboard')}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  /* ── Create form ── */
  return (
    <Layout>
      <div className="form-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Create a League</h1>
            <p className="page-subtitle">Set up your fantasy NBA league and invite your friends.</p>
          </div>
        </div>

        <div className="form-card">
          <h2 className="form-card__title">League Settings</h2>
          <p className="form-card__desc">
            Choose your league name and settings to get started.
          </p>

          {error && (
            <div className="form-error">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="league-form">
            <div className="form-field">
              <label className="form-label" htmlFor="league-name">
                League Name
              </label>
              <input
                id="league-name"
                type="text"
                className="form-input"
                placeholder="e.g. Hoops Dynasty 2026"
                value={form.name}
                onChange={set('name')}
                maxLength={50}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="league-desc">
                Description <span className="form-label__optional">(optional)</span>
              </label>
              <textarea
                id="league-desc"
                className="form-input form-textarea"
                placeholder="e.g. Office league, winner gets bragging rights"
                value={form.description}
                onChange={set('description')}
                maxLength={200}
                rows={3}
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                <Users size={14} /> League Visibility
              </label>
              <div className="visibility-toggle">
                <button
                  type="button"
                  className={`vis-btn ${form.visibility === 'private' ? 'vis-btn--active' : ''}`}
                  onClick={() => setForm((p) => ({ ...p, visibility: 'private' }))}
                >
                  <Lock size={14} /> Private
                </button>
                <button
                  type="button"
                  className={`vis-btn ${form.visibility === 'public' ? 'vis-btn--active' : ''}`}
                  onClick={() => setForm((p) => ({ ...p, visibility: 'public' }))}
                >
                  <Globe size={14} /> Public
                </button>
              </div>
              <p className="form-hint-inline">
                {form.visibility === 'private'
                  ? 'Only people with the invite code can join.'
                  : 'Anyone can discover and join this league.'}
              </p>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={!form.name.trim() || loading}
            >
              {loading ? 'Creating…' : <><span>Create League</span> <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <p className="form-hint">
          Already have a code?{' '}
          <a href="/join-league" className="form-hint__link">Join an existing league →</a>
        </p>
      </div>
    </Layout>
  );
};

export default CreateLeague;
