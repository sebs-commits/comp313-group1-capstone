import { useState, useEffect } from 'react';
import api from '../api';
import { supabase } from '../supabaseClient';

export default function CreateTradeModal({ leagueId, onClose, onTradeCreated }) {
  const [myTeam, setMyTeam] = useState(null);
  const [myPlayers, setMyPlayers] = useState([]);
  const [leagueTeams, setLeagueTeams] = useState([]);
  const [selectedReceivingTeam, setSelectedReceivingTeam] = useState(null);
  const [receivingTeamPlayers, setReceivingTeamPlayers] = useState([]);
  const [offeringPlayers, setOfferingPlayers] = useState([]);
  const [requestingPlayers, setRequestingPlayers] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [daysUntilExpiry, setDaysUntilExpiry] = useState(3);

  useEffect(() => {
    fetchLeagueData();
  }, [leagueId]);

  useEffect(() => {
    if (selectedReceivingTeam) {
      fetchReceivingTeamPlayers();
    }
  }, [selectedReceivingTeam]);

  const fetchLeagueData = async () => {
    try {
      setLoading(true);
      
      // Get teams in this league
      const teamsResponse = await api.get(`/api/fantasy-team/league/${leagueId}/teams`);
      const teams = teamsResponse.data || [];
      setLeagueTeams(teams);

      // Get user's team in this league
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const userTeamsResponse = await api.get(`/api/fantasy-team${userId ? `?userId=${userId}` : ''}`);
      const myTeamInLeague = userTeamsResponse.data.find(t => t.leagueId === leagueId);
      
      if (myTeamInLeague) {
        setMyTeam(myTeamInLeague);

        // Team response already includes roster
        setMyPlayers(myTeamInLeague.roster || []);
      } else {
        setError('You don\'t have a team in this league');
      }

      setError('');
    } catch (err) {
      setError('Failed to load league data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceivingTeamPlayers = async () => {
    try {
      const response = await api.get(`/api/fantasy-team/${selectedReceivingTeam}`);
      setReceivingTeamPlayers(response.data?.roster || []);
    } catch (err) {
      console.error('Failed to load receiving team players:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedReceivingTeam) {
      setError('Please select a receiving team');
      return;
    }

    if (offeringPlayers.length === 0 || requestingPlayers.length === 0) {
      setError('Please select at least one player to offer and one to request');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/api/Trade', {
        receivingTeamId: selectedReceivingTeam,
        itemsOffering: offeringPlayers.map(p => ({ playerId: p })),
        itemsRequesting: requestingPlayers.map(p => ({ playerId: p })),
        notes: notes,
        daysUntilExpiry: daysUntilExpiry
      });

      setError('');
      onTradeCreated();
    } catch (err) {
      const message = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message;
      setError(message || 'Failed to create trade');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-base-100 rounded-lg p-8">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-center">Loading league data...</p>
        </div>
      </div>
    );
  }

  if (!myTeam) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-base-100 rounded-lg p-8 max-w-sm">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button onClick={onClose} className="btn btn-primary w-full">
            Close
          </button>
        </div>
      </div>
    );
  }

  // Filter out own team from receiving team options
  const otherTeams = leagueTeams.filter(t => t.id !== myTeam.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-base-100 border-b border-base-300 p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Propose a Trade</h2>
          <button onClick={onClose} className="btn btn-sm btn-circle">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {/* Receiving Team Selection */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold">Offer Trade To:</span>
            </label>
            <select
              className="select select-bordered"
              value={selectedReceivingTeam || ''}
              onChange={(e) => {
                setSelectedReceivingTeam(parseInt(e.target.value) || null);
                setRequestingPlayers([]);
              }}
            >
              <option value="">Select a team to trade with</option>
              {otherTeams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.teamName}
                </option>
              ))}
            </select>
            <label className="label">
              <span className="label-text-alt text-gray-400">
                Trading from: {myTeam.teamName}
              </span>
            </label>
          </div>

          {/* Players to Offer */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold">Players You're Offering:</span>
            </label>
            <div className="border border-base-300 rounded p-3 max-h-48 overflow-y-auto">
              {myPlayers.length === 0 ? (
                <p className="text-sm text-gray-400">No players on your roster</p>
              ) : (
                <div className="space-y-2">
                  {myPlayers.map(player => (
                    <label key={player.playerId} className="label cursor-pointer justify-start gap-3 hover:bg-base-300 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={offeringPlayers.includes(player.playerId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setOfferingPlayers([...offeringPlayers, player.playerId]);
                          } else {
                            setOfferingPlayers(offeringPlayers.filter(id => id !== player.playerId));
                          }
                        }}
                        className="checkbox checkbox-primary"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{player.fullName}</p>
                        <p className="text-xs text-gray-400">
                          {player.position} · {player.teamAbbreviation}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <label className="label">
              <span className="label-text-alt">
                Selected: {offeringPlayers.length}
              </span>
            </label>
          </div>

          {/* Players to Request */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold">Players You're Requesting:</span>
            </label>
            {!selectedReceivingTeam ? (
              <div className="border border-base-300 rounded p-3 bg-base-300 text-center">
                <p className="text-sm text-gray-400">
                  Select a team first to see available players
                </p>
              </div>
            ) : receivingTeamPlayers.length === 0 ? (
              <div className="border border-base-300 rounded p-3 bg-base-300 text-center">
                <p className="text-sm text-gray-400">
                  This team has no players
                </p>
              </div>
            ) : (
              <div className="border border-base-300 rounded p-3 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {receivingTeamPlayers.map(player => (
                    <label key={player.playerId} className="label cursor-pointer justify-start gap-3 hover:bg-base-300 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={requestingPlayers.includes(player.playerId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRequestingPlayers([...requestingPlayers, player.playerId]);
                          } else {
                            setRequestingPlayers(requestingPlayers.filter(id => id !== player.playerId));
                          }
                        }}
                        className="checkbox checkbox-primary"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{player.fullName}</p>
                        <p className="text-xs text-gray-400">
                          {player.position} · {player.teamAbbreviation}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <label className="label">
              <span className="label-text-alt">
                Selected: {requestingPlayers.length}
              </span>
            </label>
          </div>

          {/* Trade Duration */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold">Days Until Expiry:</span>
            </label>
            <input
              type="number"
              min="1"
              max="14"
              value={daysUntilExpiry}
              onChange={(e) => setDaysUntilExpiry(parseInt(e.target.value))}
              className="input input-bordered"
            />
            <label className="label">
              <span className="label-text-alt text-gray-400">
                Trade expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
              </span>
            </label>
          </div>

          {/* Notes */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-bold">Notes (Optional):</span>
            </label>
            <textarea
              className="textarea textarea-bordered"
              placeholder="Add any notes about this trade..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
            ></textarea>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || offeringPlayers.length === 0 || requestingPlayers.length === 0}
              className="btn btn-primary"
            >
              {submitting ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Proposing...
                </>
              ) : (
                'Propose Trade'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
