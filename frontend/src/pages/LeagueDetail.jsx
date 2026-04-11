import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRightLeft } from 'lucide-react';
import useLeagueDetail from '../hooks/useLeagueDetail';
import Layout from '../components/Layout';
import LeagueInfo from '../components/LeagueInfo';
import MyTeam from '../components/MyTeam';
import Leaderboard from '../components/Leaderboard';
import { Users } from 'lucide-react';

const LeagueDetail = () => {
    const { id } = useParams();
    const { session, league, myTeam, score, leaderboard, loading, refresh } = useLeagueDetail(id);
    const [message, setMessage] = useState('');

    const copyInviteCode = () => {
        navigator.clipboard.writeText(league.inviteCode);
        setMessage('Invite code copied!');
        setTimeout(() => setMessage(''), 2500);
    };

    if (loading) return (
        <Layout>
            <div className="flex justify-center py-20">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        </Layout>
    );


    return (
        <Layout>
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">{league.name}</h1>
                    </div>
                    <Link
                        to="/trades"
                        className="btn btn-primary gap-2"
                    >
                        <ArrowRightLeft size={18} />
                        Manage Trades
                    </Link>
                </div>

                <div className="flex justify-end">
                    <Link to={`/userLeagues/${id}/draft`} className="btn btn-primary btn-sm gap-2">
                        <Users size={14} /> Draft Room
                    </Link>
                </div>

                <LeagueInfo
                    league={league}
                    onCopy={copyInviteCode}
                    currentUserId={session?.user?.id}
                />

                <MyTeam
                    team={myTeam}
                    score={score}
                    league={league}
                    session={session}
                    onTeamChange={refresh}
                />

                <Leaderboard entries={leaderboard} currentUserId={session?.user?.id} />

            </div>
        </Layout>
    );
};

export default LeagueDetail;
