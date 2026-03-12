// This is being used in LeagueDetail.jsx

const Leaderboard = ({ entries, currentUserId }) => {
    if (entries.length === 0) return <p className="text-center">No teams yet.</p>;

    return (
        <div className="card bg-base-200 border border-base-300">
            <div className="card-body p-0">
                <div className="px-6 py-4 border-b border-base-300">
                    <h2 className="card-title text-base">Leaderboard</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="table table-zebra">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Team</th>
                                <th>Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(entry => {
                                const isMe = entry.userId === currentUserId;
                                return (
                                    <tr key={entry.fantasyTeamId}>
                                        <td>#{entry.rank}</td>
                                        <td>{entry.teamName}{isMe ? ' (you)' : ''}</td>
                                        <td>{entry.totalPoints}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
