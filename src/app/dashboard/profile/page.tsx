import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { PasskeyManager } from "@/modules/profile/components/passkey-manager";
import { ProfileForm } from "@/modules/profile/components/profile-form";
import { SessionManager } from "@/modules/profile/components/session-manager";
import {
  getUserPasskeys,
  getUserSessions,
} from "@/modules/profile/queries";
import { requireAuth } from "@/server/auth/guards";

export default async function DashboardProfilePage() {
  const session = await requireAuth();
  const [passkeys, sessions] = await Promise.all([
    getUserPasskeys(),
    getUserSessions(session.session.token),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <DashboardPageHeader
        description="Manage your account identity, password, and passwordless sign-in."
        kicker="Account"
        title="Profile"
      />

      <ProfileForm
        userEmail={session.user.email}
        userName={session.user.name}
      />
      <SessionManager sessions={sessions} />
      <PasskeyManager passkeys={passkeys} />
    </div>
  );
}
