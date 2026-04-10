import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase sends recovery session in URL hash, need to process it
    const handleRecoveryLink = async () => {
      try {
        // Get the hash from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        // If tokens are present in URL, use them to establish session
        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error || !data.session) {
            setInvalidLink(true);
            setError('Invalid or expired recovery link. Please request a new password reset.');
            return;
          }
          
          setSessionReady(true);
          return;
        }

        // Fallback: check if there's already a session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSessionReady(true);
          return;
        }
        setInvalidLink(true);
        setError('Invalid or expired recovery link. Please request a new password reset.');
      } catch (err) {
        console.error('Recovery link error:', err);
        setInvalidLink(true);
        setError('An error occurred processing your reset link.');
      }
    };

    handleRecoveryLink();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess('Password reset successfully! Redirecting to login...');
      await supabase.auth.signOut();
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (invalidLink) {
    return (
      <div data-theme="dark" className="min-h-screen w-full flex items-center justify-center">
        <div className="card bg-base-100 shadow-xl w-full max-w-sm">
          <div className="card-body">
            <h1 className="card-title text-2xl justify-center mb-4">Invalid Link</h1>
            
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>

            <p className="text-center text-sm mb-4">
              The password reset link has expired or is invalid.
            </p>

            <div className="flex flex-col gap-2">
              <Link to="/" className="btn btn-primary w-full">
                Back to Login
              </Link>
              <Link to="/forgot-password" className="btn btn-outline w-full">
                Request New Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div data-theme="dark" className="min-h-screen w-full flex items-center justify-center">
        <div className="card bg-base-100 shadow-xl w-full max-w-sm">
          <div className="card-body">
            <h1 className="card-title text-2xl justify-center mb-4">Loading...</h1>
            <div className="flex justify-center">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
            <p className="text-center text-sm text-gray-400 mt-4">
              Processing your password reset link...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-theme="dark" className="min-h-screen w-full flex items-center justify-center">
      <div className="card bg-base-100 shadow-xl w-full max-w-sm">
        <div className="card-body">
          <h1 className="card-title text-2xl justify-center mb-2">Reset Your Password</h1>
          <p className="text-sm text-gray-400 text-center mb-4">
            Enter your new password below.
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
              <legend className="fieldset-legend">New Password</legend>
              <input
                id="password"
                type="password"
                className="input w-full"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || success}
                minLength="8"
              />
              <p className="text-xs text-gray-400 mt-2">
                Minimum 8 characters
              </p>
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Confirm Password</legend>
              <input
                id="confirm-password"
                type="password"
                className="input w-full"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading || success}
                minLength="8"
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
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          <div className="divider my-2"></div>

          <p className="text-center text-sm">
            <Link to="/" className="link link-primary">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
