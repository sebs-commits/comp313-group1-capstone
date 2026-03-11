import { useState } from 'react';
import api from '../api';
import RosterTable from './RosterTable';
import PlayerSearch from './PlayerSearch';

const MyTeam = ({ team, score, league, session, onTeamChange }) => {
    const [teamName, setTeamName] = useState('');
    const [creating, setCreating] = useState(false);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [message, setMessage] = useState('');

    async function handleCreateTeam(e) {
        e.preventDefault();
        setCreating(true);
        setMessage('');

        try {
            await api.post('/api/fantasy-team', {
                leagueId: league.id,
                userId: session.user.id,
                teamName,
            });
            setMessage('Team created!');
            setTeamName('');
            onTeamChange();
        } catch (err) {
            setMessage(`Error: ${err.response?.data ?? err.message}`);
        }

        setCreating(false);
    }

    async function handleSearch(e) {
        e.preventDefault();
        setMessage('');

        const res = await api.get(`/api/player/available/${league.id}`, {
            params: { search },
        });
        setSearchResults(res.data);
    }

    async function handleAddPlayer(playerId) {
        setMessage('');

        try {
            await api.post(`/api/fantasy-team/${team.id}/roster`, { playerId });
            setMessage('Player added!');
            setSearchResults(prev => prev.filter(p => p.playerId !== playerId));
            onTeamChange();
        } catch (err) {
            setMessage(`Error: ${err.response?.data ?? err.message}`);
        }
    }

    async function handleRemovePlayer(playerId) {
        setMessage('');

        try {
            await api.delete(`/api/fantasy-team/${team.id}/roster/${playerId}`);
            setMessage('Player removed.');
            onTeamChange();
        } catch (err) {
            setMessage(`Error: ${err.response?.data ?? err.message}`);
        }
    }

    if (!team) {
        return (
            <div>
                <p>You don't have a team yet.</p>
                {message && <p>{message}</p>}
                <form onSubmit={handleCreateTeam}>
                    <input
                        type="text"
                        placeholder="Team name"
                        value={teamName}
                        onChange={e => setTeamName(e.target.value)}
                        required
                    />
                    <button type="submit" disabled={creating}>
                        {creating ? 'Creating...' : 'Create Team'}
                    </button>
                </form>
            </div>
        );
    }

    const rosterFull = team.roster.length >= league.rosterSize;

    return (
        <div>
            <p>
                <strong>{team.teamName}</strong> | Players: {team.roster.length}/{league.rosterSize} | Points: {score?.totalPoints ?? 0}
            </p>

            {message && <p>{message}</p>}

            <h3>Roster</h3>
            {team.roster.length === 0
                ? <p>No players yet. Search below to add some.</p>
                : <RosterTable roster={team.roster} score={score} onRemove={handleRemovePlayer} />
            }

            {!rosterFull && (
                <PlayerSearch
                    search={search}
                    onSearchChange={setSearch}
                    onSearch={handleSearch}
                    results={searchResults}
                    onAdd={handleAddPlayer}
                />
            )}
        </div>
    );
};

export default MyTeam;
