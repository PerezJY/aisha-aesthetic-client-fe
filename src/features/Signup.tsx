import BrandLogo from '../components/BrandLogo';
import { LockKeyhole, Mail, Phone, User, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getCustomerTerms, signup } from '../api/auth.api';
import type { CustomerTerms } from '../api/auth.api';
import TermsReader from '../components/TermsReader';

function Signup() {
  const navigate = useNavigate();

  const [terms, setTerms] = useState<CustomerTerms | null>(null);
  const [termsError, setTermsError] = useState('');
  const [termsRetry, setTermsRetry] = useState(0);

  const [accepted, setAccepted] = useState(false);
  const [reviewedVersion, setReviewedVersion] = useState('');
  const [showTerms, setShowTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reviewed = !!terms && reviewedVersion === terms.version;

  useEffect(() => {
    let active = true;

    getCustomerTerms()
      .then((data) => {
        if (active) {
          setTerms(data);
          setTermsError('');
          setAccepted(false);
          setReviewedVersion('');
        }
      })
      .catch(() => {
        if (active) {
          setTermsError(
            'Unable to load the terms. Please try again before signing up.'
          );
        }
      });

    return () => {
      active = false;
    };
  }, [termsRetry]);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!terms || !reviewed || !accepted || loading) {
      return;
    }

    const form = new FormData(event.currentTarget);

    const name = String(form.get('name') || '');
    const email = String(form.get('email') || '');
    const phone = String(form.get('phone') || '');
    const password = String(form.get('password') || '');
    const confirmPassword = String(form.get('confirmPassword') || '');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signup({
        name,
        email,
        phone,
        password,
        confirmPassword,
        acceptedTerms: accepted,
        termsVersion: terms.version,
      });

      navigate('/signin', {
        replace: true,
        state: {
          signupSuccess: true,
        },
      });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to create your account.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTerms = () => {
    if (!terms || loading) return;
    setShowTerms(true);
  };

  const handleReviewed = () => {
    if (!terms) return;

    setReviewedVersion(terms.version);
    setShowTerms(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff8fa] px-4 py-8">
      <div className="w-full max-w-xl rounded-3xl border border-pink-100 bg-white p-6 shadow-xl shadow-pink-100/40 sm:p-10">

        {/* Header */}
        <div className="mt-6 text-center">
          <BrandLogo className="mx-auto mb-4 h-24 w-24" />

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b88a2c]">
            AishaEsthetics
          </p>

          <h1 className="mt-3 text-3xl font-bold text-[#4b343b]">
            Create Your Account
          </h1>

          <p className="mt-2 text-sm text-[#92737c]">
            Sign up to book and manage your appointments.
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">

          {/* Full Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#5c444b]">
              Full Name
            </label>

            <div className="relative">
              <User
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b49aa2]"
              />

              <input
                type="text"
                name="name"
                autoComplete="name"
                maxLength={100}
                placeholder="Enter your full name"
                className="input-field pl-11"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#5c444b]">
              Email Address
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b49aa2]"
              />

              <input
                type="email"
                name="email"
                autoComplete="email"
                maxLength={254}
                placeholder="you@email.com"
                className="input-field pl-11"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#5c444b]">Phone Number</label>
            <div className="relative">
              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b49aa2]" />
              <input type="tel" name="phone" autoComplete="tel" maxLength={30} placeholder="09XXXXXXXXX" className="input-field pl-11" required />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#5c444b]">
              Password
            </label>

            <div className="relative">
              <LockKeyhole
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b49aa2]"
              />

              <input
                type="password"
                name="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                placeholder="Create a password"
                className="input-field pl-11"
                required
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[#5c444b]">
              Confirm Password
            </label>

            <div className="relative">
              <LockKeyhole
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b49aa2]"
              />

              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                placeholder="Confirm your password"
                className="input-field pl-11"
                required
              />
            </div>
          </div>

          {/* Terms Agreement */}
          {terms ? (
            <label className="flex items-start gap-2 text-sm text-[#80656d]">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => {
                  setAccepted(event.target.checked);
                  setError('');
                }}
                disabled={!reviewed || loading}
                required
                className="mt-1 h-4 w-4 shrink-0 accent-[#df7f98]"
              />

              <span className="leading-6">
                I have read and agree to the{' '}
                <button
                  type="button"
                  onClick={handleOpenTerms}
                  disabled={loading}
                  className="font-semibold text-[#d77992] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Customer Terms & Conditions
                </button>
                .
              </span>
            </label>
          ) : termsError ? (
            <div
              role="alert"
              className="text-sm text-red-700"
            >
              {termsError}{' '}
              <button
                type="button"
                className="font-semibold underline"
                onClick={() =>
                  setTermsRetry((value) => value + 1)
                }
              >
                Retry
              </button>
            </div>
          ) : (
            <p
              role="status"
              className="text-sm text-[#80656d]"
            >
              Loading customer terms…
            </p>
          )}

          {/* Error */}
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {/* Create Account */}
          <button
            type="submit"
            disabled={!reviewed || !accepted || loading}
            className="primary-btn w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Sign In */}
        <p className="mt-7 text-center text-sm text-[#92737c]">
          Already have an account?{' '}

          <Link
            to="/signin"
            className="font-bold text-[#d77992] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* =========================================================
          TERMS & CONDITIONS MODAL
         ========================================================= */}
      {showTerms && terms && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="terms-title"
        >
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-pink-100 px-5 py-4">
              <div>
                <h2
                  id="terms-title"
                  className="text-lg font-bold text-[#4b343b]"
                >
                  {terms.title}
                </h2>

                <p className="mt-1 text-xs text-[#92737c]">
                  Please read the terms and conditions before continuing.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowTerms(false)}
                disabled={loading}
                className="rounded-full p-2 text-[#92737c] transition hover:bg-pink-50 hover:text-[#d77992]"
                aria-label="Close terms and conditions"
              >
                <X size={20} />
              </button>
            </div>

            {/* Terms Content */}
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <TermsReader
                key={terms.version}
                title={terms.title}
                sections={terms.sections}
                disabled={loading}
                onReviewed={handleReviewed}
              />
            </div>

            {/* Modal Footer */}
            <div className="border-t border-pink-100 bg-[#fffafb] px-5 py-4">
              {reviewed ? (
                <button
                  type="button"
                  onClick={() => setShowTerms(false)}
                  className="primary-btn w-full"
                >
                  Continue
                </button>
              ) : (
                <p className="text-center text-xs text-[#92737c]">
                  Please read the terms and conditions to continue.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Signup;
