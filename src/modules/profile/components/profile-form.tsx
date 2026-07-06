"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrengthMeter } from "@/modules/auth/components/password-strength-meter";
import { authClient } from "@/modules/auth/client";

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
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <UserRound className="size-4" />
            </span>
            <div>
              <CardTitle>Profile</CardTitle>
              <p className="text-sm text-muted-foreground">
                Keep your account identity current.
              </p>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleProfileSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                value={userEmail}
                disabled
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Full name</Label>
              <Input
                id="profile-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={savingProfile}>
              <Save className="size-4" />
              {savingProfile ? "Saving..." : "Save profile"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <Lock className="size-4" />
            </span>
            <div>
              <CardTitle>Password</CardTitle>
              <p className="text-sm text-muted-foreground">
                Change your password and revoke other sessions.
              </p>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handlePasswordSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(event.currentTarget.value)
                }
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.currentTarget.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-new-password">Confirm password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.currentTarget.value)
                  }
                  required
                />
              </div>
            </div>
            <PasswordStrengthMeter password={newPassword} />
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={changingPassword} variant="outline">
              <Lock className="size-4" />
              {changingPassword ? "Changing..." : "Change password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
