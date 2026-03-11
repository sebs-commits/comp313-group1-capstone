import { Link } from 'react-router-dom';
import { ChevronRight, Tv2 } from 'lucide-react';

const getStatus = (text = '') => {
  const t = text.toLowerCase();
  if (t.includes('final'))                                return 'FINAL';
  if (t.includes('halftime') || /\bq[1-4]\b/.test(t))   return 'LIVE';
  if (/\b\d{1,2}:\d{2}\b/.test(t) && !/[ap]m/.test(t)) return 'LIVE';
  return 'UPCOMING';
};

const TonightsGames = ({ loading, games }) => (
  <div className="card bg-base-200 border border-base-300">
    <div className="card-body p-0">

      <div className="flex items-center justify-between px-6 py-4 border-b border-base-300">
        <h2 className="card-title text-base">Tonight's Games</h2>
        <Link to="/livePlayerData" className="flex items-center gap-1 text-xs text-primary hover:underline">
          View all <ChevronRight size={13} />
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner text-primary" />
        </div>
      )}

      {!loading && games.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Tv2 size={26} className="opacity-30" />
          <p className="text-sm text-base-content/60">No games today.</p>
        </div>
      )}

      <ul className="divide-y divide-base-300">
        {games.map((g) => {
          const status = getStatus(g.gameStatusText);
          return (
            <li key={g.gameId} className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3 text-sm font-bold">
                <span>{g.awayTeam.teamTricode}</span>
                {status === 'LIVE' ? (
                  <span className="text-success tabular-nums">
                    {g.awayTeam.score}–{g.homeTeam.score}
                  </span>
                ) : (
                  <span className="text-xs font-normal text-base-content/40">vs</span>
                )}
                <span>{g.homeTeam.teamTricode}</span>
              </div>

              {status === 'LIVE'     && <div className="badge badge-success gap-1"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />LIVE</div>}
              {status === 'FINAL'    && <span className="text-xs text-base-content/40">Final</span>}
              {status === 'UPCOMING' && <span className="text-xs text-base-content/40">{g.gameStatusText}</span>}
            </li>
          );
        })}
      </ul>

    </div>
  </div>
);

export default TonightsGames;
