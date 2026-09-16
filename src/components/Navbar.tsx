import BrandLogo from './BrandLogo';
import { Bell, Menu, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import { getCurrentUser } from "../utils/auth";
import { useNotifications } from '../hooks/useNotifications';

function Navbar({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const location = useLocation();
  const { unreadCount, error: notificationError } = useNotifications();

  // =====================================================
  // PROFILE STATE
  // =====================================================

  const [profileImage, setProfileImage] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  // =====================================================
  // API BASE URL
  // =====================================================

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // =====================================================
  // PAGE TITLE
  // =====================================================

  const getPageTitle = () => {
    if (location.pathname === "/booking") {
      return "Book Appointment";
    }

    if (location.pathname === "/appointments") {
      return "My Appointments";
    }

    if (location.pathname === "/history") {
      return "Appointment History";
    }

    if (location.pathname === "/notifications") {
      return "Notifications";
    }

    if (location.pathname === "/profile") {
      return "Profile";
    }

    return "Welcome Back";
  };

  // =====================================================
  // PROFILE IMAGE URL
  // =====================================================

  const getProfileImageUrl = (
    image?: string | null
  ): string => {
    if (!image) {
      return "";
    }

    // Base64 image
    if (image.startsWith("data:")) {
      return image;
    }

    // Already complete URL
    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    // Relative path from backend
    if (image.startsWith("/")) {
      return `${API_BASE_URL}${image}`;
    }

    return `${API_BASE_URL}/${image}`;
  };

  // =====================================================
  // LOAD CURRENT USER
  // =====================================================

  useEffect(() => {
    const loadCurrentUser = () => {
      const user = getCurrentUser();

      if (!user) {
        setProfileImage("");
        setUserName("");
        return;
      }

      setProfileImage(user.profileImage || "");
      setUserName(user.name || "");
    };

    // Load immediately
    loadCurrentUser();

    // Listen for changes from Profile.tsx
    window.addEventListener(
      "user-updated",
      loadCurrentUser
    );

    return () => {
      window.removeEventListener(
        "user-updated",
        loadCurrentUser
      );
    };
  }, []);

  // =====================================================
  // IMAGE ERROR HANDLER
  // =====================================================

  const handleProfileImageError = (
    event: React.SyntheticEvent<HTMLImageElement>
  ) => {
    // Hide broken image so Sparkles fallback can be used
    event.currentTarget.style.display = "none";
  };

  return (
    <header className="sticky top-0 z-40 border-b border-pink-100 bg-white/90 backdrop-blur-md">
      <div className="flex h-[72px] min-w-0 items-center justify-between gap-2 px-3 sm:px-6">

        {/* =====================================================
            LEFT
        ===================================================== */}

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">

          {/* MOBILE MENU */}
          <button
            type="button"
            onClick={onMenuClick}
            className="shrink-0 rounded-xl p-2 text-[#70535d] hover:bg-pink-50 md:hidden"
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>

          <BrandLogo className="h-10 w-10 shrink-0 md:hidden" />

          {/* PAGE TITLE */}
          <div className="min-w-0">
            <p className="truncate text-xs font-medium tracking-[0.02em] text-[#b88a2c] sm:tracking-[0.05em]">
              AishaEsthetics
            </p>

            <h1 className="truncate text-base font-bold text-[#4b343b] sm:text-lg">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* =====================================================
            RIGHT
        ===================================================== */}

        <div className="flex shrink-0 items-center gap-1 sm:gap-3">

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          <Link
            to="/notifications"
            className="relative rounded-xl p-2.5 text-[#76545f] transition hover:bg-pink-50"
            aria-label={notificationError ? 'Notifications unavailable' : `Notifications, ${unreadCount} unread`}
          >
            <Bell size={21} />

            {/* Notification dot */}
            {unreadCount > 0 && <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center whitespace-nowrap rounded-full bg-[#df7f98] px-1 text-center text-xs font-bold leading-5 text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </Link>

          {/* =================================================
              CLIENT ACCOUNT
          ================================================= */}

          <Link
            to="/profile"
            className="group flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-pink-100 bg-[#fffafb] transition duration-200 hover:border-[#e8c6cf] hover:bg-[#fff5f7]"
            aria-label="Profile"
            title={userName ? `${userName} - Profile` : "Profile"}
          >

            {/* =================================================
                PROFILE AVATAR
            ================================================= */}

            {profileImage ? (
              <img
                src={getProfileImageUrl(profileImage)}
                alt={`${userName || "User"} profile`}
                className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                onError={handleProfileImageError}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#f9d7df] text-[#bd6c83] transition duration-200 group-hover:bg-[#f5cbd5]">
                <Sparkles size={17} />
              </div>
            )}

          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
