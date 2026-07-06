"use client";

import * as React from "react";
import {
  FileUp,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  getStorageEndpointConfig,
  isAcceptedFile,
  type StorageEndpoint,
} from "@/lib/storage/endpoints";
import { formatBytes } from "@/lib/format-bytes";
import {
  uploadStorageFile,
  type UploadedStorageObject,
} from "@/lib/uploadthing";

interface StorageUploadFieldProps {
  endpoint: StorageEndpoint;
  label: string;
  value: UploadedStorageObject | null;
  onChange: (value: UploadedStorageObject | null) => void;
  disabled?: boolean;
}

export function StorageUploadField({
  endpoint,
  label,
  value,
  onChange,
  disabled = false,
}: StorageUploadFieldProps) {
  const inputId = React.useId();
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const config = getStorageEndpointConfig(endpoint);
  const accept = config.acceptedExtensions.join(",");

  async function uploadFile(file: File): Promise<void> {
    if (file.size > config.maxFileSizeBytes) {
      toast.error(`${file.name} is larger than ${config.maxFileSize}.`);
      return;
    }

    if (
      !isAcceptedFile({
        name: file.name,
        mimeType: file.type,
        config,
      })
    ) {
      toast.error(`${file.name} is not an accepted file type.`);
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const uploaded = await uploadStorageFile({
        endpoint,
        file,
        onProgress: setProgress,
      });
      onChange(uploaded);
      toast.success(`${file.name} uploaded.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "File upload failed.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium" htmlFor={inputId}>
          {label}
        </label>
        <span className="text-xs text-muted-foreground">
          Max {config.maxFileSize}
        </span>
      </div>

      <div className="rounded-lg border border-dashed bg-muted/20 p-3">
        {value ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <FileUp className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{value.objectKey}</p>
              <a
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                href={value.publicUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open uploaded file
              </a>
            </div>
            <Button
              aria-label="Remove uploaded file"
              disabled={disabled || isUploading}
              onClick={() => onChange(null)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              {isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileUp className="size-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <Input
                accept={accept}
                disabled={disabled || isUploading}
                id={inputId}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = "";
                  if (file) void uploadFile(file);
                }}
                type="file"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {config.acceptedExtensions.join(", ")} up to{" "}
                {formatBytes(config.maxFileSizeBytes)}
              </p>
            </div>
          </div>
        )}

        {isUploading ? (
          <div className="mt-3 space-y-1">
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground">
              Uploading {Math.round(progress)}%
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
