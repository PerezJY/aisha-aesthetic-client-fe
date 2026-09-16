import BrandLogo from '../components/BrandLogo';
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { login, acceptStaffTerms } from '../api/auth.api';
import type { StaffTermsChallenge } from '../api/auth.api';
import StaffTermsAgreement from '../components/StaffTermsAgreement';
import ForgotPassword from '../components/ForgotPassword';
import beautyWoman from '../assets/img/beauty.png';
import {
  getRoleDestination,
  normalizeCurrentUser,
  saveCurrentUser,
} from '../utils/auth';

function Signin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [termsChallenge, setTermsChallenge] =
    useState<StaffTermsChallenge | null>(null);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await login({ email, password });

      if (data.termsRequired) {
        setTermsChallenge(data);
        setPassword('');
        return;
      }

      const currentUser = normalizeCurrentUser(data.user);

      saveCurrentUser(currentUser);
      navigate(getRoleDestination(currentUser), { replace: true });
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Login failed.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTerms = async () => {
    if (!termsChallenge) return;

    setLoading(true);
    setError('');

    try {
      const data = await acceptStaffTerms(termsChallenge);

      const currentUser = normalizeCurrentUser(data.user);

      saveCurrentUser(currentUser);
      navigate(getRoleDestination(currentUser), { replace: true });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to save your agreement.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (forgotPassword) {
    return (
      <ForgotPassword
        initialEmail={email}
        onBack={() => {
          setForgotPassword(false);
          setPassword('');
          setError('');
        }}
      />
    );
  }

  if (termsChallenge) {
    return (
      <StaffTermsAgreement
        key={termsChallenge.termsToken}
        challenge={termsChallenge}
        onAccept={() => void handleAcceptTerms()}
        onCancel={() => {
          setTermsChallenge(null);
          setError('');
        }}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff8fa] px-4 py-6 sm:py-8">

      {/* ==========================================
          MAIN CARD
      ========================================== */}

      <div
        className="
          grid
          w-full
          max-w-5xl
          overflow-hidden
          rounded-3xl
          border
          border-pink-100
          bg-white
          shadow-xl
          shadow-pink-100/40
          md:grid-cols-2
        "
      >

        {/* ==========================================
            LEFT BEAUTY PANEL
        ========================================== */}

        <div
          className="
            relative
            flex
            h-[220px]
            flex-col
            justify-between
            overflow-hidden
            bg-[#f8dce3]
            signin-image-float
            sm:h-[260px]
            md:h-auto
            md:min-h-[600px]
          "
        >

          {/* ========================================
              BEAUTY IMAGE
          ======================================== */}

          <div
            className="
              signin-glow
              absolute
              -inset-8
              rounded-[3rem]
              bg-[#f8dce3]/70
              blur-2xl
            "
            aria-hidden="true"
          />

          <img
            src={beautyWoman}
            alt="AishaEsthetics Beauty Treatment"
            className="
              absolute
              inset-0
              h-full
              w-full
              object-cover
              object-center
              signin-image-drift
            "
          />

          {/* ========================================
              IMAGE OVERLAY
          ======================================== */}

          <span
            className="
              signin-accent-gold
              absolute
              right-6
              top-12
              h-5
              w-5
              rounded-full
              bg-[#e7c67b]/70
              shadow-lg
              md:right-10
              md:top-24
              md:h-6
              md:w-6
            "
            aria-hidden="true"
          />

          <span
            className="
              signin-accent-pink
              absolute
              bottom-12
              left-8
              h-3
              w-3
              rounded-full
              bg-[#d77992]/60
              shadow-md
              md:bottom-28
              md:left-12
              md:h-3.5
              md:w-3.5
            "
            aria-hidden="true"
          />

          <div
            className="
              absolute
              inset-0
              bg-gradient-to-br
              from-[#f8dce3]/95
              via-[#fff2f4]/55
              to-[#fff5e9]/20
            "
          />

          {/* ========================================
              TOP LOGO
          ======================================== */}

          <div
            className="
              signin-fade-up
              relative
              z-10
              p-5
              sm:p-6
              md:p-8
              lg:p-10
            "
          >
            <BrandLogo
              className="
                h-20
                w-20
                sm:h-24
                sm:w-24
                md:h-32
                md:w-32
                lg:h-40
                lg:w-40
              "
            />
          </div>

          {/* ========================================
              CENTER CONTENT
              Hidden on mobile for cleaner layout
          ======================================== */}

          <div
            className="
              signin-fade-up
              relative
              z-10
              hidden
              px-8
              pb-10
              [animation-delay:180ms]
              md:block
              lg:px-10
            "
          >

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b88a2c]">
              AishaEsthetics
            </p>

            <h1
              className="
                mt-4
                text-4xl
                font-bold
                leading-tight
                text-[#4b343b]
                lg:text-5xl
              "
            >
              Beauty begins
              <br />
              with self-care.
            </h1>

            <p className="mt-4 max-w-sm text-sm leading-6 text-[#80656d]">
              Easily manage your appointments, services, reminders,
              and beauty journey.
            </p>

          </div>

          {/* ========================================
              BOTTOM TEXT
              Hidden on mobile
          ======================================== */}

          <div
            className="
              signin-fade-up
              relative
              z-10
              hidden
              px-8
              pb-8
              [animation-delay:300ms]
              md:block
              lg:px-10
            "
          >
            <p className="text-xs text-[#9d7c85]">
              Beauty • Aesthetics • Wellness
            </p>
          </div>

        </div>


        {/* ==========================================
            RIGHT SIGN IN PANEL
        ========================================== */}

        <div className="p-5 sm:p-8 md:p-10">

          {/* ========================================
              HEADER
          ======================================== */}

          <div className="signin-fade-up [animation-delay:120ms]">

            <p className="text-sm font-medium text-[#b88a2c]">
              Welcome Back
            </p>

            <h2 className="mt-2 text-3xl font-bold text-[#4b343b]">
              Sign In
            </h2>

            <p className="mt-2 text-sm text-[#92737c]">
              Enter your account details to continue.
            </p>

          </div>


          {/* ========================================
              SIGN IN FORM
          ======================================== */}

          <form
            onSubmit={handleSubmit}
            className="
              signin-fade-up
              mt-7
              space-y-5
              [animation-delay:220ms]
              sm:mt-8
            "
          >

            {/* SUCCESS MESSAGE */}

            {location.state?.signupSuccess && (
              <p
                role="status"
                className="
                  rounded-xl
                  bg-green-50
                  p-3
                  text-sm
                  text-green-700
                "
              >
                Your customer account has been created. Sign in below.
              </p>
            )}

            {/* ERROR MESSAGE */}

            {error && (
              <div
                className="
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  px-3
                  py-2
                  text-sm
                  text-red-700
                "
              >
                {error}
              </div>
            )}


            {/* ======================================
                EMAIL
            ====================================== */}

            <div>

              <label
                htmlFor="email"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-[#5c444b]
                "
              >
                Email Address
              </label>

              <div className="relative">

                <Mail
                  size={18}
                  className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-[#b49aa2]
                  "
                />

                <input
                  id="email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="
                    input-field
                    w-full
                    pl-11
                  "
                  required
                />

              </div>

            </div>


            {/* ======================================
                PASSWORD
            ====================================== */}

            <div>

              <label
                htmlFor="password"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-[#5c444b]
                "
              >
                Password
              </label>

              <div className="relative">

                <LockKeyhole
                  size={18}
                  className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-[#b49aa2]
                  "
                />

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="
                    input-field
                    w-full
                    pl-11
                    pr-11
                  "
                  required
                />

                {/* SHOW PASSWORD */}

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="
                    absolute
                    right-4
                    top-1/2
                    -translate-y-1/2
                    text-[#a78d95]
                    transition
                    hover:text-[#d77992]
                  "
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>


            {/* ======================================
                FORGOT PASSWORD
            ====================================== */}

            <div className="flex justify-end">

              <button
                type="button"
                onClick={() => setForgotPassword(true)}
                disabled={loading}
                className="
                  text-sm
                  font-semibold
                  text-[#d77992]
                  hover:underline
                "
              >
                Forgot password?
              </button>

            </div>


            {/* ======================================
                SIGN IN BUTTON
            ====================================== */}

            <button
              type="submit"
              className="
                primary-btn
                w-full
                shadow-md
                transition
                duration-300
                hover:-translate-y-0.5
                hover:shadow-lg
                disabled:cursor-not-allowed
                disabled:opacity-70
              "
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

          </form>


          {/* ========================================
              SIGN UP
          ======================================== */}

          <p
            className="
              mt-6
              text-center
              text-sm
              text-[#92737c]
              sm:mt-7
            "
          >
            Don't have an account?{' '}

            <Link
              to="/signup"
              className="
                font-bold
                text-[#d77992]
                hover:underline
              "
            >
              Sign up
            </Link>

          </p>

        </div>

      </div>

    </div>
  );
}

export default Signin;