import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import api from '../api';
import MyLeaguesList from '../components/dashboard/MyLeaguesList';

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
        <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-4">
            <h1 className="text-2xl font-bold">My Leagues</h1>
            <MyLeaguesList loading={loading} leagues={leagues} />
        </div>
    );
};

export default UserLeagues;
