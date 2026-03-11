const CARDS = (leagues, liveGames, profile, loading) => [
  {
    label: 'Active Leagues',
    value: loading ? '—' : leagues.length,
    desc:  'Leagues you\'re in',
  },
  {
    label: 'Live Games',
    value: loading ? '—' : liveGames.length,
    desc:  liveGames.length > 0 ? 'In progress now' : 'No games live',
  },
  {
    label: 'Best Rank',
    value: loading
      ? '—'
      : leagues.length > 0
        ? `#${Math.min(...leagues.map((l) => l.rank ?? 99))}`
        : '—',
    desc: leagues.length > 0 ? `Across ${leagues.length} league(s)` : 'No leagues yet',
  },
  {
    label: 'Weekly Points',
    value: loading ? '—' : profile?.weeklyPoints ?? '—',
    desc:  'This week',
  },
];

const StatCards = ({ loading, leagues, liveGames, profile }) => (
  <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
    {CARDS(leagues, liveGames, profile, loading).map(({ label, value, desc }) => (
      <div key={label} className="stat bg-base-200 rounded-xl border border-base-300">
        <div className="stat-title">{label}</div>
        <div className="stat-value text-primary">{value}</div>
        <div className="stat-desc">{desc}</div>
      </div>
    ))}
  </div>
);

export default StatCards;
