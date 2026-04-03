import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [warningMessage, setWarningMessage] = useState({});
  const [banReason, setBanReason] = useState({});
  const [banUntil, setBanUntil] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadUsers = async () => {
    try {
      const res = await api.get('/api/Admin/users');
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load all users!');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const issueWarning = async (userId) => {
    setError('');
    setSuccess('');
    try {
      await api.post('/api/Admin/warn', {
        userId,
        message: warningMessage[userId] || '',
      });
      setSuccess('Warning has been issued successfully!');
      setWarningMessage((prev) => ({ ...prev, [userId]: '' }));
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to issue a warning! Please try again.');
    }
  };

  const tempBan = async (userId) => {
    setError('');
    setSuccess('');
    try {
        const selectedDate = banUntil[userId];
        if (!selectedDate) {
        setError('Please choose a temporary ban date and time!');
        return;
    }
    await api.post('/api/Admin/ban', {
      userId,
      reason: banReason[userId] || '',
      bannedUntil: new Date(selectedDate).toISOString(),
      permanent: false,
    });

    setSuccess('Temporary ban issued successfully.');
    loadUsers();
  } catch (err) {
    setError(err.response?.data?.message ?? 'Failed to ban user! Please try again.');
  }
};

  const permanentBan = async (userId) => {
    setError('');
    setSuccess('');
    try {
      await api.post('/api/Admin/ban', {
        userId,
        reason: banReason[userId] || '',
        bannedUntil: null,
        permanent: true,
      });
      setSuccess('Permanent ban has been issued successfully!');
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to ban user! Please try again.');
    }
  };

  const unban = async (userId) => {
    setError('');
    setSuccess('');
    try {
      await api.post(`/api/Admin/unban/${userId}`);
      setSuccess('User has been unbanned successfully!');
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to unban user! Please try again.');
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Admin User Moderation</h1>
          <p className="text-sm text-base-content/60 mt-1">
            Warn users and issue temporary or permanent bans.
          </p>
        </div>

        {success && <div className="alert alert-success"><span>{success}</span></div>}
        {error && <div className="alert alert-error"><span>{error}</span></div>}

        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Status</th>
                <th>Warning</th>
                <th>Ban Reason</th>
                <th>Temp Ban Until</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{`${user.firstName ?? ''} ${user.lastName ?? ''}`}</td>
                  <td>
                    {user.isPermanentlyBanned
                      ? 'Permanently Banned'
                      : user.bannedUntil
                        ? `Temporarily Banned until ${new Date(user.bannedUntil).toLocaleString()}`
                        : 'Active'}
                  </td>
                  <td>
                    <input
                      className="input input-bordered input-sm w-full"
                      value={warningMessage[user.id] || ''}
                      onChange={(e) =>
                        setWarningMessage((prev) => ({ ...prev, [user.id]: e.target.value }))
                      }
                      placeholder="Warning message"
                    />
                  </td>
                  <td>
                    <input
                      className="input input-bordered input-sm w-full"
                      value={banReason[user.id] || ''}
                      onChange={(e) =>
                        setBanReason((prev) => ({ ...prev, [user.id]: e.target.value }))
                      }
                      placeholder="Ban reason"
                    />
                  </td>
                  <td>
                    <input
                      type="datetime-local"
                      className="input input-bordered input-sm w-full"
                      value={banUntil[user.id] || ''}
                      onChange={(e) =>
                        setBanUntil((prev) => ({ ...prev, [user.id]: e.target.value }))
                      }
                    />
                  </td>
                  <td className="flex flex-col gap-2">
                    <button className="btn btn-warning btn-sm" onClick={() => issueWarning(user.id)}>
                      Warn
                    </button>
                    <button className="btn btn-error btn-sm" onClick={() => tempBan(user.id)}>
                      Temp Ban
                    </button>
                    <button className="btn btn-error btn-sm" onClick={() => permanentBan(user.id)}>
                      Permanent Ban
                    </button>
                    <button className="btn btn-success btn-sm" onClick={() => unban(user.id)}>
                      Unban
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}