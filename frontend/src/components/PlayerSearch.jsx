const PlayerSearch = ({ search, onSearchChange, onSearch, results, onAdd }) => {
    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h3 className="card-title">Add Player</h3>
                <form onSubmit={onSearch} className="form-control">
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={search}
                            onChange={e => onSearchChange(e.target.value)}
                            className="input input-bordered"
                        />
                        <button type="submit" className="btn btn-primary m-2">Search</button>
                    </div>
                </form>

                {results.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="table table-zebra">
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
                                            <button onClick={() => onAdd(player.playerId)} className="btn btn-sm btn-outline">Add</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayerSearch;
