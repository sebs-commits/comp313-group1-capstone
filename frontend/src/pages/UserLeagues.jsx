import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import api from '../api';

const UserLeagues = () => {
    const navigate = useNavigate();
    const [leagues, setLeagues] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { navigate('/'); return; }

            const res = await api.get(`/api/league/my-leagues?userId=${session.user.id}`);
            setLeagues(res.data);
            setLoading(false);
        }
        load();
    }, [navigate]);

    return (
        <div>
            <h1>My Leagues</h1>
            <Link to="/create-league">Create League</Link> | <Link to="/join-league">Join League</Link>
            <hr />
            {loading && <p>Loading...</p>}
            {!loading && leagues.length === 0 && <p>No leagues found.</p>}
            {leagues.map(l => (
                <div key={l.id}>
                    <p><strong>{l.name}</strong> — {l.memberCount} member(s) — {l.isPublic ? 'Public' : 'Private'}</p>
                    {l.inviteCode && <p>Invite code: <strong>{l.inviteCode}</strong></p>}
                    <Link to={`/userLeagues/${l.id}`}>View</Link>
                    <hr />
                </div>
            ))}
        </div>
    );
};

export default UserLeagues;
