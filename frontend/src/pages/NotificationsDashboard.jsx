import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Layout from '../components/Layout';
import { Bell, Info, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';

const NotificationsPage = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        const fetchNotifications = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { navigate('/'); return; }

            const token = session.access_token;
            const headers = { Authorization: `Bearer ${token}` };

            try {
                const response = await fetch(`http://localhost:5050/api/Notification?userId=${session.user.id}`, { headers });
                if (response.ok) {
                    const data = await response.json();
                    setNotifications(data);
                }
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [navigate]);

    const filteredNotifications = notifications.filter(n =>
        filter === 'ALL' ? true : n.type.toUpperCase() === filter
    );

    return (
        <Layout>
            <div className="flex flex-col gap-6">

                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Alert Center</h1>
                        <p className="mt-1 text-sm text-base-content/60">
                            Stay updated on NBA injuries and league trades.
                        </p>
                    </div>
                    <div className="join bg-base-100 border border-base-content/10">
                        <button
                            className={`join-item btn btn-sm ${filter === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setFilter('ALL')}
                        >All</button>
                        <button
                            className={`join-item btn btn-sm ${filter === 'INJURY' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setFilter('INJURY')}
                        >Injuries</button>
                        <button
                            className={`join-item btn btn-sm ${filter === 'TRADE' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setFilter('TRADE')}
                        >Trades</button>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-sm border border-base-content/10">
                    <div className="card-body p-0">
                        {loading ? (
                            <div className="p-10 text-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="p-20 text-center flex flex-col items-center gap-4">
                                <Bell className="w-12 h-12 text-base-content/20" />
                                <p className="text-base-content/60">No notifications found.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-base-content/5">
                                {filteredNotifications.map((n) => (
                                    <div key={n.id} className={`p-4 flex gap-4 items-start transition-colors hover:bg-base-200/50 ${!n.isRead ? 'bg-primary/5' : ''}`}>

                                        <div className={`mt-1 p-2 rounded-lg ${n.type === 'INJURY' ? 'bg-error/10 text-error' : 'bg-info/10 text-info'
                                            }`}>
                                            {n.type === 'INJURY' ? <AlertTriangle size={18} /> : <Info size={18} />}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <span className={`text-xs font-bold tracking-wider ${n.type === 'INJURY' ? 'text-error' : 'text-info'
                                                    }`}>
                                                    {n.type}
                                                </span>
                                                <span className="text-[10px] text-base-content/40 uppercase">
                                                    {new Date(n.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className={`mt-1 text-sm ${!n.isRead ? 'font-semibold text-base-content' : 'text-base-content/70'}`}>
                                                {n.message}
                                            </p>
                                        </div>

                                        <div className="flex gap-2">
                                            {!n.isRead && (
                                                <button className="btn btn-ghost btn-xs text-success tooltip" data-tip="Mark read">
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}
                                            <button className="btn btn-ghost btn-xs text-base-content/30 hover:text-error">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {filteredNotifications.length > 0 && (
                        <div className="card-footer p-3 bg-base-200/30 text-center border-t border-base-content/5">
                            <button className="btn btn-link btn-xs no-underline text-base-content/40 hover:text-primary">
                                Mark all as read
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default NotificationsPage;