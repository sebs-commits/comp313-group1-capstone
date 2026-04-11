import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import api from '../api';
import Layout from '../components/Layout';
import CreateTradeModal from '../components/CreateTradeModal';
import TradeCard from '../components/TradeCard';

export default function TradesPage() {
  const navigate = useNavigate();
  const [userLeagues, setUserLeagues] = useState([]);
  const [leagueTeams, setLeagueTeams] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, accepted, declined
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);

  useEffect(() => {
    async function initPage() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }
      setSession(session);
      fetchUserLeagues(session.user.id);
    }
    initPage();
  }, [navigate]);

  useEffect(() => {
    if (selectedLeague) {
      fetchLeagueTeams();
      fetchTrades();
    }
  }, [selectedLeague, filter]);

  const fetchUserLeagues = async (userId) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/league/my-leagues?userId=${userId}`);
      setUserLeagues(response.data);
      
      // Auto-select first league if available
      if (response.data.length > 0) {
        setSelectedLeague(response.data[0].id);
      }
      setError('');
    } catch (err) {
      setError('Failed to load leagues');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeagueTeams = async () => {
    if (!selectedLeague) return;
    
    try {
      setTeamsLoading(true);
      const response = await api.get(`/api/fantasy-team/league/${selectedLeague}/teams`);
      setLeagueTeams(response.data || []);
    } catch (err) {
      console.error('Failed to load league teams:', err);
      setLeagueTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  };

  const fetchTrades = async () => {
    if (!selectedLeague) return;
    
    try {
      setLoading(true);
      let url = `/api/Trade?status=${filter === 'all' ? '' : filter}`.replace(/\?status=$/, '');
      const response = await api.get(url);
      
      // Filter trades for the selected league
      const leagueTrades = response.data.filter(t => t.leagueId === selectedLeague);
      setTrades(leagueTrades);
      setError('');
    } catch (err) {
      const status = err.response?.status;
      const message = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message;
      setError(status === 404 ? 'Trades endpoint not found (404).' : (message || 'Failed to load trades'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTradeCreated = async () => {
    setShowCreateModal(false);
    await fetchTrades();
  };

  const handleTradeResolved = async () => {
    await fetchTrades();
  };

  const getPendingCount = () => trades.filter(t => t.status === 'pending').length;
  const currentUserTeamId = session?.user?.id
    ? (leagueTeams.find(t => (t.userId || '').toLowerCase() === session.user.id.toLowerCase())?.id ?? null)
    : null;

  if (loading && !selectedLeague) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </Layout>
    );
  }

  if (userLeagues.length === 0) {
    return (
      <Layout>
        <div className="max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Player Trades</h1>
          <div className="card bg-base-200">
            <div className="card-body text-center">
              <p className="text-gray-400">You haven't joined any leagues yet.</p>
              <a href="/join-league" className="btn btn-primary mt-4 w-fit">
                Join a League
              </a>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl">
        <h1 className="text-4xl font-bold mb-8">Player Trades</h1>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {/* League Selector */}
        <div className="card bg-base-200 mb-6">
          <div className="card-body">
            <h2 className="card-title text-lg">Select League</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {userLeagues.map(league => (
                <button
                  key={league.id}
                  onClick={() => setSelectedLeague(league.id)}
                  className={`btn btn-outline justify-start text-left h-auto py-3 ${
                    selectedLeague === league.id ? 'btn-primary' : ''
                  }`}
                >
                  <div>
                    <p className="font-bold">{league.name || league.leagueName}</p>
                    <p className="text-xs opacity-75">{league.memberCount || 0} members</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* League Teams */}
        {selectedLeague && (
          <div className="card bg-base-200 mb-6">
            <div className="card-body">
              <h2 className="card-title text-lg">Teams in {selectedLeague && (userLeagues.find(l => l.id === selectedLeague)?.name || userLeagues.find(l => l.id === selectedLeague)?.leagueName)}</h2>
              {teamsLoading ? (
                <div className="flex justify-center">
                  <span className="loading loading-spinner"></span>
                </div>
              ) : leagueTeams.length === 0 ? (
                <p className="text-gray-400">No teams found in this league.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {leagueTeams.map(team => (
                    <div key={team.id} className="bg-base-300 p-3 rounded">
                      <p className="font-bold">{team.teamName}</p>
                      <p className="text-sm text-gray-400">
                        Manager: {team.managerName || 'Unknown'}
                      </p>
                      {team.rosterCount !== undefined && team.rosterCount !== null && (
                        <p className="text-sm text-gray-400">
                          Players: {team.rosterCount}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Trades Section */}
        {selectedLeague && (
          <>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Trades</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                + Propose Trade
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="tabs tabs-lifted mb-6">
              {['all', 'pending', 'accepted', 'declined'].map(status => (
                <button
                  key={status}
                  className={`tab ${filter === status ? 'tab-active' : ''}`}
                  onClick={() => setFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  {status === 'pending' && getPendingCount() > 0 && (
                    <span className="badge badge-warning ml-2">{getPendingCount()}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Trades List */}
            {loading ? (
              <div className="flex justify-center">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : trades.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No trades found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {trades.map(trade => (
                  <TradeCard
                    key={trade.id}
                    trade={trade}
                    onResolved={handleTradeResolved}
                    currentUserTeamId={currentUserTeamId}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Trade Modal */}
      {showCreateModal && selectedLeague && (
        <CreateTradeModal
          leagueId={selectedLeague}
          onClose={() => setShowCreateModal(false)}
          onTradeCreated={handleTradeCreated}
        />
      )}
    </Layout>
  );
}
