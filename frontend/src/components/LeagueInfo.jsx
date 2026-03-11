// Theres a few things missing from this component that we can add later. Some of those things being the start, and end date of the league, creator of the league, etc, type of league (public, private), and is it unique drafting.

const LeagueInfo = ({ league, onCopy }) => {
    return (
        <div>
            <h1>{league.name}</h1>
            <p>{league.description}</p>
            <p>
                Status: {league.status} | Members: {league.memberCount}/{league.maxTeams} |
                Roster size: {league.rosterSize} | Scoring: {league.scoringType}
            </p>

            {league.weekStartDate && (
                <p>Week: {league.weekStartDate} to {league.weekEndDate}</p>
            )}

            {league.inviteCode && (
                <p>
                    Invite code: <strong>{league.inviteCode}</strong>{' '}
                    <button onClick={onCopy}>Copy</button>
                </p>
            )}
        </div>
    );
};

export default LeagueInfo;
