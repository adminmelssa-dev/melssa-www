import "server-only";

import { NextResponse } from "next/server";
import { resolveUserRole, type UserRole } from "@/modules/auth/roles";
import { errorResult } from "@/lib/action-result";
import {
  getSession,
  hasPermission,
  type PermissionRequest,
} from "@/server/auth/guards";

type AuthSession = NonNullable<Awaited<ReturnType<typeof getSession>>>;

type AuthorizedSession = AuthSession & {
  user: AuthSession["user"] & {
    role: UserRole;
  };
};

type ApiAuthResult =
  | {
      ok: true;
      session: AuthSession;
    }
  | {
      ok: false;
      response: NextResponse;
    };

type ApiPermissionResult =
  | {
      ok: true;
      session: AuthorizedSession;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function requireApiAuth(): Promise<ApiAuthResult> {
  const session = await getSession();

  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(errorResult(null, "Authentication required."), {
        status: 401,
      }),
    };
  }

  return { ok: true, session };
}

export async function requireApiPermission(
  permission: PermissionRequest,
): Promise<ApiPermissionResult> {
  const authResult = await requireApiAuth();

  if (!authResult.ok) return authResult;

  const role = resolveUserRole(authResult.session.user.role);

  if (!hasPermission(role, permission)) {
    return {
      ok: false,
      response: NextResponse.json(errorResult(null, "Permission denied."), {
        status: 403,
      }),
    };
  }

  return {
    ok: true,
    session: {
      ...authResult.session,
      user: {
        ...authResult.session.user,
        role,
      },
    },
  };
}
