import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Users, Lock, Globe, ArrowRight, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout';

const CreateLeague = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name:          '',
    description:   '',
    visibility:    'private',
    draftDate:     '',
    weekStartDate: '',
    weekEndDate:   '',
    scoringType:   'standard',
    maxTeams:      10,
    rosterSize:    13,
    uniqueRosters: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [created, setCreated] = useState(null);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/League`, {
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
          draftDate:       form.draftDate     || null,
          weekStartDate:   form.weekStartDate || null,
          weekEndDate:     form.weekEndDate   || null,
          scoringType:     form.scoringType,
          maxTeams:        Number(form.maxTeams),
          rosterSize:      Number(form.rosterSize),
          uniqueRosters:   form.uniqueRosters,
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

  if (created) {
    return (
      <Layout>
        <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4">
          <div className="card bg-base-200 w-full max-w-md shadow-xl">
            <div className="card-body items-center gap-4 text-center">
              <div className="rounded-2xl bg-success/10 p-4 text-success">
                <CheckCircle size={32} strokeWidth={1.6} />
              </div>
              <div>
                <h2 className="card-title justify-center text-xl">League Created!</h2>
                <p className="mt-1 text-sm text-base-content/60">
                  <strong>{created.name}</strong> is ready to go. Share the invite code with your friends.
                </p>
              </div>

              {created.inviteCode && (
                <div className="bg-base-300 w-full rounded-xl px-6 py-4 text-center">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-base-content/50">
                    Invite Code
                  </p>
                  <p className="text-2xl font-bold tracking-widest text-primary">{created.inviteCode}</p>
                </div>
              )}

              <div className="flex w-full flex-col gap-2 mt-2">
                <button className="btn btn-primary w-full" onClick={() => navigate(`/userLeagues/${created.id}`)}>
                  Go to League <ArrowRight size={16} />
                </button>
                <button className="btn btn-ghost w-full" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-120px)] flex-col items-center justify-center gap-4 px-4 py-8">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight">Create a League</h1>
          <p className="mt-1 text-sm text-base-content/60">Set up your fantasy NBA league and invite your friends.</p>
        </div>

        <div className="card bg-base-200 w-full max-w-2xl shadow-xl">
          <div className="card-body gap-6">
            <div>
              <h2 className="card-title text-lg">League Settings</h2>
              <p className="text-sm text-base-content/60">Choose your league name and settings to get started.</p>
            </div>

            {error && (
              <div role="alert" className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* League Name */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend">League Name</legend>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="e.g. Hoops Dynasty 2026"
                  value={form.name}
                  onChange={set('name')}
                  maxLength={50}
                  required
                />
              </fieldset>

              {/* Description */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend">
                  Description <span className="font-normal text-base-content/40">(optional)</span>
                </legend>
                <textarea
                  className="textarea w-full"
                  placeholder="e.g. Office league, winner gets bragging rights"
                  value={form.description}
                  onChange={set('description')}
                  maxLength={200}
                  rows={3}
                />
              </fieldset>

              {/* Draft Date */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend">
                  Draft Date <span className="font-normal text-base-content/40">(optional)</span>
                </legend>
                <input
                  type="date"
                  className="input w-full"
                  value={form.draftDate}
                  onChange={set('draftDate')}
                />
              </fieldset>

              {/* Season Start / End */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Season Start Date</legend>
                  <input
                    type="date"
                    className="input w-full"
                    value={form.weekStartDate}
                    onChange={set('weekStartDate')}
                    required
                  />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">
                    Season End Date <span className="font-normal text-base-content/40">(optional)</span>
                  </legend>
                  <input
                    type="date"
                    className="input w-full"
                    value={form.weekEndDate}
                    min={form.weekStartDate || undefined}
                    onChange={set('weekEndDate')}
                  />
                </fieldset>
              </div>

              {/* Scoring Type / Max Teams / Roster Size */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Scoring Type</legend>
                  <select
                    className="select w-full"
                    value={form.scoringType}
                    onChange={set('scoringType')}
                  >
                    <option value="standard">Standard</option>
                    <option value="points">Points</option>
                    <option value="categories">Categories</option>
                  </select>
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Max Teams</legend>
                  <input
                    type="number"
                    className="input w-full"
                    value={form.maxTeams}
                    onChange={set('maxTeams')}
                    min={2}
                    max={20}
                    required
                  />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Roster Size</legend>
                  <input
                    type="number"
                    className="input w-full"
                    value={form.rosterSize}
                    onChange={set('rosterSize')}
                    min={1}
                    max={30}
                    required
                  />
                </fieldset>
              </div>

              {/* Unique Rosters */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={form.uniqueRosters}
                    onChange={(e) => setForm((p) => ({ ...p, uniqueRosters: e.target.checked }))}
                  />
                  <span className="label-text">
                    <span className="font-semibold">Unique Rosters</span>
                    <span className="text-base-content/50"> — prevent managers from rostering the same player</span>
                  </span>
                </label>
              </div>

              {/* Visibility */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend flex items-center gap-1.5">
                  <Users size={13} /> League Visibility
                </legend>
                <div className="join w-full">
                  <button
                    type="button"
                    className={`btn join-item flex-1 ${form.visibility === 'private' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setForm((p) => ({ ...p, visibility: 'private' }))}
                  >
                    <Lock size={14} /> Private
                  </button>
                  <button
                    type="button"
                    className={`btn join-item flex-1 ${form.visibility === 'public' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setForm((p) => ({ ...p, visibility: 'public' }))}
                  >
                    <Globe size={14} /> Public
                  </button>
                </div>
                <p className="mt-1 text-xs text-base-content/50">
                  {form.visibility === 'private'
                    ? 'Only people with the invite code can join.'
                    : 'Anyone can discover and join this league.'}
                </p>
              </fieldset>

              <button
                type="submit"
                className="btn btn-primary w-full mt-2"
                disabled={!form.name.trim() || loading}
              >
                {loading
                  ? <span className="loading loading-spinner loading-sm" />
                  : <><span>Create League</span><ArrowRight size={16} /></>}
              </button>
            </form>
          </div>
        </div>

        <p className="text-sm text-base-content/50">
          Already have a code?{' '}
          <a href="/join-league" className="link link-primary">Join an existing league →</a>
        </p>
      </div>
    </Layout>
  );
};

export default CreateLeague;
