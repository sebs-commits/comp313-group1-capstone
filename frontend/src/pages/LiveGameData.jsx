import { useEffect, useState } from 'react';
import { Tv2, ChevronDown, ChevronUp } from 'lucide-react';
import Layout from '../components/Layout';

const getStatus = (text = '') => {
  const t = text.toLowerCase();
  if (t.includes('final')) return 'FINAL';
  if (t.includes('halftime') || /\bq[1-4]\b/.test(t)) return 'LIVE';
  if (/\b\d{1,2}:\d{2}\b/.test(t) && !/[ap]m/.test(t)) return 'LIVE';
  return 'UPCOMING';
};

const LivePlayerData = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedGames, setExpandedGames] = useState(new Set());

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/nba/scoreboard`)
      .then((res) => res.json())
      .then((data) => {
        setGames(data.scoreboard.games);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching data:', err);
        setError('Failed to load scoreboard.');
        setLoading(false);
      });
  }, []);

  const toggleExpand = (gameId) => {
    setExpandedGames((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(gameId)) {
        newSet.delete(gameId);
      } else {
        newSet.add(gameId);
      }
      return newSet;
    });
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">NBA Scoreboard</h1>
          <p className="mt-1 text-sm text-base-content/60">
            Live scores, results, and upcoming games.
          </p>
        </div>

        <div className="card bg-base-200 border border-base-300">
          <div className="card-body p-0">
            {loading && (
              <div className="flex justify-center py-16">
                <span className="loading loading-spinner loading-lg text-primary" />
              </div>
            )}

            {error && (
              <div className="p-6">
                <div role="alert" className="alert alert-error">
                  <span>{error}</span>
                </div>
              </div>
            )}

            {!loading && !error && games.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-16 text-center">
                <Tv2 size={32} className="opacity-30" />
                <p className="text-sm text-base-content/60">No games scheduled today.</p>
              </div>
            )}

            {!loading && games.length > 0 && (
              <ul className="divide-y divide-base-300">
                {games.map((game) => {
                  const status = getStatus(game.gameStatusText);
                  const away = game.awayTeam;
                  const home = game.homeTeam;
                  const showScore = status === 'LIVE' || status === 'FINAL';
                  const isExpanded = expandedGames.has(game.gameId);
                  const hasLeaders = game.gameLeaders?.homeLeaders?.personId > 0;

                  return (
                    <li key={game.gameId} className="px-6 py-4">
                      {/* Main Game Row */}
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                        {/* Away team */}
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold">{away.teamTricode}</span>
                              <span className="text-xs text-base-content/40">
                                {away.record}
                              </span>
                            </div>
                            <span className="hidden sm:inline text-xs text-base-content/50">
                              {away.teamCity} {away.teamName}
                            </span>
                          </div>
                        </div>

                        {/* Score / status */}
                        <div className="flex flex-col items-center gap-1">
                          {showScore ? (
                            <span
                              className={`text-xl font-bold tabular-nums ${
                                status === 'LIVE' ? 'text-success' : 'text-base-content'
                              }`}
                            >
                              {away.score} – {home.score}
                            </span>
                          ) : (
                            <span className="text-sm font-semibold text-base-content/40">
                              {game.gameStatusText}
                            </span>
                          )}
                          {status === 'LIVE' && (
                            <div className="badge badge-success badge-sm gap-1">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                              {game.gameStatusText}
                            </div>
                          )}
                          {status === 'FINAL' && (
                            <span className="text-xs text-base-content/40 uppercase tracking-wide">
                              Final
                            </span>
                          )}
                          {status === 'LIVE' && (
                            <div className="flex flex-col items-center text-xs text-base-content/50 leading-tight">
                              <span>Timeouts</span>
                              <div className="flex items-center gap-2">
                                <span>{away.timeoutsRemaining}</span>
                                <span>•</span>
                                <span>{home.timeoutsRemaining}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Home team */}
                        <div className="flex items-center justify-end gap-3">
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-base-content/40">
                                {home.record}
                              </span>
                              <span className="text-sm font-bold">{home.teamTricode}</span>
                            </div>
                            <span className="hidden sm:inline text-xs text-base-content/50">
                              {home.teamCity} {home.teamName}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Details */}
                      {(showScore || hasLeaders) && (
                        <>
                          <button
                            onClick={() => toggleExpand(game.gameId)}
                            className="mt-3 flex items-center gap-1 text-xs text-base-content/60 hover:text-base-content transition-colors mx-auto"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp size={14} /> Hide Details
                              </>
                            ) : (
                              <>
                                <ChevronDown size={14} /> Show Details
                              </>
                            )}
                          </button>

                          {isExpanded && (
                            <div className="mt-4 space-y-4">
                              {/* Quarter by Quarter */}
                              {showScore && (
                                <div className="bg-base-300/30 rounded-lg p-3">
                                  <div className="text-xs font-semibold text-base-content/60 mb-2">
                                    Quarter by Quarter
                                  </div>
                                  <div className="grid grid-cols-[auto_repeat(4,1fr)_auto] gap-2 text-sm">
                                    <div className="text-xs text-base-content/50"></div>
                                    <div className="text-center text-xs text-base-content/50">Q1</div>
                                    <div className="text-center text-xs text-base-content/50">Q2</div>
                                    <div className="text-center text-xs text-base-content/50">Q3</div>
                                    <div className="text-center text-xs text-base-content/50">Q4</div>
                                    <div className="text-center text-xs text-base-content/50 font-semibold">T</div>
                                    
                                    <div className="text-xs font-semibold">{away.teamTricode}</div>
                                    {away.periods.map((period) => (
                                      <div key={period.period} className="text-center tabular-nums">
                                        {period.score || '-'}
                                      </div>
                                    ))}
                                    <div className="text-center font-bold tabular-nums">{away.score}</div>
                                    
                                    <div className="text-xs font-semibold">{home.teamTricode}</div>
                                    {home.periods.map((period) => (
                                      <div key={period.period} className="text-center tabular-nums">
                                        {period.score || '-'}
                                      </div>
                                    ))}
                                    <div className="text-center font-bold tabular-nums">{home.score}</div>
                                  </div>
                                </div>
                              )}

                              {/* Game Leaders */}
                              {hasLeaders && (
                                <div className="bg-base-300/30 rounded-lg p-3">
                                  <div className="text-xs font-semibold text-base-content/60 mb-2">
                                    Game Leaders
                                  </div>
                                  <div className="space-y-2">
                                    {/* Away Leader */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold">
                                          {game.gameLeaders.awayLeaders.teamTricode}
                                        </span>
                                        <span className="text-sm">
                                          {game.gameLeaders.awayLeaders.name}
                                        </span>
                                        <span className="text-xs text-base-content/50">
                                          #{game.gameLeaders.awayLeaders.jerseyNum}
                                        </span>
                                      </div>
                                      <div className="flex gap-3 text-sm tabular-nums">
                                        <span>{game.gameLeaders.awayLeaders.points} PTS</span>
                                        <span>{game.gameLeaders.awayLeaders.rebounds} REB</span>
                                        <span>{game.gameLeaders.awayLeaders.assists} AST</span>
                                      </div>
                                    </div>
                                    {/* Home Leader */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold">
                                          {game.gameLeaders.homeLeaders.teamTricode}
                                        </span>
                                        <span className="text-sm">
                                          {game.gameLeaders.homeLeaders.name}
                                        </span>
                                        <span className="text-xs text-base-content/50">
                                          #{game.gameLeaders.homeLeaders.jerseyNum}
                                        </span>
                                      </div>
                                      <div className="flex gap-3 text-sm tabular-nums">
                                        <span>{game.gameLeaders.homeLeaders.points} PTS</span>
                                        <span>{game.gameLeaders.homeLeaders.rebounds} REB</span>
                                        <span>{game.gameLeaders.homeLeaders.assists} AST</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LivePlayerData;