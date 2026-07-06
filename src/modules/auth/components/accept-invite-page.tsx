import Link from "next/link";
import {
  Clock,
  LogIn,
  MailCheck,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  acceptAuthInvitationInputSchema,
  type AuthInvitationPreview,
} from "@/modules/auth/contracts";
import { getAuthPageHref } from "@/modules/auth/callback-url";
import { AcceptInviteForm } from "@/modules/auth/components/accept-invite-form";
import { AuthMessage } from "@/modules/auth/components/auth-message";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";
import { ROLE_LABELS } from "@/modules/auth/roles";
import { getAuthInvitationPreviewByToken } from "@/modules/auth/server/invitations";
import { getSession } from "@/server/auth/guards";

interface AcceptInvitePageProps {
  token: string | null;
}

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export async function AcceptInvitePage({ token }: AcceptInvitePageProps) {
  const parsedToken = acceptAuthInvitationInputSchema.safeParse({ token });

  if (!parsedToken.success) {
    return <InviteUnavailable />;
  }

  const invite = await getAuthInvitationPreviewByToken(parsedToken.data.token);

  if (!invite) {
    return <InviteUnavailable />;
  }

  const session = await getSession();
  const callbackPath = getInviteCallbackPath(parsedToken.data.token);
  const signedInEmail =
    typeof session?.user.email === "string"
      ? session.user.email.toLowerCase()
      : null;
  const emailMatches = signedInEmail === invite.email;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-black">
          Workspace invitation
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Review the invite details before joining the MELSSA workspace.
        </p>
      </div>

      <InviteSummary invite={invite} />

      {invite.status === "pending" ? (
        <PendingInviteActions
          callbackPath={callbackPath}
          emailMatches={emailMatches}
          invite={invite}
          signedInEmail={signedInEmail}
          token={parsedToken.data.token}
        />
      ) : (
        <ClosedInviteMessage invite={invite} />
      )}
    </div>
  );
}

function PendingInviteActions({
  callbackPath,
  emailMatches,
  invite,
  signedInEmail,
  token,
}: {
  callbackPath: string;
  emailMatches: boolean;
  invite: AuthInvitationPreview;
  signedInEmail: string | null;
  token: string;
}) {
  if (!signedInEmail) {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <Button asChild>
          <Link href={getAuthPageHref("/sign-in", callbackPath)}>
            <LogIn className="size-4" />
            Sign in
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={getAuthPageHref("/sign-up", callbackPath)}>
            <UserPlus className="size-4" />
            Create account
          </Link>
        </Button>
      </div>
    );
  }

  if (!emailMatches) {
    return (
      <div className="space-y-3">
        <AuthMessage variant="info">
          You are signed in as {signedInEmail}. This invite belongs to{" "}
          {invite.email}.
        </AuthMessage>
        <SignOutButton
          redirectTo={getAuthPageHref("/sign-in", callbackPath)}
        />
      </div>
    );
  }

  return (
    <AcceptInviteForm
      roleLabel={ROLE_LABELS[invite.role]}
      token={token}
    />
  );
}

function ClosedInviteMessage({ invite }: { invite: AuthInvitationPreview }) {
  return (
    <div className="space-y-3">
      <AuthMessage variant="info">{getClosedInviteMessage(invite)}</AuthMessage>
      <Button asChild variant="outline" className="w-full">
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    </div>
  );
}

function InviteUnavailable() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-black">
          Invite unavailable
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This invitation link is invalid or no longer exists.
        </p>
      </div>
      <Button asChild className="w-full" variant="outline">
        <Link href="/sign-in">Return to sign in</Link>
      </Button>
    </div>
  );
}

function InviteSummary({ invite }: { invite: AuthInvitationPreview }) {
  return (
    <div className="space-y-3 rounded-lg border bg-card p-4 text-sm">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <MailCheck className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="font-medium">Invited account</p>
          <p className="break-all text-muted-foreground">{invite.email}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{ROLE_LABELS[invite.role]}</Badge>
        <Badge variant="outline">{invite.status}</Badge>
      </div>
      {invite.expiresAt ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Clock className="size-4" />
          Expires {dateFormatter.format(new Date(invite.expiresAt))}
        </p>
      ) : null}
    </div>
  );
}

function getInviteCallbackPath(token: string): string {
  const params = new URLSearchParams();
  params.set("token", token);
  return `/accept-invite?${params.toString()}`;
}

function getClosedInviteMessage(invite: AuthInvitationPreview): string {
  if (invite.status === "accepted") {
    return "This invitation has already been accepted.";
  }

  if (invite.status === "revoked") {
    return "This invitation has been revoked by an admin.";
  }

  return "This invitation has expired. Ask a site admin to resend it.";
}
