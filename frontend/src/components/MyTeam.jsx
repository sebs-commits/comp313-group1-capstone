import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import RosterTable from './RosterTable';

const MyTeam = ({ team, score, league, session, onTeamChange }) => {
    const [teamName, setTeamName] = useState('');
    const [creating, setCreating] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [draftStatus, setDraftStatus] = useState(null);

    useEffect(() => {
        if (!league?.id) return;
        api.get(`/api/draft/${league.id}`)
            .then(res => setDraftStatus(res.data.status))
            .catch(() => setDraftStatus(null));
    }, [league?.id]);

    const showMessage = (text, error = false) => {
        setMessage(text);
        setIsError(error);
        setTimeout(() => setMessage(''), 3000);
    };

    async function handleCreateTeam(e) {
        e.preventDefault();
        setCreating(true);
        try {
            await api.post('/api/fantasy-team', {
                leagueId: league.id,
                userId: session.user.id,
                teamName,
            });
            showMessage('Team created!');
            setTeamName('');
            onTeamChange();
        } catch (err) {
            showMessage(err.response?.data ?? err.message, true);
        }
        setCreating(false);
    }

    async function handleRemovePlayer(playerId) {
        try {
            await api.delete(`/api/fantasy-team/${team.id}/roster/${playerId}`);
            showMessage('Player removed.');
            onTeamChange();
        } catch (err) {
            showMessage(err.response?.data ?? err.message, true);
        }
    }

    if (!team) {
        return (
            <div className="card bg-base-200 border border-base-300">
                <div className="card-body gap-4">
                    <p className="text-sm text-base-content/60">You don't have a team in this league yet.</p>
                    {message && <div className={`alert ${isError ? 'alert-error' : 'alert-success'} py-2 text-sm`}>{message}</div>}
                    <form onSubmit={handleCreateTeam} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Team name"
                            value={teamName}
                            onChange={e => setTeamName(e.target.value)}
                            className="input input-bordered flex-1"
                            required
                        />
                        <button type="submit" className="btn btn-primary" disabled={creating}>
                            {creating && <span className="loading loading-spinner loading-xs" />}
                            Create Team
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const draftActive = draftStatus === 'active';

    return (
        <div className="flex flex-col gap-4">
            <div className="card bg-base-200 border border-base-300">
                <div className="card-body py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="card-title">{team.teamName}</h2>
                        <div className="flex gap-4 text-sm text-base-content/60">
                            <span>Players: <strong className="text-base-content">{team.roster.length}/{league.rosterSize}</strong></span>
                            <span>Points: <strong className="text-primary">{score?.totalPoints ?? 0}</strong></span>
                        </div>
                    </div>
                </div>
            </div>

            {message && <div className={`alert ${isError ? 'alert-error' : 'alert-success'} py-2 text-sm`}>{message}</div>}

            <RosterTable roster={team.roster} score={score} onRemove={handleRemovePlayer} />

            {draftActive && (
                <div className="card bg-base-200 border border-base-300">
                    <div className="card-body py-4 flex-row items-center justify-between gap-3">
                        <p className="text-sm text-base-content/60">A draft is currently in progress.</p>
                        <Link to={`/userLeagues/${league.id}/draft`} className="btn btn-primary btn-sm">
                            Go to Draft Room
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTeam;
