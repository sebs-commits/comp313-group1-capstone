const RosterTable = ({ roster, score, onRemove }) => {
    return (
        <table border="1" cellPadding="4">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Pos</th>
                    <th>Team</th>
                    <th>Fantasy Pts</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {roster.map(player => {
                    const playerScore = score?.playerScores?.find(s => s.playerId === player.playerId);
                    return (
                        <tr key={player.playerId}>
                            <td>{player.fullName}</td>
                            <td>{player.position ?? '—'}</td>
                            <td>{player.teamAbbreviation ?? '—'}</td>
                            <td>{playerScore?.fantasyPoints ?? 0}</td>
                            <td>
                                <button onClick={() => onRemove(player.playerId)}>Remove</button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export default RosterTable;
