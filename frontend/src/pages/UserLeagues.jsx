import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const UserLeagues = () => {
    const [leagues, setLeagues] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5050/api/nba/leagues')
            .then(res => res.json())
            .then(data => setLeagues(data))
            .catch(err => console.error("Error fetching leagues:", err));
    }, []);

    return (
        <div style={{ padding: '20px' }}>
            <h1>My NBA Leagues</h1>
            <Link to="/">Back to Login</Link>
            <hr />
            {leagues.length === 0 ? <p>No leagues found.</p> : (
                leagues.map(league => (
                    <div key={league.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
                        <p><strong>{league.name}</strong></p>
                        <p>{league.description}</p>
                    </div>
                ))
            )}
        </div>
    );
};

export default UserLeagues;