import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useLeagueDetail from '../hooks/useLeagueDetail';
import LeagueInfo from '../components/LeagueInfo';
import MyTeam from '../components/MyTeam';
import Leaderboard from '../components/Leaderboard';

const LeagueDetail = () => {
    const { id } = useParams();
    const { session, league, myTeam, score, leaderboard, loading, refresh } = useLeagueDetail(id);
    const [message, setMessage] = useState('');

    function copyInviteCode() {
        navigator.clipboard.writeText(league.inviteCode);
        setMessage('Invite code copied!');
    }

    if (loading) return <p>Loading...</p>;
    if (!league) return <p>League not found. <Link to="/userLeagues">Back</Link></p>;

    return (
        <div>
            <Link to="/userLeagues">Back to My Leagues</Link>

            {message && <p><strong>{message}</strong></p>}

            <LeagueInfo league={league} onCopy={copyInviteCode} />

            <hr />

            <h2>My Team</h2>
            <MyTeam
                team={myTeam}
                score={score}
                league={league}
                session={session}
                onTeamChange={refresh}
            />

            <hr />

            <h2>Leaderboard</h2>
            <Leaderboard entries={leaderboard} currentUserId={session?.user?.id} />
        </div>
    );
};

export default LeagueDetail;
