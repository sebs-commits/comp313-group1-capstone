const RosterTable = ({ roster, score, onRemove }) => {
    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <div className="overflow-x-auto">
                    <table className="table table-zebra">
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
                                            <button onClick={() => onRemove(player.playerId)} className="btn btn-sm btn-outline">Remove</button>
                                        </td>
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

export default RosterTable;
