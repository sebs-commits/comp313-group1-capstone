import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/api/Auth/forgot-password', { email });
      setSuccess('Password recovery email sent! Check your inbox for further instructions.');
      setEmail('');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Failed to send recovery email. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-theme="dark" className="min-h-screen w-full flex items-center justify-center">
      <div className="card bg-base-100 shadow-xl w-full max-w-sm">
        <div className="card-body">
          <h1 className="card-title text-2xl justify-center mb-2">Reset Password</h1>
          <p className="text-sm text-gray-400 text-center mb-4">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success mb-4">
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Email Address</legend>
              <input
                id="email"
                type="email"
                className="input w-full"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || success}
              />
            </fieldset>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="divider my-2"></div>

          <p className="text-center text-sm">
            Remember your password?{' '}
            <Link to="/" className="link link-primary">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
