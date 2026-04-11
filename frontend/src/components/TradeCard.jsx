import { useState } from 'react';
import api from '../api';

export default function TradeCard({ trade, onResolved, currentUserTeamId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNotes, setEditNotes] = useState(trade.notes || '');
  const [editDaysUntilExpiry, setEditDaysUntilExpiry] = useState(
    Math.max(1, Math.ceil((new Date(trade.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)))
  );

  const isExpired = new Date() > new Date(trade.expiresAt);
  const daysRemaining = Math.ceil((new Date(trade.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));

  const handleAction = async (action) => {
    setLoading(true);
    setError('');

    try {
      await api.post(`/api/Trade/${trade.id}/${action}`);
      onResolved();
    } catch (err) {
      const status = err.response?.status;
      const message = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message;

      if (status === 404) {
        setError('This trade no longer exists. Refreshing list...');
        await onResolved();
      } else {
        setError(message || `Failed to ${action} trade`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditSave = async () => {
    setLoading(true);
    setError('');

    try {
      await api.patch(`/api/Trade/${trade.id}`, {
        notes: editNotes,
        daysUntilExpiry: editDaysUntilExpiry,
      });

      setShowEditModal(false);
      await onResolved();
    } catch (err) {
      const message = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message;
      setError(message || 'Failed to edit trade');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (trade.status) {
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      case 'accepted':
        return <span className="badge badge-success">Accepted</span>;
      case 'declined':
        return <span className="badge badge-error">Declined</span>;
      case 'canceled':
        return <span className="badge badge-neutral">Canceled</span>;
      case 'expired':
        return <span className="badge badge-ghost">Expired</span>;
      default:
        return <span className="badge">{trade.status}</span>;
    }
  };

  const getItemsByTeam = () => {
    const offering = trade.items.filter(item => item.offeringTeamId === trade.initiatingTeamId);
    const requesting = trade.items.filter(item => item.offeringTeamId === trade.receivingTeamId);
    return { offering, requesting };
  };

  const { offering, requesting } = getItemsByTeam();
  const isSender = currentUserTeamId === trade.initiatingTeamId;
  const isReceiver = currentUserTeamId === trade.receivingTeamId;

  return (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body">
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="card-title text-xl">
              {trade.initiatingTeamName} ↔ {trade.receivingTeamName}
            </h3>
            <p className="text-sm text-gray-400">
              Proposed {new Date(trade.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {getStatusBadge()}
            {trade.status === 'pending' && !isExpired && (
              <div className={`badge ${daysRemaining <= 1 ? 'badge-error' : 'badge-info'}`}>
                {daysRemaining} days left
              </div>
            )}
            {isExpired && trade.status === 'pending' && (
              <div className="badge badge-ghost">Expired</div>
            )}
          </div>
        </div>

        {/* Notes */}
        {trade.notes && (
          <div className="bg-base-300 p-3 rounded mb-4">
            <p className="text-sm"><strong>Notes:</strong> {trade.notes}</p>
          </div>
        )}

        {/* Trade Details */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Offered Players */}
          <div>
            <h4 className="font-bold text-sm text-gray-400 mb-2">
              {trade.initiatingTeamName} offers:
            </h4>
            <div className="space-y-1">
              {offering.map(item => (
                <div key={item.id} className="text-sm p-2 bg-base-100 rounded">
                  <p className="font-semibold">{item.playerName}</p>
                  <p className="text-xs text-gray-400">
                    {item.position} · {item.teamName}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Requested Players */}
          <div>
            <h4 className="font-bold text-sm text-gray-400 mb-2">
              In return receives:
            </h4>
            <div className="space-y-1">
              {requesting.map(item => (
                <div key={item.id} className="text-sm p-2 bg-base-100 rounded">
                  <p className="font-semibold">{item.playerName}</p>
                  <p className="text-xs text-gray-400">
                    {item.position} · {item.teamName}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        {trade.status === 'pending' && !isExpired && isReceiver && (
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => handleAction('decline')}
              disabled={loading}
              className="btn btn-sm btn-outline btn-error"
            >
              Decline
            </button>
            <button
              onClick={() => handleAction('accept')}
              disabled={loading}
              className="btn btn-sm btn-success"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Processing...
                </>
              ) : (
                'Accept'
              )}
            </button>
          </div>
        )}

        {trade.status === 'pending' && !isExpired && isSender && (
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowEditModal(true)}
              disabled={loading}
              className="btn btn-sm btn-outline"
            >
              Edit
            </button>
            <button
              onClick={() => handleAction('cancel')}
              disabled={loading}
              className="btn btn-sm btn-warning"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Cancelling...
                </>
              ) : (
                'Cancel Trade'
              )}
            </button>
          </div>
        )}

        {/* Resolved Info */}
        {trade.status !== 'pending' && trade.resolvedAt && (
          <div className="text-sm text-gray-400">
            {trade.status === 'accepted' ? 'Accepted' : trade.status === 'declined' ? 'Declined' : trade.status === 'canceled' ? 'Canceled' : 'Resolved'} on{' '}
            {new Date(trade.resolvedAt).toLocaleDateString()}
          </div>
        )}

        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-base-100 rounded-lg w-full max-w-md p-6">
              <h3 className="text-xl font-bold mb-4">Edit Trade</h3>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-bold">Days Until Expiry</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={editDaysUntilExpiry}
                  onChange={(e) => setEditDaysUntilExpiry(parseInt(e.target.value || '1', 10))}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text font-bold">Notes</span>
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="textarea textarea-bordered"
                  rows="4"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-outline btn-sm"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  className="btn btn-primary btn-sm"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
