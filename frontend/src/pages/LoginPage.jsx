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
        <div className="min-h-screen flex items-center justify-center">
            <div className="card bg-base-100 shadow-xl w-full max-w-sm">
                <div className="card-body">
                    <h1 className="card-title text-2xl justify-center mb-2">Welcome</h1>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Email</legend>
                            <input
                                id="email"
                                type="email"
                                className="input w-full"
                                placeholder="name@nba.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </fieldset>

                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Password</legend>
                            <input
                                id="password"
                                type="password"
                                className="input w-full"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </fieldset>

                        {error && (
                            <div role="alert" className="alert alert-error">
                                <span>{error}</span>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                            {loading ? <span className="loading loading-spinner loading-sm" /> : 'Login'}
                        </button>

                        <button type="button" className="btn btn-ghost" onClick={handleDemoLogin} disabled={loading}>
                            Demo
                        </button>
                    </form>

                    <p className="text-center text-sm mt-2">
                        Don't have an account? <a className="link link-primary" href="/register">Register</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
