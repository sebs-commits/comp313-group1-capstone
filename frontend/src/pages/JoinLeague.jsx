import { useState, useEffect } from 'react';
import { UserPlus, Hash, ArrowRight, Globe, Users, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Layout from '../components/Layout';

const JoinLeague = () => {
  const [tab, setTab] = useState('code');

  // --- Invite code state ---
  const [code, setCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [codeSuccess, setCodeSuccess] = useState('');

  // --- Public leagues state ---
  const [publicLeagues, setPublicLeagues] = useState([]);
  const [myLeagueIds, setMyLeagueIds] = useState(new Set());
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseError, setBrowseError] = useState('');
  const [search, setSearch] = useState('');
  const [joiningId, setJoiningId] = useState(null);
  const [joinSuccess, setJoinSuccess] = useState('');
  const [joinError, setJoinError] = useState('');

  const navigate = useNavigate();

  // Fetch public leagues when Browse tab is opened
  useEffect(() => {
    if (tab !== 'browse') return;
    const load = async () => {
      setBrowseLoading(true);
      setBrowseError('');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = session ? { Authorization: `Bearer ${session.access_token}` } : {};

        const [publicRes, myRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/League`, { headers }),
          session
            ? fetch(`${import.meta.env.VITE_API_URL}/api/league/my-leagues?userId=${session.user.id}`, { headers })
            : Promise.resolve(null),
        ]);

        if (!publicRes.ok) throw new Error(`Failed to load leagues (${publicRes.status})`);
        const [publicData, myData] = await Promise.all([
          publicRes.json(),
          myRes?.ok ? myRes.json() : Promise.resolve([]),
        ]);

        setPublicLeagues(publicData);
        setMyLeagueIds(new Set((myData ?? []).map((l) => l.id)));
      } catch (err) {
        setBrowseError(err.message);
      } finally {
        setBrowseLoading(false);
      }
    };
    load();
  }, [tab]);

  // --- Join by invite code ---
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setCodeError('');
    setCodeSuccess('');
    setCodeLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setCodeError('You must be logged in to join a league.'); navigate('/'); return; }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/League/join-by-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ userId: session.user.id, inviteCode: code.trim().toUpperCase() }),
      });

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : await response.text();

      if (!response.ok) {
        throw new Error(typeof data === 'string' ? data : data?.message || 'Unable to join league.');
      }

      setCodeSuccess(
        typeof data === 'object' && data?.leagueName
          ? `Joined "${data.leagueName}" successfully.`
          : 'Joined league successfully.'
      );

      if (typeof data === 'object' && data?.leagueId) {
        setTimeout(() => navigate(`/userleagues/${data.leagueId}`), 600);
      } else {
        setTimeout(() => navigate('/dashboard'), 600);
      }
    } catch (err) {
      setCodeError(err.message || 'Something went wrong.');
    } finally {
      setCodeLoading(false);
    }
  };

  // --- Join public league by ID ---
  const handleJoinPublic = async (league) => {
    setJoiningId(league.id);
    setJoinError('');
    setJoinSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/'); return; }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/League/${league.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ userId: session.user.id }),
      });

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await response.json() : await response.text();

      if (!response.ok) {
        throw new Error(typeof data === 'string' ? data : data?.message || 'Unable to join league.');
      }

      setMyLeagueIds((prev) => new Set([...prev, league.id]));
      setJoinSuccess(`Joined "${league.name}" successfully.`);
      setTimeout(() => navigate(`/userleagues/${league.id}`), 600);
    } catch (err) {
      setJoinError(err.message || 'Something went wrong.');
    } finally {
      setJoiningId(null);
    }
  };

  const filtered = publicLeagues.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-120px)] flex-col items-center justify-center gap-4 px-4 py-8">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight">Join a League</h1>
          <p className="mt-1 text-sm text-base-content/60">Use an invite code or browse open public leagues.</p>
        </div>

        {/* Tabs */}
        <div className="w-full max-w-2xl">
          <div className="tabs tabs-box">
            <button
              className={`tab flex items-center gap-2 ${tab === 'code' ? 'tab-active' : ''}`}
              onClick={() => setTab('code')}
            >
              <Hash size={14} /> Invite Code
            </button>
            <button
              className={`tab flex items-center gap-2 ${tab === 'browse' ? 'tab-active' : ''}`}
              onClick={() => setTab('browse')}
            >
              <Globe size={14} /> Browse Public
            </button>
          </div>
        </div>

        {/* Invite Code tab */}
        {tab === 'code' && (
          <div className="card bg-base-200 w-full max-w-2xl shadow-xl">
            <div className="card-body gap-6">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-info/10 p-3 text-info">
                  <UserPlus size={28} strokeWidth={1.6} />
                </div>
                <div>
                  <h2 className="card-title text-lg">League Invite Code</h2>
                  <p className="text-sm text-base-content/60">
                    Ask your league commissioner for the invite code, then paste it below.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend flex items-center gap-1.5">
                    <Hash size={13} /> Invite Code
                  </legend>
                  <input
                    type="text"
                    className="input w-full tracking-widest font-mono"
                    placeholder="e.g. HOOP2025"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    maxLength={20}
                    required
                  />
                </fieldset>

                {codeError && <div role="alert" className="alert alert-error"><span>{codeError}</span></div>}
                {codeSuccess && <div role="alert" className="alert alert-success"><span>{codeSuccess}</span></div>}

                <button type="submit" className="btn btn-primary w-full" disabled={!code.trim() || codeLoading}>
                  {codeLoading
                    ? <span className="loading loading-spinner loading-sm" />
                    : <>Join League <ArrowRight size={16} /></>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Browse Public tab */}
        {tab === 'browse' && (
          <div className="card bg-base-200 w-full max-w-2xl shadow-xl">
            <div className="card-body gap-5">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Globe size={28} strokeWidth={1.6} />
                </div>
                <div>
                  <h2 className="card-title text-lg">Public Leagues</h2>
                  <p className="text-sm text-base-content/60">Open leagues anyone can join — no invite needed.</p>
                </div>
              </div>

              {/* Search */}
              <label className="input w-full flex items-center gap-2">
                <Search size={15} className="text-base-content/40" />
                <input
                  type="text"
                  className="grow"
                  placeholder="Search leagues…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>

              {joinSuccess && <div role="alert" className="alert alert-success"><span>{joinSuccess}</span></div>}
              {joinError && <div role="alert" className="alert alert-error"><span>{joinError}</span></div>}
              {browseError && <div role="alert" className="alert alert-error"><span>{browseError}</span></div>}

              {browseLoading && (
                <div className="flex justify-center py-10">
                  <span className="loading loading-spinner loading-lg text-primary" />
                </div>
              )}

              {!browseLoading && !browseError && filtered.length === 0 && (
                <p className="py-8 text-center text-sm text-base-content/50">
                  {search ? 'No leagues match your search.' : 'No public leagues available yet.'}
                </p>
              )}

              {!browseLoading && filtered.length > 0 && (
                <div className="flex flex-col gap-3">
                  {filtered.map((league) => (
                    <div
                      key={league.id}
                      className="flex items-center justify-between gap-4 rounded-xl bg-base-300 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{league.name}</p>
                        {league.description && (
                          <p className="truncate text-xs text-base-content/50 mt-0.5">{league.description}</p>
                        )}
                        <div className="mt-1 flex items-center gap-3 text-xs text-base-content/40">
                          <span className="flex items-center gap-1"><Users size={11} /> {league.memberCount ?? 0} / {league.maxTeams ?? '?'}</span>
                          {league.scoringType && <span className="capitalize">{league.scoringType}</span>}
                        </div>
                      </div>
                      {myLeagueIds.has(league.id) ? (
                        <span className="badge badge-success badge-sm shrink-0 px-3 py-3">Joined</span>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm shrink-0"
                          disabled={joiningId === league.id}
                          onClick={() => handleJoinPublic(league)}
                        >
                          {joiningId === league.id
                            ? <span className="loading loading-spinner loading-xs" />
                            : <>Join <ArrowRight size={13} /></>}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-sm text-base-content/50">
          Want to start fresh?{' '}
          <a href="/create-league" className="link link-primary">Create your own league →</a>
        </p>
      </div>
    </Layout>
  );
};

export default JoinLeague;
