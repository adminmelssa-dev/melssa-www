export type PermissionResource =
  | "announcement"
  | "audit"
  | "bulletin"
  | "concern"
  | "course"
  | "event"
  | "finance"
  | "fundraising"
  | "gallery"
  | "lecturer"
  | "resource"
  | "scholarship"
  | "settings"
  | "spotlight"
  | "storage"
  | "user"
  | "session";

export interface PermissionGrant {
  resource: PermissionResource;
  action: string;
}

export interface PermissionActionDefinition {
  action: string;
  label: string;
  description: string;
}

export interface PermissionResourceDefinition {
  resource: PermissionResource;
  label: string;
  description: string;
  actions: PermissionActionDefinition[];
}

export interface PermissionGroupDefinition {
  label: string;
  resources: PermissionResourceDefinition[];
}

export const PERMISSION_GROUPS: PermissionGroupDefinition[] = [
  {
    label: "Publishing",
    resources: [
      {
        resource: "announcement",
        label: "Announcements",
        description: "Create and publish association updates.",
        actions: publishingActions(),
      },
      {
        resource: "bulletin",
        label: "Bulletins",
        description: "Prepare and send weekly bulletin issues.",
        actions: [
          action("create", "Create", "Draft bulletin issues."),
          action("read", "Read", "View bulletin issues and delivery data."),
          action("update", "Update", "Edit draft bulletin issues."),
          action("send", "Send", "Send bulletins to subscribers."),
          action("archive", "Archive", "Archive bulletin issues."),
        ],
      },
      {
        resource: "event",
        label: "Events",
        description: "Manage public programmes and activities.",
        actions: publishingActions(),
      },
      {
        resource: "gallery",
        label: "Gallery",
        description: "Manage public gallery images.",
        actions: crudActions(),
      },
      {
        resource: "spotlight",
        label: "Spotlight",
        description: "Manage student spotlight stories.",
        actions: publishingActions(),
      },
    ],
  },
  {
    label: "Academic Desk",
    resources: [
      {
        resource: "resource",
        label: "Resources",
        description: "Manage academic resource uploads.",
        actions: publishingActions(),
      },
      {
        resource: "course",
        label: "Courses",
        description: "Manage course catalog metadata.",
        actions: crudActions(),
      },
      {
        resource: "lecturer",
        label: "Lecturers",
        description: "Manage lecturer directory profiles.",
        actions: crudActions(),
      },
    ],
  },
  {
    label: "Student Support",
    resources: [
      {
        resource: "concern",
        label: "Concerns",
        description: "Review anonymous student concerns.",
        actions: [
          action("create", "Create", "Submit concerns."),
          action("read", "Read", "View concern submissions."),
          action("update", "Update", "Review and resolve concerns."),
          action("archive", "Archive", "Archive concern records."),
        ],
      },
      // Scholarship management is built but hidden until MELSSA asks for it.
      // {
      //   resource: "scholarship",
      //   label: "Scholarships",
      //   description: "Manage scholarship programme information.",
      //   actions: publishingActions(),
      // },
    ],
  },
  {
    label: "Finance Desk",
    resources: [
      {
        resource: "finance",
        label: "Finance reports",
        description: "Manage public financial accountability documents.",
        actions: publishingActions(),
      },
      {
        resource: "fundraising",
        label: "Fundraising",
        description: "Manage fundraising campaigns and sponsor inquiries.",
        actions: [
          ...publishingActions(),
          action("respond", "Respond", "Review and respond to sponsor inquiries."),
        ],
      },
    ],
  },
  {
    label: "Administration",
    resources: [
      {
        resource: "audit",
        label: "Audit log",
        description: "View administrative audit history.",
        actions: [action("read", "Read", "View audit log entries.")],
      },
      {
        resource: "storage",
        label: "Storage",
        description: "Manage uploaded storage objects.",
        actions: [
          action("create", "Create", "Upload storage objects."),
          action("read", "Read", "View storage objects."),
          action("delete", "Delete", "Delete storage objects."),
          action("audit", "Audit", "View storage audit details."),
        ],
      },
      {
        resource: "settings",
        label: "Settings",
        description: "Manage portal configuration.",
        actions: [
          action("read", "Read", "View portal settings."),
          action("update", "Update", "Update portal settings."),
        ],
      },
      {
        resource: "user",
        label: "Users",
        description: "Manage account access and administrative grants.",
        actions: [
          action("create", "Create", "Create user accounts."),
          action("list", "List", "List user accounts."),
          action("read", "Read", "View user account details."),
          action("get", "Get", "Retrieve a user account."),
          action("update", "Update", "Update user account metadata."),
          action("set-role", "Set role", "Change a user's base role."),
          action("manage-permissions", "Manage permissions", "Grant or revoke direct permissions."),
          action("ban", "Restrict", "Restrict or restore user access."),
          action("impersonate", "Impersonate", "Impersonate users for support."),
          action("impersonate-admins", "Impersonate admins", "Impersonate administrative accounts."),
          action("delete", "Delete", "Delete user accounts."),
          action("set-password", "Set password", "Set user passwords."),
          action("set-email", "Set email", "Set user emails."),
          action("manage_roles", "Manage Better Auth roles", "Manage provider role metadata."),
        ],
      },
      {
        resource: "session",
        label: "Sessions",
        description: "Manage active account sessions.",
        actions: [
          action("list", "List", "List active sessions."),
          action("revoke", "Revoke", "Revoke active sessions."),
          action("delete", "Delete", "Delete session records."),
        ],
      },
    ],
  },
];

export function createPermissionKey({
  action,
  resource,
}: PermissionGrant): string {
  return `${resource}.${action}`;
}

export function getAllPermissionDefinitions(): PermissionResourceDefinition[] {
  return PERMISSION_GROUPS.flatMap((group) => group.resources);
}

export function getAllPermissionKeys(): string[] {
  return getAllPermissionDefinitions().flatMap((resource) =>
    resource.actions.map((item) =>
      createPermissionKey({
        action: item.action,
        resource: resource.resource,
      }),
    ),
  );
}

export function isPermissionResource(
  value: string,
): value is PermissionResource {
  return getAllPermissionDefinitions().some(
    (definition) => definition.resource === value,
  );
}

export function isPermissionActionForResource({
  action,
  resource,
}: PermissionGrant): boolean {
  const definition = getAllPermissionDefinitions().find(
    (item) => item.resource === resource,
  );

  return definition
    ? definition.actions.some((item) => item.action === action)
    : false;
}

function action(
  actionValue: string,
  label: string,
  description: string,
): PermissionActionDefinition {
  return {
    action: actionValue,
    description,
    label,
  };
}

function crudActions(): PermissionActionDefinition[] {
  return [
    action("create", "Create", "Create records."),
    action("read", "Read", "View records."),
    action("update", "Update", "Edit records."),
    action("delete", "Delete", "Delete records."),
  ];
}

function publishingActions(): PermissionActionDefinition[] {
  return [
    ...crudActions(),
    action("publish", "Publish", "Publish records to public pages."),
  ];
}
