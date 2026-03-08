import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  ChevronRight,
  Zap,
} from 'lucide-react';
import Layout from '../components/Layout';
import './Dashboard.css';

const getGameStatus = (statusText = '') => {
  const t = statusText.toLowerCase();
  if (t.includes('final'))    return 'FINAL';
  if (t.includes('halftime')) return 'LIVE';
  if (/\bq[1-4]\b/.test(t))  return 'LIVE';
  if (/\b\d{1,2}:\d{2}\b/.test(t) && !/[ap]m/.test(t)) return 'LIVE';
  return 'UPCOMING';
};

const StatCard = ({ label, value, color, sub }) => (
  <div className="stat-card">
    <div className="stat-card__body">
      <span className="stat-card__value">{value}</span>
      <span className="stat-card__label">{label}</span>
    </div>
    {sub && <span className="stat-card__sub">{sub}</span>}
  </div>
);

const QuickAction = ({ to, label, description }) => (
  <Link to={to} className="quick-action">
    <div className="quick-action__text">
      <span className="quick-action__label">{label}</span>
      <span className="quick-action__desc">{description}</span>
    </div>
    <ChevronRight size={16} className="quick-action__arrow" />
  </Link>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [games, setGames]     = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      // Check authentication with Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/');
        return;
      }

      const token = session.access_token;
      const userId = session.user.id;
      const headers = { Authorization: `Bearer ${token}` };

      Promise.all([
        fetch('http://localhost:5050/api/Nba/scoreboard').then(r => r.json()),
        fetch('http://localhost:5050/api/League', { headers }).then(r => {
          if (!r.ok) throw new Error('Unauthorized');
          return r.json();
        }),
        fetch('http://localhost:5050/api/Profile/user', { headers }).then(r => {
          if (!r.ok) throw new Error('Unauthorized');
          return r.json();
        }).catch(() => null),
      ])
        .then(([scoreboardData, leagueData, profileData]) => {
          setGames(scoreboardData?.scoreboard?.games ?? []);
          setLeagues(Array.isArray(leagueData) ? leagueData : []);
          setProfile(profileData);
        })
        .catch(async (err) => {
          console.error('Dashboard fetch error:', err);
          if (err.message === 'Unauthorized') {
            await supabase.auth.signOut();
            navigate('/');
          }
        })
        .finally(() => setLoading(false));
    };

    checkAuthAndFetchData();
  }, [navigate]);

  const liveGames = games.filter(g => getGameStatus(g.gameStatusText) === 'LIVE');

  const stats = [
    {
      label: 'Active Leagues',
      value: loading ? '—' : leagues.length.toString(),
      color: '#f0c040',
      sub: 'Season in progress',
    },
    {
      label: 'Live Games',
      value: loading ? '—' : liveGames.length.toString(),
      color: '#3fb950',
      sub: 'In progress now',
    },
    {
      label: 'Best Rank',
      value: leagues.length > 0
        ? `#${Math.min(...leagues.map(l => l.rank ?? 99))}`
        : '—',
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
      <div className="dashboard">
        {/* ── Header ── */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">
              Dashboard <span className="dash-title__ball"></span>
            </h1>
            <p className="dash-subtitle">
              Welcome back{profile?.username ? `, ${profile.username}` : ''}!
            </p>
          </div>
          <div className="dash-date">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month:   'long',
              day:     'numeric',
            })}
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="stats-grid">
          {stats.map((s, i) => <StatCard key={i} {...s} />)}
        </div>

        {/* ── Middle Row ── */}
        <div className="mid-row">
          
        {/* ── My Leagues Preview ── */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">My Leagues</h2>
            <Link to="/userLeagues" className="section-link">
              View all <ChevronRight size={13} />
            </Link>
          </div>
          <div className="leagues-preview-grid">
            {loading && <p className="loading-text">Loading leagues…</p>}
            {!loading && leagues.length === 0 && (
              <p className="empty-text">You haven't joined any leagues yet.</p>
            )}
            {leagues.map((l, i) => (
              <Link to={`/userLeagues/${l.id}`} key={l.id ?? i} className="league-preview-card">
                <span className="league-preview-card__emoji">🏆</span>
                <div className="league-preview-card__info">
                  <h3>{l.name}</h3>
                  <p>{l.memberCount ?? '—'} managers · {l.season ?? 'Current season'}</p>
                </div>
                <div className="league-preview-card__rank">
                  <span className="rank-num">#{l.rank ?? '—'}</span>
                  <span className="rank-lbl">Rank</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

          {/* Tonight's Games */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2 className="section-title">Tonight's Games</h2>
              <Link to="/livePlayerData" className="section-link">
                View all <ChevronRight size={13} />
              </Link>
            </div>
            <div className="games-list">
              {loading && <p className="loading-text">Loading games…</p>}
              {!loading && games.length === 0 && (
                <p className="empty-text">No games scheduled today.</p>
              )}
              {games.map(g => {
                const status = getGameStatus(g.gameStatusText);
                return (
                  <div key={g.gameId} className="game-row">
                    <div className="game-row__teams">
                      <span className="game-team away">
                        {g.awayTeam.teamTricode}
                      </span>
                      {status === 'LIVE' ? (
                        <span className="game-score">
                          {g.awayTeam.score}–{g.homeTeam.score}
                        </span>
                      ) : (
                        <span className="game-vs">vs</span>
                      )}
                      <span className="game-team home">
                        {g.homeTeam.teamTricode}
                      </span>
                    </div>
                    <div className="game-row__meta">
                      <span className="game-time">{g.gameStatusText}</span>
                      <span className={`game-badge game-badge--${status.toLowerCase()}`}>
                        {status === 'LIVE' && <span className="live-pulse" />}
                        {status}
                      </span>
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
