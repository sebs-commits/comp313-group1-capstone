import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ChevronRight } from 'lucide-react';
import Layout from '../components/Layout';

const getGameStatus = (statusText = '') => {
  const t = statusText.toLowerCase();
  if (t.includes('final')) return 'FINAL';
  if (t.includes('halftime')) return 'LIVE';
  if (/\bq[1-4]\b/.test(t)) return 'LIVE';
  if (/\b\d{1,2}:\d{2}\b/.test(t) && !/[ap]m/.test(t)) return 'LIVE';
  return 'UPCOMING';
};

const StatCard = ({ label, value, sub }) => (
  <div
    className="flex min-h-24 items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
    style={{ paddingLeft: '1rem', paddingRight: '2rem', paddingTop: '0.75rem'}}
  >
    <div style={{ marginLeft: '0.25rem' }}>
      <span className="text-[32px] font-bold leading-none tracking-tight text-[var(--text-primary)]">{value}</span>
      <p className="mt-1 whitespace-nowrap text-[13px] font-medium text-[var(--text-secondary)]">{label}</p>
    </div>
    {sub && (
      <p
        className="self-start pt-1 text-right text-[12px] text-[var(--text-muted)] opacity-70"
        style={{ marginRight: '0.25rem' }}
      >
        {sub}
      </p>
    )}
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate('/');
        return;
      }

      const token = session.access_token;
      const headers = { Authorization: `Bearer ${token}` };

      Promise.all([
        fetch('http://localhost:5050/api/Nba/scoreboard')
          .then((r) => r.json())
          .catch(() => null),

        fetch(`http://localhost:5050/api/league/my-leagues?userId=${session.user.id}`, { headers })
          .then(async (r) => {
            const text = await r.text();
            console.log('[my-leagues] status:', r.status, 'body:', text);
            if (!r.ok) return [];
            return JSON.parse(text);
          })
          .catch((err) => { console.error('[my-leagues] fetch error:', err); return []; }),

        fetch('http://localhost:5050/api/Profile/user', { headers })
          .then(async (r) => {
            const text = await r.text();
            console.log('[profile] status:', r.status, 'body:', text);
            if (!r.ok) return null; // <-- stop kicking to login on profile failure
            return JSON.parse(text);
          })
          .catch((err) => { console.error('[profile] fetch error:', err); return null; }),
      ])
        .then(([scoreboardData, leagueData, profileData]) => {
          console.log('[dashboard] leagues:', leagueData);
          console.log('[dashboard] userId sent:', session.user.id);
          setGames(scoreboardData?.scoreboard?.games ?? []);
          setLeagues(Array.isArray(leagueData) ? leagueData : []);
          setProfile(profileData);
        })
        .catch((err) => {
          console.error('Dashboard fetch error:', err);
        })
        .finally(() => setLoading(false));
    };

    checkAuthAndFetchData();
  }, [navigate]);

  const liveGames = games.filter((g) => getGameStatus(g.gameStatusText) === 'LIVE');

  const stats = [
    {
      label: 'Active Leagues',
      value: loading ? '—' : leagues.length.toString(),
      color: '#f0c040',
    },
    {
      label: 'Live Games',
      value: loading ? '—' : liveGames.length.toString(),
      color: '#3fb950',
      sub: 'In progress now',
    },
    {
      label: 'Best Rank',
      value: leagues.length > 0 ? `#${Math.min(...leagues.map((l) => l.rank ?? 99))}` : '—',
      color: '#e8813a',
      sub: leagues.length > 0 ? `Out of ${leagues[0]?.totalManagers ?? '—'} managers` : 'No leagues yet',
    },
    {
      label: 'Weekly Points',
      value: profile?.weeklyPoints ?? '—',
      color: '#58a6ff',
      sub: 'This week',
    },
  ];

  return (
    <Layout>
      <div className="flex flex-col gap-7">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-[var(--bg-primary)] px-8 py-6">
          <div style={{paddingLeft: '1rem'}}>
            <h1 className="text-[28px] font-bold tracking-tight text-[var(--text-primary)]">
              Dashboard <span className="ml-1 text-[22px]"></span>
            </h1>
            <p className="mt-1 text-[15px] text-[var(--text-secondary)]">
              Welcome back{profile?.username ? `, ${profile.username}` : ''}!
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-5 py-2.5 text-[13px] text-[var(--text-secondary)]"
          style={{ marginRight: '3rem', paddingRight: '1.25rem', paddingLeft: '1.25rem' }}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>

        {/* ── Stat Cards ── */}
        <div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
          style={{ marginLeft: '14px', paddingLeft: '8px', paddingRight: '8px' }}
        >
          {stats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>

        {/* ── Mid Row ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* My Leagues */}
          <section
            className="overflow-hidden rounded-xl bg-[var(--bg-primary)]"
            style={{ marginLeft: '14px', paddingLeft: '8px', paddingRight: '8px' }}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-8 py-5"
            style={{ marginBottom: '8px' }}>
              <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">My Leagues</h2>
              <Link
                to="/userLeagues"
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-[14px] font-medium transition-all hover:bg-[rgba(232,129,58,0.1)]"
                style={{ color: 'var(--accent)' }}
              >
                View all <ChevronRight size={15} />
              </Link>
            </div>
            <div className="flex flex-col gap-3 px-8 py-5">
              {loading && <p className="px-2 py-6 text-[15px] text-[var(--text-secondary)]">Loading leagues…</p>}
              {!loading && leagues.length === 0 && (
                <p className="px-2 py-6 text-[15px] text-[var(--text-secondary)]">You haven't joined any leagues yet.</p>
              )}
              {leagues.map((l, i) => (
                <Link
                  to={`/userLeagues/${l.id}`}
                  key={l.id ?? i}
                  className="flex min-h-20 items-center gap-5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-7 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(232,129,58,0.35)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                 style={{ paddingLeft: '1.5rem'}}>
                  <span className="shrink-0 text-[32px] leading-none">🏆</span>
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <h3 className="text-[16px] font-semibold leading-snug text-[var(--text-primary)]">{l.name}</h3>
                    <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                      {l.memberCount ?? '—'} managers · {l.season ?? 'Current season'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end justify-center gap-1 pl-2"
                  style={{paddingRight: '1rem'}}>
                    <span className="text-[24px] font-bold leading-none text-[var(--accent)]">
                      #{l.rank ?? '—'}
                    </span>
                    <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Rank</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Tonight's Games */}
          <section className="overflow-hidden rounded-xl bg-[var(--bg-primary)]">
            <div className="flex items-center justify-between px-2 pb-3 pt-1 border-b border-[var(--border)]"
            style={{ marginBottom: '8px'}}>
              <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Tonight's Games</h2>
              <Link
                to="/livePlayerData"
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-[14px] font-medium transition-all hover:bg-[rgba(232,129,58,0.1)]"
                style={{ color: 'var(--accent)' }}
              >
                View all <ChevronRight size={15} />
              </Link>
            </div>
            <div className="flex flex-col gap-3.5 px-0 py-1" 
            style={{paddingRight: '0.5rem'}}>
              {loading && <p className="px-2 py-6 text-[15px] text-[var(--text-secondary)]">Loading games…</p>}
              {!loading && games.length === 0 && (
                <p className="px-2 py-6 text-[15px] text-[var(--text-secondary)]">No games scheduled today.</p>
              )}
              {games.map((g) => {
                const status = getGameStatus(g.gameStatusText);
                return (
                  <div
                    key={g.gameId}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-[rgba(74,84,107,0.38)] bg-[#1a243a] px-6 min-h-[40px] transition-all hover:bg-[#1d2942]"
                  >
                    <div className="flex flex-1 items-center gap-4">
                      <span className="w-12 shrink-0 text-right text-[15px] font-bold text-[var(--text-primary)]">
                        {g.awayTeam.teamTricode}
                      </span>
                      {status === 'LIVE' ? (
                        <span className="min-w-[98px] rounded-xl bg-[rgba(63,185,80,0.14)] px-4 py-1.5 text-center text-[15px] font-bold text-[var(--accent-green)]">
                          {g.awayTeam.score}–{g.homeTeam.score}
                        </span>
                      ) : (
                        <span className="min-w-[32px] text-center text-[13px] text-[var(--text-muted)]">vs</span>
                      )}
                      <span className="w-12 text-[15px] font-bold text-[var(--text-primary)]">
                        {g.homeTeam.teamTricode}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-5"
                    style={{ marginRight: '0.75rem' }}>
                      <span className="hidden text-[13px] text-[var(--text-secondary)] sm:block">
                        {g.gameStatusText}
                      </span>
                      {status === 'LIVE' ? (
                        <span className="flex shrink-0 items-center gap-2 rounded-full border border-[rgba(63,185,80,0.45)] bg-[rgba(63,185,80,0.16)] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--accent-green)]"
                        style={{paddingLeft:'0.25rem', paddingRight:'0.25rem'}}>
                          <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent-green)]" />
                          LIVE
                        </span>
                      ) : status === 'FINAL' ? (
                        <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-primary)]">FINAL</span>
                      ) : (
                        <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)]"
                        style={{paddingLeft:'0.25rem', paddingRight:'0.25rem'}}>
                          {status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;