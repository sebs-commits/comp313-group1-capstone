import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Layout from '../components/Layout';
import StatCards from '../components/dashboard/StatCards';
import MyLeaguesList from '../components/dashboard/MyLeaguesList';
import TonightsGames from '../components/dashboard/TonightsGames';

const getStatus = (text = '') => {
  const t = text.toLowerCase();
  if (t.includes('final'))                               return 'FINAL';
  if (t.includes('halftime') || /\bq[1-4]\b/.test(t))  return 'LIVE';
  if (/\b\d{1,2}:\d{2}\b/.test(t) && !/[ap]m/.test(t)) return 'LIVE';
  return 'UPCOMING';
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [games, setGames]     = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/'); return; }

      const token   = session.access_token;
      const headers = { Authorization: `Bearer ${token}` };

      const [scoreboardData, leagueData, profileData] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/Nba/scoreboard`)
          .then((r) => r.json())
          .catch(() => null),

        fetch(`${import.meta.env.VITE_API_URL}/api/league/my-leagues?userId=${session.user.id}`, { headers })
          .then((r) => r.ok ? r.json() : [])
          .catch(() => []),

        fetch(`${import.meta.env.VITE_API_URL}/api/Profile/user`, { headers })
          .then((r) => r.ok ? r.json() : null)
          .catch(() => null),
      ]);

      setGames(scoreboardData?.scoreboard?.games ?? []);
      setLeagues(Array.isArray(leagueData) ? leagueData : []);
      setProfile(profileData);
      setLoading(false);
    };

    load();
  }, [navigate]);

  const liveGames = games.filter((g) => getStatus(g.gameStatusText) === 'LIVE');

  return (
    <Layout>
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-base-content/60">
            Welcome back{profile?.username ? `, ${profile.username}` : ''}!
          </p>
        </div>

        {/* Stat cards */}
        <StatCards
          loading={loading}
          leagues={leagues}
          liveGames={liveGames}
          profile={profile}
        />

        {/* Mid row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <MyLeaguesList loading={loading} leagues={leagues} />
          <TonightsGames loading={loading} games={games} />
        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;
