import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useLeagueDetail from '../hooks/useLeagueDetail';
import Layout from '../components/Layout';
import LeagueInfo from '../components/LeagueInfo';
import MyTeam from '../components/MyTeam';
import Leaderboard from '../components/Leaderboard';

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
