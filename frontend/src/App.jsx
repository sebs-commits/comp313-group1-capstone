import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LivePlayerData from './pages/LivePlayerData';
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


export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/livePlayerData" element={<LivePlayerData />} />
                <Route path="/userLeagues" element={<UserLeagues />} />
                <Route path="/userLeagues/:id" element={<LeagueDetail />} />
                <Route path="/userLeagues/:id/draft" element={<DraftRoom />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/create-league" element={<CreateLeague />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/join-league" element={<JoinLeague />} />
                <Route path="/admin" element={<AdminPage />} />
            </Routes>
        </Router>
    );
}


