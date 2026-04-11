import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import { supabase } from '../supabaseClient';
import api from '../api';
import Layout from '../components/Layout';
import PlayerSearch from '../components/PlayerSearch';

const DraftRoom = () => {
    const { id: leagueId } = useParams();
    const [session, setSession] = useState(null);
    const [league, setLeague] = useState(null);
    const [draftState, setDraftState] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const connectionRef = useRef(null);

    const showMessage = (text, error = false) => {
        setMessage(text);
        setIsError(error);
        setTimeout(() => setMessage(''), 3500);
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                const [leagueRes, draftRes] = await Promise.allSettled([
                    api.get(`/api/league/${leagueId}`),
                    api.get(`/api/draft/${leagueId}`)
                ]);
                if (leagueRes.status === 'fulfilled') setLeague(leagueRes.value.data);
                if (draftRes.status === 'fulfilled') setDraftState(draftRes.value.data);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [leagueId]);

    useEffect(() => {
        const connect = async () => {
            const { data: { session: s } } = await supabase.auth.getSession();

            const connection = new signalR.HubConnectionBuilder()
                .withUrl(`${import.meta.env.VITE_API_URL}/hubs/draft`, {
                    accessTokenFactory: () => s?.access_token ?? ''
                })
                .withAutomaticReconnect()
                .build();

            connection.on('DraftStateUpdated', (state) => {
                setDraftState(state);
            });

            connection.onreconnected(async () => {
                await connection.invoke('JoinDraft', String(leagueId));
                const res = await api.get(`/api/draft/${leagueId}`).catch(() => null);
                if (res) setDraftState(res.data);
            });

            await connection.start();
            await connection.invoke('JoinDraft', String(leagueId));
            connectionRef.current = connection;
        };

        connect().catch(console.error);

        return () => {
            connectionRef.current?.invoke('LeaveDraft', String(leagueId)).catch(() => {});
            connectionRef.current?.stop();
        };
    }, [leagueId]);

    const handleInitialize = async () => {
        try {
            const res = await api.post(`/api/draft/${leagueId}/initialize`);
            setDraftState(res.data);
        } catch (err) {
            showMessage(err.response?.data ?? err.message, true);
        }
    };

    const handleStart = async () => {
        try {
            const res = await api.post(`/api/draft/${leagueId}/start`);
            setDraftState(res.data);
        } catch (err) {
            showMessage(err.response?.data ?? err.message, true);
        }
    };

    const handlePick = async (playerId) => {
        try {
            await api.post(`/api/draft/${leagueId}/pick`, { playerId });
        } catch (err) {
            showMessage(err.response?.data ?? err.message, true);
        }
    };

    if (loading) return (
        <Layout>
            <div className="flex justify-center py-20">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        </Layout>
    );

    const currentUserId = session?.user?.id;
    const isCommissioner = league?.createdByUserId === currentUserId;
    const isMyTurn = draftState?.currentTeam?.userId === currentUserId;
    const isDraftActive = draftState?.status === 'active';
    const isDraftCompleted = draftState?.status === 'completed';

    const teamCount = draftState?.draftOrder?.length ?? 0;
    const rosterSize = draftState ? draftState.totalPicks / Math.max(teamCount, 1) : 0;

    const getPickerForSlot = (round, posInRound) => {
        if (!draftState?.draftOrder?.length) return null;
        const n = draftState.draftOrder.length;
        const index = round % 2 === 0 ? posInRound : n - 1 - posInRound;
        return draftState.draftOrder[index];
    };

    return (
        <Layout>
            <div className="flex flex-col gap-6">

                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <h1 className="text-2xl font-bold">Draft Room</h1>
                        {league && <p className="text-sm text-base-content/60">{league.name}</p>}
                    </div>
                    <Link to={`/userLeagues/${leagueId}`} className="btn btn-ghost btn-sm">
                        ← Back to League
                    </Link>
                </div>

                {message && (
                    <div className={`alert ${isError ? 'alert-error' : 'alert-success'} py-2 text-sm`}>
                        {message}
                    </div>
                )}

                {!draftState && isCommissioner && (
                    <div className="card bg-base-200 border border-base-300">
                        <div className="card-body gap-3">
                            <p className="text-sm text-base-content/60">
                                No draft has been initialized yet. Initialize to randomize the pick order.
                            </p>
                            <button className="btn btn-primary w-fit" onClick={handleInitialize}>
                                Initialize Draft
                            </button>
                        </div>
                    </div>
                )}

                {!draftState && !isCommissioner && (
                    <div className="card bg-base-200 border border-base-300">
                        <div className="card-body">
                            <p className="text-base-content/60">Waiting for the commissioner to initialize the draft.</p>
                        </div>
                    </div>
                )}

                {draftState && (
                    <div className="flex flex-col gap-6">

                        <div className="card bg-base-200 border border-base-300">
                            <div className="card-body gap-4">
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`badge badge-lg ${
                                            isDraftCompleted ? 'badge-success' :
                                            isDraftActive ? 'badge-primary' : 'badge-ghost'
                                        }`}>
                                            {draftState.status.charAt(0).toUpperCase() + draftState.status.slice(1)}
                                        </span>
                                        {isDraftActive && (
                                            <span className="text-sm text-base-content/60">
                                                Round {draftState.currentRound} · Pick {draftState.currentPick + 1} of {draftState.totalPicks}
                                            </span>
                                        )}
                                        {isDraftCompleted && (
                                            <span className="text-sm text-success font-medium">Draft complete!</span>
                                        )}
                                    </div>

                                    {draftState.status === 'pending' && isCommissioner && (
                                        <div className="flex gap-2">
                                            <button className="btn btn-ghost btn-sm" onClick={handleInitialize}>
                                                Re-randomize
                                            </button>
                                            <button className="btn btn-primary btn-sm" onClick={handleStart}>
                                                Start Draft
                                            </button>
                                        </div>
                                    )}
                                    {draftState.status === 'pending' && !isCommissioner && (
                                        <span className="text-sm text-base-content/60">
                                            Waiting for the commissioner to start the draft…
                                        </span>
                                    )}
                                </div>

                                {isDraftActive && draftState.currentTeam && (
                                    <div className={`rounded-lg p-3 text-sm font-medium ${
                                        isMyTurn
                                            ? 'bg-primary/20 text-primary border border-primary/40'
                                            : 'bg-base-300'
                                    }`}>
                                        {isMyTurn
                                            ? 'It\'s your turn to pick!'
                                            : `Waiting for ${draftState.currentTeam.teamName} to pick…`
                                        }
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            <div className="lg:col-span-1 flex flex-col gap-4">
                                <div className="card bg-base-200 border border-base-300">
                                    <div className="card-body gap-3">
                                        <h2 className="font-semibold text-sm uppercase tracking-wide text-base-content/60">
                                            Draft Order (Snake)
                                        </h2>
                                        <div className="flex flex-col gap-1">
                                            {draftState.draftOrder.map((team) => (
                                                <div
                                                    key={team.teamId}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                                                        isDraftActive && draftState.currentTeam?.teamId === team.teamId
                                                            ? 'bg-primary text-primary-content font-semibold'
                                                            : 'bg-base-100'
                                                    }`}
                                                >
                                                    <span className="text-xs opacity-60 w-4">{team.pickPosition}</span>
                                                    <span>{team.teamName}</span>
                                                    {team.userId === currentUserId && (
                                                        <span className="badge badge-xs badge-outline ml-auto">You</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {Array.from({ length: rosterSize }, (_, roundIdx) => (
                                    <div key={roundIdx} className="card bg-base-100 border border-base-300">
                                        <div className="card-body py-3 gap-2">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                                                Round {roundIdx + 1}
                                            </p>
                                            <div className="flex flex-col gap-0.5">
                                                {Array.from({ length: teamCount }, (_, pos) => {
                                                    const team = getPickerForSlot(roundIdx, pos);
                                                    const overallPickNum = roundIdx * teamCount + pos + 1;
                                                    const pick = draftState.picks.find(p => p.pickNumber === overallPickNum);
                                                    return (
                                                        <div key={pos} className="flex items-center gap-2 text-xs py-0.5">
                                                            <span className="text-base-content/40 w-5">{overallPickNum}.</span>
                                                            <span className="text-base-content/60 w-20 truncate">{team?.teamName}</span>
                                                            {pick ? (
                                                                <span className="font-medium truncate">{pick.playerName}</span>
                                                            ) : (
                                                                <span className="text-base-content/30">—</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="lg:col-span-2 flex flex-col gap-4">
                                {isDraftActive && isMyTurn && (
                                    <PlayerSearch leagueId={Number(leagueId)} onAdd={handlePick} />
                                )}

                                {isDraftActive && !isMyTurn && (
                                    <div className="card bg-base-200 border border-base-300">
                                        <div className="card-body items-center py-10">
                                            <span className="loading loading-dots loading-md text-primary" />
                                            <p className="text-sm text-base-content/60 mt-2">
                                                Waiting for {draftState.currentTeam?.teamName} to pick…
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {isDraftCompleted && (
                                    <div className="card bg-base-200 border border-base-300">
                                        <div className="card-body">
                                            <h2 className="font-semibold">Pick History</h2>
                                            <div className="overflow-x-auto">
                                                <table className="table table-zebra table-sm">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Rd</th>
                                                            <th>Team</th>
                                                            <th>Player</th>
                                                            <th>Pos</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {draftState.picks.map(p => (
                                                            <tr key={p.pickNumber}>
                                                                <td>{p.pickNumber}</td>
                                                                <td>{p.round}</td>
                                                                <td>{p.teamName}</td>
                                                                <td>{p.playerName}</td>
                                                                <td>{p.playerPosition ?? '—'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {isDraftActive && draftState.picks.length > 0 && (
                                    <div className="card bg-base-100 border border-base-300">
                                        <div className="card-body">
                                            <h2 className="font-semibold text-sm">Recent Picks</h2>
                                            <div className="flex flex-col gap-1">
                                                {[...draftState.picks].reverse().slice(0, 10).map(p => (
                                                    <div key={p.pickNumber} className="flex items-center gap-3 text-sm py-1">
                                                        <span className="text-base-content/40 text-xs w-6">{p.pickNumber}.</span>
                                                        <span className="text-base-content/60 w-28 truncate">{p.teamName}</span>
                                                        <span className="font-medium truncate">{p.playerName}</span>
                                                        <span className="text-xs text-base-content/40 ml-auto">{p.playerPosition}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default DraftRoom;
