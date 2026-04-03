import { useEffect, useState } from 'react';
import { Users, Timer, Trophy, Activity } from 'lucide-react';
import Layout from '../components/Layout';

const LivePlayerStats = () => {
    const [games, setGames] = useState([]);
    const [selectedGameId, setSelectedGameId] = useState(null);
    const [boxScore, setBoxScore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(false);

    // 1. Fetch the list of active games first
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/nba/scoreboard`)
            .then((res) => res.json())
            .then((data) => {
                setGames(data.scoreboard.games);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching scoreboard:', err);
                setLoading(false);
            });
    }, []);

    // 2. Fetch detailed Box Score when a game is selected
    const fetchBoxScore = (gameId) => {
        setStatsLoading(true);
        setSelectedGameId(gameId);
        fetch(`${import.meta.env.VITE_API_URL}/api/nba/boxscore/${gameId}`)
            .then((res) => res.json())
            .then((data) => {
                setBoxScore(data.game);
                setStatsLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching box score:', err);
                setStatsLoading(false);
            });
    };

    const PlayerTable = ({ teamName, players }) => (
        <div className="mt-6">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-primary">
                <Users size={18} /> {teamName}
            </h3>
            <div className="overflow-x-auto rounded-lg border border-base-300">
                <table className="table table-zebra w-full bg-base-200">
                    <thead className="bg-base-300">
                        <tr>
                            <th>Player</th>
                            <th>Pos</th>
                            <th>Min</th>
                            <th>PTS</th>
                            <th>AST</th>
                            <th>REB</th>
                            <th>STL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.map((player, idx) => (
                            <tr key={idx} className="hover">
                                <td className="font-medium">{player.name}</td>
                                <td className="text-xs opacity-70">{player.position}</td>
                                <td className="tabular-nums">{player.statistics.minutes}</td>
                                <td className="font-bold tabular-nums">{player.statistics.points}</td>
                                <td className="tabular-nums">{player.statistics.assists}</td>
                                <td className="tabular-nums">{player.statistics.reboundsTotal}</td>
                                <td className="tabular-nums text-secondary font-semibold">
                                    {player.statistics.steals}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <Layout>
            <div className="flex flex-col gap-6">
                <header>
                    <h1 className="text-2xl font-bold tracking-tight">Live Player Performance</h1>
                    <p className="text-sm text-base-content/60">
                        Detailed box scores and advanced stats for active NBA games.
                    </p>
                </header>

                {/* Game Selector Row */}
                <div className="flex flex-wrap gap-3">
                    {loading ? (
                        <span className="loading loading-dots loading-md text-primary"></span>
                    ) : (
                        games.map((game) => (
                            <button
                                key={game.gameId}
                                onClick={() => fetchBoxScore(game.gameId)}
                                className={`btn btn-sm gap-2 ${selectedGameId === game.gameId ? 'btn-primary' : 'btn-outline'
                                    }`}
                            >
                                {game.awayTeam.teamTricode} @ {game.homeTeam.teamTricode}
                                {game.gameStatus === 2 && <span className="badge badge-error badge-xs animate-pulse"></span>}
                            </button>
                        ))
                    )}
                </div>

                {/* Detailed Box Score View */}
                {statsLoading ? (
                    <div className="flex flex-col items-center py-20 gap-4">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                        <p className="text-sm animate-pulse">Fetching latest player totals...</p>
                    </div>
                ) : boxScore ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Header Info: Score & Clock */}
                        <div className="card bg-primary text-primary-content shadow-xl">
                            <div className="card-body py-4 px-6 flex-row justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="text-xs uppercase font-bold opacity-80">Current Match</span>
                                    <div className="text-2xl font-black">
                                        {boxScore.awayTeam.score} – {boxScore.homeTeam.score}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-2 text-lg font-bold">
                                        <Timer size={20} />
                                        {/* Placeholder for Quarter/Clock - you can map these from the Scoreboard list */}
                                        <span>Live Stats</span>
                                    </div>
                                    <span className="text-xs opacity-80">Updated Real-Time</span>
                                </div>
                            </div>
                        </div>

                        {/* Home and Away Tables */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <PlayerTable teamName={boxScore.awayTeam.teamName} players={boxScore.awayTeam.players} />
                            <PlayerTable teamName={boxScore.homeTeam.teamName} players={boxScore.homeTeam.players} />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-base-300 rounded-2xl opacity-40">
                        <Activity size={48} />
                        <p className="mt-4 font-medium">Select a game above to view detailed player stats</p>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default LivePlayerStats;