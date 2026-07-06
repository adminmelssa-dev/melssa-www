# MELSSA Student Portal

A Next.js student portal for MELSSA academic resources, announcements, events,
lecturer contacts, anonymous concerns, gallery items, and administrative
content management.

## Stack

- Next.js 16
- bun
- Drizzle ORM 1.0 RC
- Better Auth
- UploadThing through `src/server/storage`
- Resend or log mail through `src/server/mail`
- shadcn/Radix UI

## Commands

```bash
bun run dev
bun run check:architecture
bun run lint
bun run typecheck
bun run build
bun run auth:bootstrap-admin
```

## Environment

Start from `.env.example`.