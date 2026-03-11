import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Layout from '../components/Layout';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', firstName: '', lastName: '' });
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [profileExists, setProfileExists] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          navigate('/');
          return;
        }

        setEmail(session.user.email ?? '');

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Profile/user`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (res.status === 404) {
          setProfileExists(false);
          return;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.message ?? 'Failed to load profile.');
          return;
        }

        const data = await res.json();

        setForm({
          username: data.username ?? '',
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
        });

        setProfileExists(true);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Something went wrong while loading your profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/');
        return;
      }

      const method = profileExists ? 'PUT' : 'POST';

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Profile`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setProfileExists(true);
        setSuccess(true);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'Failed to save changes.');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Something went wrong while saving your profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <Layout>
      <div className="flex flex-col gap-7 max-w-2xl">
        <div className="flex items-center justify-between rounded-xl bg-[var(--bg-primary)] px-8 py-6">
          <div style={{ paddingLeft: '1rem' }}>
            <h1 className="text-[28px] font-bold tracking-tight text-[var(--text-primary)]">My Profile</h1>
            <p className="mt-1 text-[15px] text-[var(--text-secondary)]">Manage your account details</p>
          </div>
        </div>

        <div
          className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] overflow-hidden"
          style={{ marginLeft: '14px' }}
        >
          <div className="border-b border-[var(--border)] px-8 py-5">
            <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Account Information</h2>
          </div>

          {loading ? (
            <div className="px-8 py-10 text-[var(--text-secondary)]">Loading...</div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-8 py-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[var(--text-secondary)]">Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-[14px] text-[var(--text-muted)] opacity-60 cursor-not-allowed"
                />
                <p className="text-[12px] text-[var(--text-muted)]">
                  Email is managed by your account and cannot be changed here.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[var(--text-secondary)]">Username</label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex flex-1 flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[var(--text-secondary)]">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[var(--text-secondary)]">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
              </div>

              {success && (
                <div className="rounded-lg border border-[rgba(63,185,80,0.4)] bg-[rgba(63,185,80,0.1)] px-4 py-3 text-[14px] text-[var(--accent-green)]">
                  Profile saved successfully.
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-[rgba(200,60,60,0.4)] bg-[rgba(200,60,60,0.1)] px-4 py-3 text-[14px] text-red-400">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-[14px] font-medium text-[var(--text-secondary)] transition-colors hover:border-red-500 hover:text-red-400"
                >
                  Log Out
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg px-6 py-2.5 text-[14px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'var(--accent)' }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;