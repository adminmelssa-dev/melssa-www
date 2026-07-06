"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PasswordStrengthMeter } from "@/modules/auth/components/password-strength-meter";
import { authClient } from "@/modules/auth/client";
import {
  ProfilePanel,
  ProfileSection,
  profileFieldControl,
  profileFieldLabel,
} from "@/modules/profile/components/profile-ui";

interface ProfileFormProps {
  userName: string;
  userEmail: string;
}

export function ProfileForm({ userName, userEmail }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(userName);
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();

    if (normalizedName.length === 0) {
      toast.error("Name is required.");
      return;
    }

    setSavingProfile(true);
    const result = await authClient.updateUser({ name: normalizedName });

    if (result.error) {
      toast.error(result.error.message ?? "Profile update failed.");
      setSavingProfile(false);
      return;
    }

    toast.success("Profile updated.");
    setName(normalizedName);
    setSavingProfile(false);
    router.refresh();
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setChangingPassword(true);
    const result = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });

    if (result.error) {
      toast.error(result.error.message ?? "Password change failed.");
      setChangingPassword(false);
      return;
    }

    toast.success("Password changed.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setChangingPassword(false);
  }

  return (
    <div className="grid gap-10 xl:grid-cols-2">
      <ProfileSection
        title="Identity"
        description="Keep your account details current."
      >
        <form onSubmit={handleProfileSubmit}>
          <ProfilePanel>
            <div className="border-b border-hairline p-5">
              <label htmlFor="profile-email" className={profileFieldLabel}>
                Email
              </label>
              <input
                id="profile-email"
                type="email"
                value={userEmail}
                disabled
                className={profileFieldControl}
              />
            </div>
            <div className="p-5">
              <label htmlFor="profile-name" className={profileFieldLabel}>
                Full name
              </label>
              <input
                id="profile-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                required
                className={profileFieldControl}
              />
            </div>
          </ProfilePanel>
          <div className="mt-4 flex justify-end">
            <Button
              type="submit"
              variant="gold"
              size="sm"
              className="rounded-full"
              disabled={savingProfile}
            >
              <Save className="size-4" />
              {savingProfile ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </ProfileSection>

      <ProfileSection
        title="Password"
        description="Change your password and sign out other devices."
      >
        <form onSubmit={handlePasswordSubmit}>
          <ProfilePanel>
            <div className="border-b border-hairline p-5">
              <label htmlFor="current-password" className={profileFieldLabel}>
                Current password
              </label>
              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(event.currentTarget.value)
                }
                required
                className={profileFieldControl}
              />
            </div>
            <div className="border-b border-hairline p-5">
              <label htmlFor="new-password" className={profileFieldLabel}>
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={newPassword}
                onChange={(event) => setNewPassword(event.currentTarget.value)}
                required
                className={profileFieldControl}
              />
              <div className="mt-3">
                <PasswordStrengthMeter password={newPassword} />
              </div>
            </div>
            <div className="p-5">
              <label htmlFor="confirm-new-password" className={profileFieldLabel}>
                Confirm password
              </label>
              <input
                id="confirm-new-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.currentTarget.value)
                }
                required
                className={profileFieldControl}
              />
            </div>
          </ProfilePanel>
          <div className="mt-4 flex justify-end">
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={changingPassword}
            >
              <Lock className="size-4" />
              {changingPassword ? "Changing…" : "Change password"}
            </Button>
          </div>
        </form>
      </ProfileSection>
    </div>
  );
}
