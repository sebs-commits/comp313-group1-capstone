import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleDemoLogin = async () => {
        setError('');
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email: import.meta.env.VITE_DEMO_EMAIL,
            password: import.meta.env.VITE_DEMO_PASSWORD,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        navigate('/dashboard');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        navigate('/dashboard');
    };

    return (
        <div>
            <h1>Welcome</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p>{error}</p>}
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
                <button type="button" onClick={handleDemoLogin} disabled={loading}>
                    Demo
                </button>
            </form>
            <p>Don't have an account? <a href="/register">Register</a></p>
        </div>
    );
}
