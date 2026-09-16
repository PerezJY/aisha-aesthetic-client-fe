import { authFetch } from '../api/client';
import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import {
  UserRound,
  Phone,
  Mail,
  Pencil,
  LockKeyhole,
  ChevronRight,
  LogOut,
  Camera,
  LoaderCircle,
  X,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/img/default_avatar.jpg";
import type { PasswordForm, UserProfile } from "../types";
import {
  getCurrentUser,
  saveCurrentUser,
  clearCurrentUser,
} from "../utils/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const uploadFileRef = useRef<HTMLInputElement>(null);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    id: 0,
    name: "John Doe",
    email: "caballeroaldrin02@gmail.com",
    phone: "09123456789",
    role: "client",
    profileImage: "",
  });

  const [showEditProfile, setShowEditProfile] = useState<boolean>(false);
  const [showChangePassword, setShowChangePassword] =
    useState<boolean>(false);

  const [editForm, setEditForm] = useState<UserProfile>({
    name: "John Doe",
    email: "caballeroaldrin02@gmail.com",
    phone: "09123456789",
    role: "client",
    profileImage: "",
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] =
    useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] =
    useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD USER
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadCurrentUser = () => {
      const user = getCurrentUser();

      if (!user) {
        return;
      }

      const userData: UserProfile = {
        id: user.id,
        name: user.name || "Client",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "client",
        profileImage: user.profileImage || "",
      };

      setProfile(userData);
      setEditForm(userData);
    };

    loadCurrentUser();

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

  /*
  |--------------------------------------------------------------------------
  | PROFILE IMAGE UPLOAD
  |--------------------------------------------------------------------------
  */

  const handleUploadProfile = () => {
    if (isUploadingProfileImage) {
      return;
    }

    uploadFileRef.current?.click();
  };

  const fileUploadChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      await Swal.fire({
        icon: "warning",
        title: "Invalid Image",
        text: "Please select a valid image file.",
        confirmButtonColor: "#b96d83",
      });

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      await Swal.fire({
        icon: "warning",
        title: "File Too Large",
        text: "Profile image must be less than 5MB.",
        confirmButtonColor: "#b96d83",
      });

      event.target.value = "";
      return;
    }

    if (!profile.id) {
      await Swal.fire({
        icon: "error",
        title: "Session Not Found",
        text: "User session not found. Please log in again.",
        confirmButtonColor: "#b96d83",
      });

      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      setIsUploadingProfileImage(true);

      const response = await authFetch(
        `${API_BASE_URL}/api/users/${profile.id}/profile-image`,
        {
          method: "POST",
          body: formData,
        }
      );

      const responseText = await response.text();

      let data: any = null;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        console.error(
          "Profile upload returned a non-JSON response:",
          responseText
        );

        throw new Error(
          `Server returned an invalid response (HTTP ${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
          `Failed to upload profile picture (HTTP ${response.status}).`
        );
      }

      const imagePath =
        data?.image ||
        data?.profileImage ||
        data?.user?.profileImage;

      if (!imagePath) {
        throw new Error(
          "Image uploaded but the server did not return the image path."
        );
      }

      const fullImageUrl =
        imagePath.startsWith("http://") ||
        imagePath.startsWith("https://") ||
        imagePath.startsWith("data:")
          ? imagePath
          : `${API_BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;

      const currentUser = getCurrentUser();

      if (!currentUser) {
        throw new Error(
          "User session not found. Please log in again."
        );
      }

      const updatedUser = {
        ...currentUser,
        profileImage: fullImageUrl,
      };

      saveCurrentUser(updatedUser);

      setProfile((previous) => ({
        ...previous,
        profileImage: fullImageUrl,
      }));

      setEditForm((previous) => ({
        ...previous,
        profileImage: fullImageUrl,
      }));

      window.dispatchEvent(
        new Event("user-updated")
      );

      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Profile picture updated successfully!",
        confirmButtonColor: "#b96d83",
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);

      await Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: error.message || "Failed to upload image to server.",
        confirmButtonColor: "#b96d83",
      });
    } finally {
      setIsUploadingProfileImage(false);
      event.target.value = "";
    }
  };

  /*
  |--------------------------------------------------------------------------
  | EDIT PROFILE
  |--------------------------------------------------------------------------
  */

  const handleEditChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const updatedProfile: UserProfile = {
      ...profile,
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim(),
      type: "update_profile",
    };

    if (
      !updatedProfile.name ||
      !updatedProfile.email ||
      !updatedProfile.phone
    ) {
      await Swal.fire({
        icon: "warning",
        title: "Incomplete Fields",
        text: "Please fill in all required fields.",
        confirmButtonColor: "#b96d83",
      });

      return;
    }

    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/users/${profile.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: updatedProfile.name,
            email: updatedProfile.email,
            phone: updatedProfile.phone,
            type: "update_profile",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update profile info.");
      }

      const currentUser = getCurrentUser();

      if (currentUser) {
        saveCurrentUser({
          ...currentUser,
          name: updatedProfile.name,
          email: updatedProfile.email,
          phone: updatedProfile.phone,
          profileImage:
            currentUser.profileImage ||
            updatedProfile.profileImage ||
            "",
        });
      }

      setProfile(updatedProfile);
      setEditForm(updatedProfile);

      window.dispatchEvent(
        new Event("user-updated")
      );

      setShowEditProfile(false);

      await Swal.fire({
        icon: "success",
        title: "Profile Updated",
        text: "Your profile information has been updated successfully.",
        confirmButtonColor: "#b96d83",
      });
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err.message || "Error updating profile.",
        confirmButtonColor: "#b96d83",
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CHANGE PASSWORD
  |--------------------------------------------------------------------------
  */

  const handlePasswordChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    setPasswordForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleChangePassword = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Fields",
        text: "Please complete all password fields.",
        confirmButtonColor: "#b96d83",
      });

      return;
    }

    if (passwordForm.newPassword.length < 8) {
      Swal.fire({
        icon: "warning",
        title: "Password Too Short",
        text: "New password must be at least 8 characters.",
        confirmButtonColor: "#b96d83",
      });

      return;
    }

    if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      Swal.fire({
        icon: "warning",
        title: "Passwords Do Not Match",
        text: "New passwords do not match.",
        confirmButtonColor: "#b96d83",
      });

      return;
    }

    Swal.fire({
      icon: "success",
      title: "Success",
      text: "Password changed successfully!",
      confirmButtonColor: "#b96d83",
    });

    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setShowChangePassword(false);
  };

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ec4899",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    localStorage.removeItem("token");
    clearCurrentUser();

    navigate("/signin");
  };

  const closeEditProfile = () => {
    setEditForm(profile);
    setShowEditProfile(false);
  };

  const closeChangePassword = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setShowChangePassword(false);
  };

  return (
    <div className="min-w-0 bg-[#fff8fa] p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full">

        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-serif text-2xl font-medium text-[#4b343b]">
            Profile
          </h1>
        </div>

        {/* PROFILE HERO */}
        <section className="mb-6 text-center">
          <div className="relative mx-auto mb-3 h-[92px] w-[92px]" aria-busy={isUploadingProfileImage}>
            <div className="flex h-[92px] w-[92px] items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-gradient-to-br from-[#f7e9ed] to-[#efd5dc] text-[#a9687d] shadow-[0_5px_18px_rgba(80,44,56,0.12)]">
              <img
                src={
                  profile.profileImage
                    ? getProfileImageUrl(profile.profileImage)
                    : defaultAvatar
                }
                alt={`${profile.name} profile`}
                className="h-full w-full object-cover"
              />
            </div>

            {isUploadingProfileImage && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[#5b3e45]/55 text-white" role="status" aria-live="polite">
                <LoaderCircle size={24} className="animate-spin" aria-hidden="true" />
                <span className="sr-only">Uploading profile picture...</span>
              </div>
            )}

            {/* CAMERA BUTTON */}
            <button
              type="button"
              onClick={handleUploadProfile}
              disabled={isUploadingProfileImage}
              className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-white text-[#a9687d] shadow-sm transition hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Change profile picture"
              aria-disabled={isUploadingProfileImage}
            >
              <Camera size={13} strokeWidth={2} />
            </button>

            {/* HIDDEN FILE INPUT */}
            <input
              ref={uploadFileRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={fileUploadChange}
            />
          </div>

          <h2 className="font-serif text-xl font-semibold text-[#403035]">
            {profile.name}
          </h2>

          <p className="mt-1 text-xs text-[#806e75]">
            {profile.phone || "No mobile number"}
          </p>

          <p className="mt-0.5 break-all text-[11px] text-[#9c898f]">
            {profile.email}
          </p>
        </section>

        {/* PROFILE ACTIONS */}
        <section className="mb-5 overflow-hidden rounded-xl border border-pink-100 bg-white shadow-[0_4px_16px_rgba(75,43,52,0.045)]">
          <button
            type="button"
            onClick={() => {
              setEditForm(profile);
              setShowEditProfile(true);
            }}
            className="flex min-h-[52px] w-full items-center gap-3 border-b border-[#f1e8ea] px-4 text-left transition hover:bg-[#fffafb]"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#fcf0f3] text-[#b86b82]">
              <Pencil size={16} />
            </div>

            <span className="flex-1 text-xs font-medium text-[#5d4b52]">
              Edit Profile
            </span>

            <ChevronRight size={17} className="text-[#b6a5ab]" />
          </button>

          <button
            type="button"
            onClick={() => setShowChangePassword(true)}
            className="flex min-h-[52px] w-full items-center gap-3 px-4 text-left transition hover:bg-[#fffafb]"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#fcf0f3] text-[#b86b82]">
              <LockKeyhole size={16} />
            </div>

            <span className="flex-1 text-xs font-medium text-[#5d4b52]">
              Change Password
            </span>

            <ChevronRight size={17} className="text-[#b6a5ab]" />
          </button>
        </section>

        {/* ACCOUNT INFORMATION */}
        <section className="mb-5 overflow-hidden rounded-xl border border-pink-100 bg-white shadow-[0_4px_16px_rgba(75,43,52,0.045)]">
          <div className="border-b border-[#f1e8ea] px-4 py-4">
            <h3 className="text-xs font-semibold text-[#5b484e]">
              Account Information
            </h3>
          </div>

          <div className="flex items-center gap-3 border-b border-[#f3eaec] px-4 py-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fdf2f4] text-[#b36a80]">
              <UserRound size={17} />
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-[#9b898f]">
                Full Name
              </span>

              <strong className="text-xs font-medium text-[#4a393f]">
                {profile.name}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-3 border-b border-[#f3eaec] px-4 py-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fdf2f4] text-[#b36a80]">
              <Phone size={17} />
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-[#9b898f]">
                Mobile Number
              </span>

              <strong className="text-xs font-medium text-[#4a393f]">
                {profile.phone || "No mobile number"}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fdf2f4] text-[#b36a80]">
              <Mail size={17} />
            </div>

            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[10px] text-[#9b898f]">
                Email Address
              </span>

              <strong className="break-all text-xs font-medium text-[#4a393f]">
                {profile.email}
              </strong>
            </div>
          </div>
        </section>

        {/* LOGOUT */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-[50px] w-full items-center gap-3 rounded-xl border border-[#f0dfe3] bg-white px-4 text-left text-[#c1667d] transition hover:bg-[#fff7f8]"
        >
          <LogOut size={17} />

          <span className="flex-1 text-xs font-medium">
            Logout
          </span>

          <ChevronRight
            size={17}
            className="text-[#d1a3af]"
          />
        </button>
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditProfile && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#321f26]/35 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditProfile();
            }
          }}
        >
          <div className="max-h-[calc(100vh-32px)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl font-medium text-[#3b2b30]">
                  Edit Profile
                </h2>

                <p className="mt-1 text-xs text-[#97858b]">
                  Update your account information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditProfile}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#eee1e4] text-[#78666c] transition hover:bg-pink-50"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="mb-4">
                <label className="mb-1.5 block text-[11px] font-medium text-[#59474e]">
                  Full Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  required
                  className="h-11 w-full rounded-lg border border-[#e6d9dd] bg-[#fffdfd] px-3 text-xs text-[#43343a] outline-none transition focus:border-[#c98499] focus:ring-4 focus:ring-[#c98499]/10"
                />
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-[11px] font-medium text-[#59474e]">
                  Mobile Number
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  required
                  className="h-11 w-full rounded-lg border border-[#e6d9dd] bg-[#fffdfd] px-3 text-xs text-[#43343a] outline-none transition focus:border-[#c98499] focus:ring-4 focus:ring-[#c98499]/10"
                />
              </div>

              <div className="mb-5">
                <label className="mb-1.5 block text-[11px] font-medium text-[#59474e]">
                  Email Address
                </label>

                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  required
                  className="h-11 w-full rounded-lg border border-[#e6d9dd] bg-[#fffdfd] px-3 text-xs text-[#43343a] outline-none transition focus:border-[#c98499] focus:ring-4 focus:ring-[#c98499]/10"
                />
              </div>

              <button
                type="submit"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#b96d83] text-xs font-semibold text-white transition hover:bg-[#a85d74]"
              >
                <Check size={17} />
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showChangePassword && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#321f26]/35 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeChangePassword();
            }
          }}
        >
          <div className="max-h-[calc(100vh-32px)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl font-medium text-[#3b2b30]">
                  Change Password
                </h2>

                <p className="mt-1 text-xs text-[#97858b]">
                  Keep your account secure.
                </p>
              </div>

              <button
                type="button"
                onClick={closeChangePassword}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#eee1e4] text-[#78666c] transition hover:bg-pink-50"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="mb-4">
                <label className="mb-1.5 block text-[11px] font-medium text-[#59474e]">
                  Current Password
                </label>

                <div className="relative">
                  <input
                    type={
                      showCurrentPassword
                        ? "text"
                        : "password"
                    }
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="h-11 w-full rounded-lg border border-[#e6d9dd] bg-[#fffdfd] px-3 pr-11 text-xs text-[#43343a] outline-none transition focus:border-[#c98499] focus:ring-4 focus:ring-[#c98499]/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowCurrentPassword(
                        (prev) => !prev
                      )
                    }
                    className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center p-2 text-[#9a858d]"
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-[11px] font-medium text-[#59474e]">
                  New Password
                </label>

                <div className="relative">
                  <input
                    type={
                      showNewPassword
                        ? "text"
                        : "password"
                    }
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    required
                    className="h-11 w-full rounded-lg border border-[#e6d9dd] bg-[#fffdfd] px-3 pr-11 text-xs text-[#43343a] outline-none transition focus:border-[#c98499] focus:ring-4 focus:ring-[#c98499]/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowNewPassword(
                        (prev) => !prev
                      )
                    }
                    className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center p-2 text-[#9a858d]"
                  >
                    {showNewPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              <div className="mb-5">
                <label className="mb-1.5 block text-[11px] font-medium text-[#59474e]">
                  Confirm New Password
                </label>

                <div className="relative">
                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    className="h-11 w-full rounded-lg border border-[#e6d9dd] bg-[#fffdfd] px-3 pr-11 text-xs text-[#43343a] outline-none transition focus:border-[#c98499] focus:ring-4 focus:ring-[#c98499]/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (prev) => !prev
                      )
                    }
                    className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center p-2 text-[#9a858d]"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#b96d83] text-xs font-semibold text-white transition hover:bg-[#a85d74]"
              >
                <Check size={17} />
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

