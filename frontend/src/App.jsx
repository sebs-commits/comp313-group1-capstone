import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LivePlayerData from './pages/LivePlayerData';
import UserLeagues from './pages/UserLeagues';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';


export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/livePlayerData" element={<LivePlayerData />} />
                <Route path="/userLeagues" element={<UserLeagues />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </Router>
    );
}

