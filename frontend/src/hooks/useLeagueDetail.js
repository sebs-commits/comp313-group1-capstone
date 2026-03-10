import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import api from '../api';

const useLeagueDetail = (leagueId) => {
    const navigate = useNavigate();

    const [session, setSession] = useState(null);
    const [league, setLeague] = useState(null);
    const [myTeam, setMyTeam] = useState(null);
    const [score, setScore] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function init() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { navigate('/'); return; }
            setSession(session);
            await fetchAll();
            setLoading(false);
        }
        init();
    }, [leagueId]);

    async function fetchAll() {
        const [leagueRes, leaderboardRes] = await Promise.all([
            api.get(`/api/league/${leagueId}`),
            api.get(`/api/fantasy-team/league/${leagueId}/leaderboard`),
        ]);

        setLeague(leagueRes.data);

        const lb = leaderboardRes.data;
        setLeaderboard(lb);

        const { data: { session } } = await supabase.auth.getSession();
        const myEntry = lb.find(entry => entry.userId === session.user.id);
        if (!myEntry) { setMyTeam(null); setScore(null); return; }

        const [teamRes, scoreRes] = await Promise.all([
            api.get(`/api/fantasy-team/${myEntry.fantasyTeamId}`),
            api.get(`/api/fantasy-team/${myEntry.fantasyTeamId}/score`),
        ]);

        setMyTeam(teamRes.data);
        setScore(scoreRes.data);
    }

    return { session, league, myTeam, score, leaderboard, loading, refresh: fetchAll };
};

export default useLeagueDetail;
