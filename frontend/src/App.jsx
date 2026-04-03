import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import LivePlayerStats from './pages/LivePlayerStats';


export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/live-game-stats" element={<LiveGameData />} />
                <Route path="/userLeagues" element={<UserLeagues />} />
                <Route path="/userLeagues/:id" element={<LeagueDetail />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/create-league" element={<CreateLeague />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/join-league" element={<JoinLeague />} />
                <Route path="/live-player-stats" element={<LivePlayerStats />} />
                <Route path="/admin" element={<AdminPage />} />
            </Routes>
        </Router>
    );
}


