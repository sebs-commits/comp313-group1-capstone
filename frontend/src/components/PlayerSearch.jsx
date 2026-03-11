const PlayerSearch = ({ search, onSearchChange, onSearch, results, onAdd }) => {
    return (
        <div>
            <h3>Add Player</h3>
            <form onSubmit={onSearch}>
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={search}
                    onChange={e => onSearchChange(e.target.value)}
                />
                <button type="submit">Search</button>
            </form>

            {results.length > 0 && (
                <table border="1" cellPadding="4">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Pos</th>
                            <th>Team</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map(player => (
                            <tr key={player.playerId}>
                                <td>{player.fullName}</td>
                                <td>{player.position ?? '—'}</td>
                                <td>{player.teamAbbreviation ?? '—'}</td>
                                <td>
                                    <button onClick={() => onAdd(player.playerId)}>Add</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default PlayerSearch;
