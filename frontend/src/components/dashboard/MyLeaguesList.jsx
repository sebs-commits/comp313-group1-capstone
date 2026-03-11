import { Link } from 'react-router-dom';
import { ChevronRight, Trophy } from 'lucide-react';

const MyLeaguesList = ({ loading, leagues }) => (
  <div className="card bg-base-200 border border-base-300">
    <div className="card-body p-0">

      <div className="flex items-center justify-between px-6 py-4 border-b border-base-300">
        <h2 className="card-title text-base">My Leagues</h2>
        <Link to="/userLeagues" className="flex items-center gap-1 text-xs text-primary hover:underline">
          View all <ChevronRight size={13} />
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner text-primary" />
        </div>
      )}

      {!loading && leagues.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Trophy size={26} className="opacity-30" />
          <p className="text-sm text-base-content/60">No leagues yet.</p>
          <Link to="/join-league" className="text-xs text-primary hover:underline">Join one →</Link>
        </div>
      )}

      <ul className="divide-y divide-base-300">
        {leagues.map((l) => (
          <li key={l.id}>
            <Link
              to={`/userLeagues/${l.id}`}
              className="flex items-center gap-4 px-6 py-4 hover:bg-base-300 transition-colors"
            >
              <Trophy size={16} className="shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{l.name}</p>
                <p className="text-xs text-base-content/50">
                  {l.memberCount ?? '—'} members · {l.isPublic ? 'Public' : 'Private'}
                </p>
              </div>
              <span className="text-sm font-bold text-primary">
                {l.rank ? `#${l.rank}` : '—'}
              </span>
            </Link>
          </li>
        ))}
      </ul>

    </div>
  </div>
);

export default MyLeaguesList;
