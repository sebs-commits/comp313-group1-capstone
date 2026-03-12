import { useState, useEffect } from 'react';
import api from '../api';

const PlayerSearch = ({ leagueId, onAdd }) => {
    const [teams, setTeams] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        api.get(`/api/player/teams/${leagueId}`)
            .then(res => setTeams(res.data))
            .catch(() => setTeams([]));
    }, [leagueId]);

    async function handleTeamChange(e) {
        const teamId = e.target.value;
        setSelectedTeamId(teamId);
        setPlayers([]);

        if (!teamId) return;

        const res = await api.get(`/api/player/available/${leagueId}`, { params: { teamId } });
        setPlayers(res.data);
    }

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h3 className="card-title">Add Player</h3>

                <select
                    className="select select-bordered w-full"
                    value={selectedTeamId}
                    onChange={handleTeamChange}
                >
                    <option value="">Select a team...</option>
                    {teams.map(t => (
                        <option key={t.teamId} value={t.teamId}>
                            {t.fullName} ({t.abbreviation})
                        </option>
                    ))}
                </select>

                {players.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="table table-zebra">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Pos</th>
                                    <th>#</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {players.map(player => (
                                    <tr key={player.playerId}>
                                        <td>{player.fullName}</td>
                                        <td>{player.position ?? '—'}</td>
                                        <td>{player.jerseyNumber ?? '—'}</td>
                                        <td>
                                            <button
                                                onClick={async () => {
                                                    await onAdd(player.playerId);
                                                    setPlayers(prev => prev.filter(p => p.playerId !== player.playerId));
                                                }}
                                                className="btn btn-sm btn-outline"
                                            >
                                                Add
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {selectedTeamId && players.length === 0 && (
                    <p className="text-sm text-base-content/60">No available players for this team.</p>
                )}
            </div>
        </div>
    );
};

export default PlayerSearch;
