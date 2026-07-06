import { createAccessControl } from "better-auth/plugins/access";

function actions<const TAction extends string[]>(
  ...items: TAction
): TAction {
  return items;
}

export const statement = {
  announcement: actions("create", "read", "update", "delete", "publish"),
  audit: actions("read"),
  course: actions("create", "read", "update", "delete"),
  event: actions("create", "read", "update", "delete", "publish"),
  resource: actions("create", "read", "update", "delete", "publish"),
  lecturer: actions("create", "read", "update", "delete"),
  concern: actions("create", "read", "update", "archive"),
  gallery: actions("create", "read", "update", "delete"),
  spotlight: actions("create", "read", "update", "delete", "publish"),
  storage: actions("create", "read", "delete", "audit"),
  user: actions(
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "impersonate-admins",
    "delete",
    "set-password",
    "set-email",
    "get",
    "read",
    "update",
    "manage_roles",
  ),
  session: actions("list", "revoke", "delete"),
  settings: actions("read", "update"),
};

export const ac = createAccessControl(statement);

export const studentRole = ac.newRole({
  announcement: ["read"],
  course: ["read"],
  event: ["read"],
  resource: ["read"],
  lecturer: ["read"],
  concern: ["create"],
  gallery: ["read"],
  spotlight: ["read"],
});

export const contentAdminRole = ac.newRole({
  announcement: ["create", "read", "update", "delete", "publish"],
  course: ["create", "read", "update", "delete"],
  event: ["create", "read", "update", "delete", "publish"],
  resource: ["create", "read", "update", "delete", "publish"],
  lecturer: ["create", "read", "update", "delete"],
  concern: ["read", "update", "archive"],
  gallery: ["create", "read", "update", "delete"],
  spotlight: ["create", "read", "update", "delete", "publish"],
  storage: ["create", "read", "delete"],
  user: ["get", "list", "read"],
  settings: ["read"],
});

export const siteAdminRole = ac.newRole({
  announcement: ["create", "read", "update", "delete", "publish"],
  audit: ["read"],
  course: ["create", "read", "update", "delete"],
  event: ["create", "read", "update", "delete", "publish"],
  resource: ["create", "read", "update", "delete", "publish"],
  lecturer: ["create", "read", "update", "delete"],
  concern: ["create", "read", "update", "archive"],
  gallery: ["create", "read", "update", "delete"],
  spotlight: ["create", "read", "update", "delete", "publish"],
  storage: ["create", "read", "delete", "audit"],
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "impersonate-admins",
    "delete",
    "set-password",
    "set-email",
    "get",
    "read",
    "update",
    "manage_roles",
  ],
  session: ["list", "revoke", "delete"],
  settings: ["read", "update"],
});
