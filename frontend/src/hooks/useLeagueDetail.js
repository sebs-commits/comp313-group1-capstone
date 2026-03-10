import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const API = 'http://localhost:5050';

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
            await fetchAll(session);
            setLoading(false);
        }
        init();
    }, [leagueId]);

    async function fetchAll(s) {
        const headers = { Authorization: `Bearer ${s.access_token}` };

        const [leagueRes, leaderboardRes] = await Promise.all([
            fetch(`${API}/api/league/${leagueId}`, { headers }),
            fetch(`${API}/api/fantasy-team/league/${leagueId}/leaderboard`, { headers }),
        ]);

        if (leagueRes.ok) setLeague(await leagueRes.json());

        if (!leaderboardRes.ok) return;

        const lb = await leaderboardRes.json();
        setLeaderboard(lb);

        const myEntry = lb.find(entry => entry.userId === s.user.id);
        if (!myEntry) { setMyTeam(null); setScore(null); return; }

        const [teamRes, scoreRes] = await Promise.all([
            fetch(`${API}/api/fantasy-team/${myEntry.fantasyTeamId}`, { headers }),
            fetch(`${API}/api/fantasy-team/${myEntry.fantasyTeamId}/score`, { headers }),
        ]);

        if (teamRes.ok) setMyTeam(await teamRes.json());
        if (scoreRes.ok) setScore(await scoreRes.json());
    }

    const refresh = () => { if (session) fetchAll(session); };

    return { session, league, myTeam, score, leaderboard, loading, refresh };
};

export default useLeagueDetail;
