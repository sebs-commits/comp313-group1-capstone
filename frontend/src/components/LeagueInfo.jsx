import { Copy } from 'lucide-react';
import { format, parseISO } from 'date-fns';


const formatLeagueDate = (dateString) => {
  if (!dateString) return '—';
  return format(parseISO(dateString), 'MMM d, yyyy');
};

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-xs text-base-content/50 uppercase tracking-wide">{label}</p>
    <p className="text-sm font-medium mt-0.5">{value}</p>
  </div>
);

const LeagueInfo = ({ league, onCopy, currentUserId }) => {
  const isCreator = league.createdByUserId === currentUserId;
  const creatorLabel = isCreator ? 'You' : league.createdByUserId.slice(0, 8) + '…';

  return (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body gap-4">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold">{league.name}</h1>
            {league.description && (
              <p className="text-sm text-base-content/60 mt-1">{league.description}</p>
            )}
          </div>
          <span className="badge badge-outline">
            {league.isPublic ? 'Public' : 'Private'}
          </span>
        </div>

        <div className="divider my-0" />

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <InfoItem label="Members"      value={`${league.memberCount} / ${league.maxTeams}`} />
          <InfoItem label="Roster Size"  value={league.rosterSize} />
          <InfoItem label="Scoring"      value={league.scoringType} />
          <InfoItem label="Start Date"   value={formatLeagueDate(league.weekStartDate)} />
          <InfoItem label="End Date"     value={formatLeagueDate(league.weekEndDate)} />
          <InfoItem label="Draft Date"   value={formatLeagueDate(league.draftDate?.split('T')[0])} />
          <InfoItem label="Created By"   value={creatorLabel} />
          <InfoItem label="Unique Draft" value={league.uniqueRosters ? 'Yes' : 'No'} />
        </div>

        {/* Invite code */}
        {league.inviteCode && (
          <>
            <div className="divider my-0" />
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs text-base-content/50 uppercase tracking-wide">Invite Code</p>
                <p className="font-mono font-bold text-primary mt-0.5">{league.inviteCode}</p>
              </div>
              <button className="btn btn-ghost btn-sm ml-auto" onClick={onCopy}>
                <Copy size={14} /> Copy
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default LeagueInfo;
