const Leaderboard = ({ entries, currentUserId }) => {
    if (entries.length === 0) return <p>No teams yet.</p>;

    return (
        <table border="1" cellPadding="4">
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
    );
};

export default Leaderboard;
