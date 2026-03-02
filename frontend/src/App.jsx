import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LivePlayerData from './pages/LivePlayerData';

function LoginPage() {
    return (
        <div style={{ padding: '20px' }}>
            <h1>Welcome</h1>
            <p>Login or Register page goes here</p>
            <Link to="/livePlayerData">View Live NBA Scores</Link>
        </div>
    );
}

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/livePlayerData" element={<LivePlayerData />} />
            </Routes>
        </Router>
    );
}