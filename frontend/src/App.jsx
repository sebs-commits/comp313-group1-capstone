import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import LiveGameData from './pages/LiveGameData';
import UserLeagues from './pages/UserLeagues';
import LeagueDetail from './pages/LeagueDetail';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import CreateLeague from './pages/CreateLeague';
import ProfilePage from './pages/ProfilePage';
import JoinLeague from './pages/JoinLeague';
import AdminPage from './pages/AdminPage';
import DraftRoom from './pages/DraftRoom';
import NotificationsDashboard from './pages/NotificationsDashboard';
import LivePlayerStats from './pages/LivePlayerStats';
import LeagueChats from './pages/LeagueChats';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import TradesPage from './pages/TradesPage';

function AppRoutes() {
    const navigate = useNavigate();

    useEffect(() => {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        if (accessToken) {
            navigate('/auth/callback');
        }
    }, [navigate]);

    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/callback" element={<ResetPasswordPage />} />
            <Route path="/live-game-stats" element={<LiveGameData />} />
            <Route path="/userLeagues" element={<UserLeagues />} />
            <Route path="/userLeagues/:id" element={<LeagueDetail />} />
            <Route path="/userLeagues/:id/draft" element={<DraftRoom />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create-league" element={<CreateLeague />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/join-league" element={<JoinLeague />} />
            <Route path="/live-player-stats" element={<LivePlayerStats />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/league-chats" element={<LeagueChats />} />
            <Route path="/notifications" element={<NotificationsDashboard />} />
            <Route path="/trades" element={<TradesPage />} />
        </Routes>
    );
}

export default function App() {
    return (
        <Router>
            <AppRoutes />
        </Router>
    );
}


