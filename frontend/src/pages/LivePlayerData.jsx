import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const LivePlayerData = () => {
    const [games, setGames] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5050/api/nba/scoreboard')
            .then(res => res.json())
            .then(data => setGames(data.scoreboard.games))
            .catch(err => console.error("Error fetching data:", err));
    }, []);

    return (
        <div style={{ padding: '20px' }}>
            <h1>Live NBA Data</h1>
            <Link to="/">Back to Login</Link>
            <hr />
            {games.length === 0 ? <p>Loading games...</p> : (
                games.map(game => (
                    <div key={game.gameId} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
                        <p><strong>{game.awayTeam.teamName}</strong> @ <strong>{game.homeTeam.teamName}</strong></p>
                        <p>Status: {game.gameStatusText}</p>
                    </div>
                ))
            )}
        </div>
    );
};

export default LivePlayerData;