import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function RegisterPage() {
    const [form, setForm] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        username: '',
        firstName: '',
        lastName: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.id]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        const { data, error: signUpError } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        const accessToken = data.session?.access_token;
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                username: form.username,
                firstName: form.firstName,
                lastName: form.lastName,
            }),
        });

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            setError(body.message ?? 'Failed to create profile.');
            setLoading(false);
            return;
        }

        navigate('/dashboard');
    };

    return (
        <div data-theme="dark" className="min-h-screen w-full flex items-center justify-center">
            <div className="card bg-base-100 shadow-xl w-full max-w-sm">
                <div className="card-body">
                    <h1 className="card-title text-2xl justify-center mb-2">Register</h1>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Email</legend>
                            <input
                                id="email"
                                type="email"
                                className="input w-full"
                                placeholder="name@nba.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </fieldset>

                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Username</legend>
                            <input
                                id="username"
                                type="text"
                                className="input w-full"
                                placeholder="hooper42"
                                value={form.username}
                                onChange={handleChange}
                                required
                            />
                        </fieldset>

                        <div className="flex gap-2">
                            <fieldset className="fieldset flex-1">
                                <legend className="fieldset-legend">First Name</legend>
                                <input
                                    id="firstName"
                                    type="text"
                                    className="input w-full"
                                    placeholder="John"
                                    value={form.firstName}
                                    onChange={handleChange}
                                />
                            </fieldset>

                            <fieldset className="fieldset flex-1">
                                <legend className="fieldset-legend">Last Name</legend>
                                <input
                                    id="lastName"
                                    type="text"
                                    className="input w-full"
                                    placeholder="Doe"
                                    value={form.lastName}
                                    onChange={handleChange}
                                />
                            </fieldset>
                        </div>

                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Password</legend>
                            <input
                                id="password"
                                type="password"
                                className="input w-full"
                                placeholder="*******"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                        </fieldset>

                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Confirm Password</legend>
                            <input
                                id="confirmPassword"
                                type="password"
                                className="input w-full"
                                placeholder="*******"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </fieldset>

                        {error && (
                            <div role="alert" className="alert alert-error">
                                <span>{error}</span>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                            {loading ? <span className="loading loading-spinner loading-sm" /> : 'Register'}
                        </button>
                    </form>

                    <p className="text-center text-sm mt-2">
                        Already have an account? <a className="link link-primary" href="/">Login</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
