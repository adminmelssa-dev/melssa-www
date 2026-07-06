"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Fingerprint,
  KeyRound,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PasskeyListItem } from "@/modules/profile/contracts";
import { authClient } from "@/modules/auth/client";

interface PasskeyManagerProps {
  passkeys: PasskeyListItem[];
}

function passkeysAreAvailable(): boolean {
  return typeof window !== "undefined" && "PublicKeyCredential" in window;
}

export function PasskeyManager({ passkeys }: PasskeyManagerProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [renameTarget, setRenameTarget] = useState<PasskeyListItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PasskeyListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleAdd() {
    if (!passkeysAreAvailable()) {
      toast.error("This browser does not support passkeys.");
      return;
    }

    setAdding(true);

    try {
      const result = await authClient.passkey.addPasskey({
        name: "MELSSA passkey",
      });

      if (result.error) {
        toast.error(result.error.message ?? "Passkey setup failed.");
        setAdding(false);
        return;
      }

      toast.success("Passkey added.");
      setAdding(false);
      router.refresh();
    } catch {
      toast.error("Passkey setup was cancelled.");
      setAdding(false);
    }
  }

  function openRename(passkey: PasskeyListItem) {
    setRenameValue(passkey.label);
    setRenameTarget(passkey);
  }

  async function handleRename() {
    if (!renameTarget) return;

    const name = renameValue.trim();
    if (name.length === 0) return;

    setRenaming(true);

    const result = await authClient.passkey.updatePasskey({
      id: renameTarget.id,
      name,
    });

    if (result.error) {
      toast.error(result.error.message ?? "Passkey rename failed.");
      setRenaming(false);
      return;
    }

    toast.success("Passkey renamed.");
    setRenameTarget(null);
    setRenaming(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);

    const result = await authClient.passkey.deletePasskey({
      id: deleteTarget.id,
    });

    if (result.error) {
      toast.error(result.error.message ?? "Passkey removal failed.");
      setDeleting(false);
      return;
    }

    toast.success("Passkey removed.");
    setDeleteTarget(null);
    setDeleting(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <Fingerprint className="size-4" />
            </span>
            <div>
              <CardTitle>Passkeys</CardTitle>
              <p className="text-sm text-muted-foreground">
                Sign in with your device, browser, or security key.
              </p>
            </div>
          </div>
          {passkeys.length > 0 ? (
            <Button onClick={handleAdd} disabled={adding} size="sm">
              {adding ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {adding ? "Waiting..." : "Add passkey"}
            </Button>
          ) : null}
        </div>
      </CardHeader>

      {passkeys.length === 0 ? (
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ShieldCheck className="size-6" />
            </span>
            <div>
              <p className="font-medium">No passkeys yet</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Add a passkey to sign in faster without relying only on your
                password.
              </p>
            </div>
            <Button onClick={handleAdd} disabled={adding}>
              {adding ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {adding ? "Waiting..." : "Add passkey"}
            </Button>
          </div>
        </CardContent>
      ) : (
        <>
          <CardContent className="p-0">
            <ul className="divide-y">
              {passkeys.map((passkey) => (
                <li
                  className="flex items-center gap-3 px-4 py-3.5"
                  key={passkey.id}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    {passkey.backedUp ? (
                      <Fingerprint className="size-4" />
                    ) : (
                      <KeyRound className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{passkey.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {passkey.backedUp ? "Synced" : "Device-bound"} · Added{" "}
                      {passkey.createdAtLabel}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="size-8" size="icon" variant="ghost">
                        <MoreVertical className="size-4" />
                        <span className="sr-only">Passkey actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => openRename(passkey)}>
                        <Pencil className="size-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => setDeleteTarget(passkey)}
                      >
                        <Trash2 className="size-4" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Removing a passkey only affects sign-in with that credential.
          </CardFooter>
        </>
      )}

      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename passkey</DialogTitle>
            <DialogDescription>
              Give this passkey a label you will recognize later.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleRename();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="passkey-name">Name</Label>
              <Input
                id="passkey-name"
                maxLength={64}
                onChange={(event) => setRenameValue(event.currentTarget.value)}
                value={renameValue}
              />
            </div>
            <DialogFooter>
              <Button
                disabled={renaming}
                onClick={() => setRenameTarget(null)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={renaming || renameValue.trim().length === 0}>
                {renaming ? <Loader2 className="size-4 animate-spin" /> : null}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove passkey?</DialogTitle>
            <DialogDescription>
              This passkey will no longer be able to sign in to your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={deleting}
              onClick={() => void handleDelete()}
              type="button"
              variant="destructive"
            >
              {deleting ? <Loader2 className="size-4 animate-spin" /> : null}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
