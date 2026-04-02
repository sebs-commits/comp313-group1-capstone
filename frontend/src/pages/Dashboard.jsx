import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Layout from '../components/Layout';
import StatCards from '../components/dashboard/StatCards';
import MyLeaguesList from '../components/dashboard/MyLeaguesList';
import TonightsGames from '../components/dashboard/TonightsGames';

const getStatus = (text = '') => {
  const t = text.toLowerCase();
  if (t.includes('final'))                              return 'FINAL';
  if (t.includes('halftime') || /\bq[1-4]\b/.test(t)) return 'LIVE';
  if (/\b\d{1,2}:\d{2}\b/.test(t) && !/[ap]m/.test(t)) return 'LIVE';
  return 'UPCOMING';
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [profile, setProfile] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }

      const token = session.access_token;
      const headers = { Authorization: `Bearer ${token}` };

      const [scoreboardData, leagueData, profileData, warningData] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/Nba/scoreboard`)
          .then((r) => r.json())
          .catch(() => null),

        fetch(`${import.meta.env.VITE_API_URL}/api/league/my-leagues?userId=${session.user.id}`, { headers })
          .then((r) => r.ok ? r.json() : [])
          .catch(() => []),

        fetch(`${import.meta.env.VITE_API_URL}/api/Profile/user`, { headers })
          .then((r) => r.ok ? r.json() : null)
          .catch(() => null),

        fetch(`${import.meta.env.VITE_API_URL}/api/Profile/warnings`, { headers })
          .then((r) => r.ok ? r.json() : [])
          .catch(() => []),
      ]);

      if (profileData?.isPermanentlyBanned) {
        await supabase.auth.signOut();
        navigate('/');
        return;
      }

      if (profileData?.bannedUntil && new Date(profileData.bannedUntil) > new Date()) {
        await supabase.auth.signOut();
        navigate('/');
        return;
      }

      setGames(scoreboardData?.scoreboard?.games ?? []);
      setLeagues(Array.isArray(leagueData) ? leagueData : []);
      setProfile(profileData);
      setWarnings(Array.isArray(warningData) ? warningData : []);
      setLoading(false);
    };

    load();
  }, [navigate]);

  const liveGames = games.filter((g) => getStatus(g.gameStatusText) === 'LIVE');

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div>

          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-base-content/60">
            Welcome back{profile?.username ? `, ${profile.username}` : ''}!
          </p>
        </div>

        {profile?.isPermanentlyBanned && (
          <div className="alert alert-error">
            <span>Your account has been permanently banned. Reason: {profile.banReason}</span>
          </div>
        )}

        {profile?.bannedUntil && new Date(profile.bannedUntil) > new Date() && (
          <div className="alert alert-error">
            <span>
              Your account is temporarily banned until {new Date(profile.bannedUntil).toLocaleString()}.
              Reason: {profile.banReason}
            </span>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="card bg-base-200 shadow-sm border border-warning">
            <div className="card-body">
              <h2 className="card-title text-warning">Warnings</h2>
              <div className="flex flex-col gap-3">
                {warnings.map((warning) => (
                  <div key={warning.id} className="alert alert-warning">
                    <span>
                      {warning.message} — {new Date(warning.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <StatCards
          loading={loading}
          leagues={leagues}
          liveGames={liveGames}
          profile={profile}
        />
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <MyLeaguesList loading={loading} leagues={leagues} />
          <TonightsGames loading={loading} games={games} />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;