"use client";

import * as React from "react";
import {
  Archive,
  BadgeDollarSign,
  Edit3,
  Inbox,
  Mail,
  MoreHorizontal,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { useServerDataTable } from "@/components/data-table/use-server-data-table";
import { StorageUploadField } from "@/components/storage/upload-field";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  contentStatusSchema,
  type ContentStatus,
} from "@/modules/content/contracts";
import {
  CONTENT_STATUS_LABELS,
  CONTENT_STATUS_OPTIONS,
  FUNDRAISING_INQUIRY_STATUS_LABELS,
  FUNDRAISING_INQUIRY_STATUS_OPTIONS,
  adminFundraisingMutationSchema,
  adminFundraisingCampaignsResponseSchema,
  adminFundraisingInquiriesResponseSchema,
  createFundraisingCampaignInputSchema,
  fundraisingInquiryStatusSchema,
  updateFundraisingCampaignInputSchema,
  updateFundraisingInquiryInputSchema,
  type AdminFundraisingMutation,
  type CreateFundraisingCampaignInput,
  type FundraisingCampaignRow,
  type FundraisingInquiryRow,
  type FundraisingInquiryStatus,
} from "@/modules/fundraising/contracts";
import {
  actionResultSchema,
  type ActionResult,
} from "@/lib/action-result";
import type { DataTablePageMeta } from "@/lib/data-table-query";
import type { UploadedStorageObject } from "@/lib/uploadthing";

const adminFundraisingQueryKey = ["admin-fundraising"];

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

interface PaymentMethodFormValue {
  label: string;
  accountName: string;
  accountNumber: string;
  network: string;
  instructions: string;
}

interface SponsorshipTierFormValue {
  name: string;
  amountLabel: string;
  benefits: string;
}

interface FundraisingCampaignFormValues {
  title: string;
  slug: string;
  summary: string;
  body: string;
  status: ContentStatus;
  goalAmount: string;
  currency: string;
  startsAt: string;
  endsAt: string;
  paymentInstructions: string;
  paymentMethods: PaymentMethodFormValue[];
  sponsorshipTiers: SponsorshipTierFormValue[];
  cover: UploadedStorageObject | null;
}

interface InquiryFormValues {
  status: FundraisingInquiryStatus;
  internalNotes: string;
}

interface FundraisingAdminTablesProps {
  campaigns: FundraisingCampaignRow[];
  campaignMeta: DataTablePageMeta;
  inquiries: FundraisingInquiryRow[];
  inquiryMeta: DataTablePageMeta;
  permissions: FundraisingTablePermissions;
}

interface FundraisingTablePermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canPublish: boolean;
  canRespond: boolean;
}

type AmountParseResult =
  | { ok: true; value: number | null }
  | { ok: false; message: string };

export function FundraisingAdminTables({
  campaigns,
  campaignMeta,
  inquiries,
  inquiryMeta,
  permissions,
}: FundraisingAdminTablesProps) {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingCampaign, setEditingCampaign] =
    React.useState<FundraisingCampaignRow | null>(null);
  const [deletingCampaign, setDeletingCampaign] =
    React.useState<FundraisingCampaignRow | null>(null);
  const [reviewingInquiry, setReviewingInquiry] =
    React.useState<FundraisingInquiryRow | null>(null);
  const queryClient = useQueryClient();
  const campaignTable = useServerDataTable();
  const inquiryTable = useServerDataTable();
  const setCampaignPageMeta = campaignTable.setPageMeta;
  const setInquiryPageMeta = inquiryTable.setPageMeta;

  const campaignsQuery = useQuery({
    queryKey: [...adminFundraisingQueryKey, "campaigns", campaignTable.queryKey],
    queryFn: () => fetchAdminFundraisingCampaigns(campaignTable.searchParams),
    initialData: { campaigns, meta: campaignMeta },
  });

  const inquiriesQuery = useQuery({
    queryKey: [...adminFundraisingQueryKey, "inquiries", inquiryTable.queryKey],
    queryFn: () => fetchAdminFundraisingInquiries(inquiryTable.searchParams),
    initialData: { inquiries, meta: inquiryMeta },
  });

  React.useEffect(() => {
    setCampaignPageMeta({
      pageCount: campaignsQuery.data.meta.pageCount,
      totalRows: campaignsQuery.data.meta.totalRows,
    });
  }, [
    campaignsQuery.data.meta.pageCount,
    campaignsQuery.data.meta.totalRows,
    setCampaignPageMeta,
  ]);

  React.useEffect(() => {
    setInquiryPageMeta({
      pageCount: inquiriesQuery.data.meta.pageCount,
      totalRows: inquiriesQuery.data.meta.totalRows,
    });
  }, [
    inquiriesQuery.data.meta.pageCount,
    inquiriesQuery.data.meta.totalRows,
    setInquiryPageMeta,
  ]);

  const deleteMutation = useMutation({
    mutationFn: deleteAdminFundraisingCampaign,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      setDeletingCampaign(null);
      await queryClient.invalidateQueries({ queryKey: adminFundraisingQueryKey });
    },
  });

  const campaignColumns = React.useMemo(
    () =>
      getCampaignColumns({
        onDelete: setDeletingCampaign,
        onEdit: setEditingCampaign,
        permissions,
      }),
    [permissions],
  );

  const inquiryColumns = React.useMemo(
    () =>
      getInquiryColumns({
        onReview: setReviewingInquiry,
        permissions,
      }),
    [permissions],
  );

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl">Campaigns</h2>
          {permissions.canCreate ? (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="size-4" />
              New campaign
            </Button>
          ) : null}
        </div>
        <DataTable
          columns={campaignColumns}
          data={campaignsQuery.data.campaigns}
          emptyState={
            <EmptyTableState
              icon={BadgeDollarSign}
              message="Published campaigns will appear on the public site."
              title="No fundraising campaigns found"
            />
          }
          filters={[
            {
              columnId: "status",
              options: CONTENT_STATUS_OPTIONS,
              title: "Status",
            },
          ]}
          getRowId={(campaign) => String(campaign.id)}
          searchPlaceholder="Search campaigns..."
          serverState={campaignTable.state}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl">Sponsor inquiries</h2>
        <DataTable
          columns={inquiryColumns}
          data={inquiriesQuery.data.inquiries}
          emptyState={
            <EmptyTableState
              icon={Mail}
              message="Public sponsorship inquiries will appear here."
              title="No inquiries found"
            />
          }
          filters={[
            {
              columnId: "status",
              options: FUNDRAISING_INQUIRY_STATUS_OPTIONS,
              title: "Status",
            },
          ]}
          getRowId={(inquiry) => String(inquiry.id)}
          searchPlaceholder="Search inquiries..."
          serverState={inquiryTable.state}
        />
      </section>

      <FundraisingCampaignDialog
        key="create-fundraising-campaign"
        mode="create"
        onOpenChange={setIsCreateOpen}
        open={isCreateOpen}
        permissions={permissions}
      />

      {editingCampaign && permissions.canUpdate ? (
        <FundraisingCampaignDialog
          campaign={editingCampaign}
          key={`edit-${editingCampaign.id}`}
          mode="edit"
          onOpenChange={(open) => {
            if (!open) setEditingCampaign(null);
          }}
          open
          permissions={permissions}
        />
      ) : null}

      <DeleteFundraisingCampaignDialog
        campaign={deletingCampaign}
        isPending={deleteMutation.isPending}
        onDelete={(campaignId) => deleteMutation.mutate({ campaignId })}
        onOpenChange={(open) => {
          if (!open) setDeletingCampaign(null);
        }}
      />

      {reviewingInquiry && permissions.canRespond ? (
        <InquiryDialog
          inquiry={reviewingInquiry}
          onOpenChange={(open) => {
            if (!open) setReviewingInquiry(null);
          }}
          open
        />
      ) : null}
    </div>
  );
}

function getCampaignColumns({
  onDelete,
  onEdit,
  permissions,
}: {
  onDelete: (campaign: FundraisingCampaignRow) => void;
  onEdit: (campaign: FundraisingCampaignRow) => void;
  permissions: FundraisingTablePermissions;
}): ColumnDef<FundraisingCampaignRow>[] {
  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Campaign" />
      ),
      cell: ({ row }) => (
        <div className="min-w-64 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{row.original.title}</span>
            <FundraisingStatusBadge status={row.original.status} />
          </div>
          <p className="text-muted-foreground">/{row.original.slug}</p>
        </div>
      ),
      meta: { label: "Campaign", className: "min-w-64" },
    },
    {
      accessorKey: "status",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <FundraisingStatusBadge status={row.original.status} />,
      meta: { label: "Status" },
    },
    {
      accessorKey: "inquiryCount",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Inquiries" />
      ),
      cell: ({ row }) => row.original.inquiryCount,
      meta: { label: "Inquiries" },
    },
    {
      accessorKey: "updatedAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Updated" />
      ),
      cell: ({ row }) => formatDate(row.original.updatedAt),
      sortingFn: nullableDateSort,
      meta: { label: "Updated" },
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => null,
      cell: ({ row }) => (
        <CampaignRowActions
          campaign={row.original}
          onDelete={onDelete}
          onEdit={onEdit}
          permissions={permissions}
        />
      ),
      meta: { className: "w-12" },
    },
  ];
}

function getInquiryColumns({
  onReview,
  permissions,
}: {
  onReview: (inquiry: FundraisingInquiryRow) => void;
  permissions: FundraisingTablePermissions;
}): ColumnDef<FundraisingInquiryRow>[] {
  return [
    {
      accessorKey: "contactName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact" />
      ),
      cell: ({ row }) => (
        <div className="min-w-60 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{row.original.contactName}</span>
            <InquiryStatusBadge status={row.original.status} />
          </div>
          <p className="break-all text-muted-foreground">
            {row.original.contactEmail}
          </p>
        </div>
      ),
      meta: { label: "Contact", className: "min-w-60" },
    },
    {
      accessorKey: "status",
      filterFn: stringArrayFilter,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <InquiryStatusBadge status={row.original.status} />,
      meta: { label: "Status" },
    },
    {
      accessorFn: (row) => row.campaign?.title ?? "General inquiry",
      id: "campaignTitle",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Campaign" />
      ),
      cell: ({ row }) => row.original.campaign?.title ?? "General inquiry",
      meta: { label: "Campaign" },
    },
    {
      accessorKey: "createdAt",
      enableGlobalFilter: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Received" />
      ),
      cell: ({ row }) => formatDate(row.original.createdAt),
      sortingFn: nullableDateSort,
      meta: { label: "Received" },
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => null,
      cell: ({ row }) => (
        <InquiryRowActions
          inquiry={row.original}
          onReview={onReview}
          permissions={permissions}
        />
      ),
      meta: { className: "w-12" },
    },
  ];
}

function CampaignRowActions({
  campaign,
  onDelete,
  onEdit,
  permissions,
}: {
  campaign: FundraisingCampaignRow;
  onDelete: (campaign: FundraisingCampaignRow) => void;
  onEdit: (campaign: FundraisingCampaignRow) => void;
  permissions: FundraisingTablePermissions;
}) {
  const hasActions = permissions.canUpdate || permissions.canDelete;
  if (!hasActions) return null;

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="size-8" size="icon" variant="ghost">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {permissions.canUpdate ? (
            <DropdownMenuItem onSelect={() => onEdit(campaign)}>
              <Edit3 className="size-4" />
              Edit campaign
            </DropdownMenuItem>
          ) : null}
          {permissions.canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => onDelete(campaign)}
                variant="destructive"
              >
                <Trash2 className="size-4" />
                Delete campaign
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function InquiryRowActions({
  inquiry,
  onReview,
  permissions,
}: {
  inquiry: FundraisingInquiryRow;
  onReview: (inquiry: FundraisingInquiryRow) => void;
  permissions: FundraisingTablePermissions;
}) {
  if (!permissions.canRespond) return null;

  return (
    <div className="flex justify-end">
      <Button
        className="size-8"
        onClick={() => onReview(inquiry)}
        size="icon"
        type="button"
        variant="ghost"
      >
        <Inbox className="size-4" />
        <span className="sr-only">Review inquiry</span>
      </Button>
    </div>
  );
}

function FundraisingCampaignDialog({
  campaign,
  mode,
  onOpenChange,
  open,
  permissions,
}: {
  campaign?: FundraisingCampaignRow;
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  open: boolean;
  permissions: FundraisingTablePermissions;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New campaign" : "Edit campaign"}
          </DialogTitle>
          <DialogDescription>
            Campaigns can include external payment instructions and sponsorship
            tiers without tying the portal to a payment processor.
          </DialogDescription>
        </DialogHeader>
        <FundraisingCampaignForm
          campaign={campaign}
          mode={mode}
          onSaved={() => onOpenChange(false)}
          permissions={permissions}
        />
      </DialogContent>
    </Dialog>
  );
}

function FundraisingCampaignForm({
  campaign,
  mode,
  onSaved,
  permissions,
}: {
  campaign?: FundraisingCampaignRow;
  mode: "create" | "edit";
  onSaved: () => void;
  permissions: FundraisingTablePermissions;
}) {
  const [values, setValues] = React.useState<FundraisingCampaignFormValues>(
    () => getInitialCampaignFormValues(campaign),
  );
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createAdminFundraisingCampaign,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: adminFundraisingQueryKey });
      onSaved();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateAdminFundraisingMutation,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: adminFundraisingQueryKey });
      onSaved();
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function submitCampaign(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const parsedAmount = parseGoalAmountMinor(values.goalAmount);
    if (!parsedAmount.ok) {
      toast.error(parsedAmount.message);
      return;
    }

    const input = {
      title: values.title,
      slug: values.slug,
      summary: values.summary,
      body: values.body,
      status: values.status,
      goalAmountMinor: parsedAmount.value,
      currency: values.currency,
      startsAt: toIsoDateTime(values.startsAt),
      endsAt: toIsoDateTime(values.endsAt),
      paymentInstructions: values.paymentInstructions,
      paymentMethods: values.paymentMethods
        .filter((method) => method.label.trim().length > 0)
        .map((method) => ({
          accountName: method.accountName,
          accountNumber: method.accountNumber,
          instructions: method.instructions,
          label: method.label,
          network: method.network,
        })),
      sponsorshipTiers: values.sponsorshipTiers
        .filter((tier) => tier.name.trim().length > 0)
        .map((tier) => ({
          amountLabel: tier.amountLabel,
          benefits: splitLines(tier.benefits),
          name: tier.name,
        })),
      coverStorageObjectId: values.cover?.id ?? null,
    };

    if (mode === "create") {
      const parsedInput = createFundraisingCampaignInputSchema.safeParse(input);

      if (!parsedInput.success) {
        toast.error(
          parsedInput.error.issues[0]?.message ??
            "Check the fundraising campaign details.",
        );
        return;
      }

      createMutation.mutate(parsedInput.data);
      return;
    }

    if (!campaign) {
      toast.error("Fundraising campaign not found.");
      return;
    }

    const parsedInput = updateFundraisingCampaignInputSchema.safeParse({
      ...input,
      campaignId: campaign.id,
    });

    if (!parsedInput.success) {
      toast.error(
        parsedInput.error.issues[0]?.message ??
          "Check the fundraising campaign details.",
      );
      return;
    }

    updateMutation.mutate({
      payload: parsedInput.data,
      type: "campaign",
    });
  }

  function updateStatus(value: string): void {
    const parsedStatus = contentStatusSchema.safeParse(value);
    if (!parsedStatus.success) return;

    setValues((current) => ({ ...current, status: parsedStatus.data }));
  }

  return (
    <form className="space-y-6" onSubmit={submitCampaign}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fundraising-title">Title</Label>
          <Input
            id="fundraising-title"
            maxLength={255}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                title: event.currentTarget.value,
              }))
            }
            placeholder="Lab Equipment Support"
            value={values.title}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fundraising-slug">Slug</Label>
          <Input
            id="fundraising-slug"
            maxLength={180}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                slug: event.currentTarget.value,
              }))
            }
            placeholder="lab-equipment-support"
            value={values.slug}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fundraising-status">Status</Label>
          <Select onValueChange={updateStatus} value={values.status}>
            <SelectTrigger id="fundraising-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_STATUS_OPTIONS.map((option) => (
                <SelectItem
                  disabled={
                    option.value === "published" && !permissions.canPublish
                  }
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fundraising-goal">Goal amount</Label>
          <Input
            id="fundraising-goal"
            inputMode="decimal"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                goalAmount: event.currentTarget.value,
              }))
            }
            placeholder="5000.00"
            value={values.goalAmount}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fundraising-currency">Currency</Label>
          <Input
            id="fundraising-currency"
            maxLength={3}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                currency: event.currentTarget.value,
              }))
            }
            placeholder="GHS"
            value={values.currency}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fundraising-starts">Starts</Label>
          <Input
            id="fundraising-starts"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                startsAt: event.currentTarget.value,
              }))
            }
            type="date"
            value={values.startsAt}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fundraising-ends">Ends</Label>
          <Input
            id="fundraising-ends"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                endsAt: event.currentTarget.value,
              }))
            }
            type="date"
            value={values.endsAt}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fundraising-summary">Summary</Label>
        <Textarea
          id="fundraising-summary"
          maxLength={1_000}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              summary: event.currentTarget.value,
            }))
          }
          placeholder="Short public preview"
          value={values.summary}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fundraising-body">Body</Label>
        <Textarea
          className="min-h-36"
          id="fundraising-body"
          maxLength={20_000}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              body: event.currentTarget.value,
            }))
          }
          placeholder="Campaign story, use of funds, and accountability plan"
          value={values.body}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fundraising-payment-instructions">
          Payment instructions
        </Label>
        <Textarea
          id="fundraising-payment-instructions"
          maxLength={2_000}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              paymentInstructions: event.currentTarget.value,
            }))
          }
          placeholder="External payment instructions such as mobile money references"
          value={values.paymentInstructions}
        />
      </div>

      <PaymentMethodsEditor
        disabled={isPending}
        onChange={(paymentMethods) =>
          setValues((current) => ({ ...current, paymentMethods }))
        }
        paymentMethods={values.paymentMethods}
      />

      <SponsorshipTiersEditor
        disabled={isPending}
        onChange={(sponsorshipTiers) =>
          setValues((current) => ({ ...current, sponsorshipTiers }))
        }
        sponsorshipTiers={values.sponsorshipTiers}
      />

      <StorageUploadField
        disabled={isPending}
        endpoint="fundraisingCoverImage"
        label="Campaign cover"
        onChange={(cover) =>
          setValues((current) => ({
            ...current,
            cover,
          }))
        }
        value={values.cover}
      />

      <DialogFooter>
        <Button disabled={isPending} type="submit">
          {mode === "create" ? "Create campaign" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function PaymentMethodsEditor({
  disabled,
  onChange,
  paymentMethods,
}: {
  disabled: boolean;
  onChange: (paymentMethods: PaymentMethodFormValue[]) => void;
  paymentMethods: PaymentMethodFormValue[];
}) {
  function updateMethod(
    index: number,
    field: keyof PaymentMethodFormValue,
    value: string,
  ): void {
    onChange(
      paymentMethods.map((method, currentIndex) =>
        currentIndex === index ? { ...method, [field]: value } : method,
      ),
    );
  }

  return (
    <section className="space-y-3 rounded-md border border-hairline p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-medium">Payment methods</h3>
          <p className="text-sm text-muted-foreground">
            External account details students and sponsors can use.
          </p>
        </div>
        <Button
          disabled={disabled}
          onClick={() => onChange([...paymentMethods, emptyPaymentMethod()])}
          type="button"
          variant="outline"
        >
          <Plus className="size-4" />
          Add method
        </Button>
      </div>

      {paymentMethods.map((method, index) => (
        <div className="grid gap-3 rounded-md bg-muted/30 p-3" key={index}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Method {index + 1}</p>
            <Button
              disabled={disabled}
              onClick={() =>
                onChange(paymentMethods.filter((_, itemIndex) => itemIndex !== index))
              }
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Remove payment method</span>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              disabled={disabled}
              maxLength={120}
              onChange={(event) =>
                updateMethod(index, "label", event.currentTarget.value)
              }
              placeholder="MTN Mobile Money"
              value={method.label}
            />
            <Input
              disabled={disabled}
              maxLength={120}
              onChange={(event) =>
                updateMethod(index, "network", event.currentTarget.value)
              }
              placeholder="Network or bank"
              value={method.network}
            />
            <Input
              disabled={disabled}
              maxLength={160}
              onChange={(event) =>
                updateMethod(index, "accountName", event.currentTarget.value)
              }
              placeholder="Account name"
              value={method.accountName}
            />
            <Input
              disabled={disabled}
              maxLength={120}
              onChange={(event) =>
                updateMethod(index, "accountNumber", event.currentTarget.value)
              }
              placeholder="Account number"
              value={method.accountNumber}
            />
          </div>
          <Textarea
            disabled={disabled}
            maxLength={500}
            onChange={(event) =>
              updateMethod(index, "instructions", event.currentTarget.value)
            }
            placeholder="Reference or extra instructions"
            value={method.instructions}
          />
        </div>
      ))}
    </section>
  );
}

function SponsorshipTiersEditor({
  disabled,
  onChange,
  sponsorshipTiers,
}: {
  disabled: boolean;
  onChange: (tiers: SponsorshipTierFormValue[]) => void;
  sponsorshipTiers: SponsorshipTierFormValue[];
}) {
  function updateTier(
    index: number,
    field: keyof SponsorshipTierFormValue,
    value: string,
  ): void {
    onChange(
      sponsorshipTiers.map((tier, currentIndex) =>
        currentIndex === index ? { ...tier, [field]: value } : tier,
      ),
    );
  }

  return (
    <section className="space-y-3 rounded-md border border-hairline p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-medium">Sponsorship tiers</h3>
          <p className="text-sm text-muted-foreground">
            Optional sponsor packages shown on the public campaign page.
          </p>
        </div>
        <Button
          disabled={disabled}
          onClick={() => onChange([...sponsorshipTiers, emptySponsorTier()])}
          type="button"
          variant="outline"
        >
          <Plus className="size-4" />
          Add tier
        </Button>
      </div>

      {sponsorshipTiers.map((tier, index) => (
        <div className="grid gap-3 rounded-md bg-muted/30 p-3" key={index}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Tier {index + 1}</p>
            <Button
              disabled={disabled}
              onClick={() =>
                onChange(
                  sponsorshipTiers.filter(
                    (_, itemIndex) => itemIndex !== index,
                  ),
                )
              }
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Remove sponsorship tier</span>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              disabled={disabled}
              maxLength={120}
              onChange={(event) =>
                updateTier(index, "name", event.currentTarget.value)
              }
              placeholder="Gold Sponsor"
              value={tier.name}
            />
            <Input
              disabled={disabled}
              maxLength={120}
              onChange={(event) =>
                updateTier(index, "amountLabel", event.currentTarget.value)
              }
              placeholder="GHS 5,000+"
              value={tier.amountLabel}
            />
          </div>
          <Textarea
            disabled={disabled}
            onChange={(event) =>
              updateTier(index, "benefits", event.currentTarget.value)
            }
            placeholder="One benefit per line"
            value={tier.benefits}
          />
        </div>
      ))}
    </section>
  );
}

function DeleteFundraisingCampaignDialog({
  campaign,
  isPending,
  onDelete,
  onOpenChange,
}: {
  campaign: FundraisingCampaignRow | null;
  isPending: boolean;
  onDelete: (campaignId: number) => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={campaign !== null}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete campaign</DialogTitle>
          <DialogDescription>
            {campaign
              ? `${campaign.title} will be removed from fundraising pages.`
              : "This campaign will be removed from fundraising pages."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={!campaign || isPending}
            onClick={() => {
              if (campaign) onDelete(campaign.id);
            }}
            type="button"
            variant="destructive"
          >
            Delete campaign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InquiryDialog({
  inquiry,
  onOpenChange,
  open,
}: {
  inquiry: FundraisingInquiryRow;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review sponsor inquiry</DialogTitle>
          <DialogDescription>
            Track internal follow-up without exposing notes publicly.
          </DialogDescription>
        </DialogHeader>
        <InquiryForm inquiry={inquiry} onSaved={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function InquiryForm({
  inquiry,
  onSaved,
}: {
  inquiry: FundraisingInquiryRow;
  onSaved: () => void;
}) {
  const [values, setValues] = React.useState<InquiryFormValues>({
    internalNotes: inquiry.internalNotes ?? "",
    status: inquiry.status,
  });
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: updateAdminFundraisingMutation,
    onError(error) {
      toast.error(error.message);
    },
    async onSuccess(result) {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: adminFundraisingQueryKey });
      onSaved();
    },
  });

  function submitInquiry(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const parsedInput = updateFundraisingInquiryInputSchema.safeParse({
      inquiryId: inquiry.id,
      internalNotes: values.internalNotes,
      status: values.status,
    });

    if (!parsedInput.success) {
      toast.error(
        parsedInput.error.issues[0]?.message ??
          "Check the inquiry review details.",
      );
      return;
    }

    updateMutation.mutate({
      payload: parsedInput.data,
      type: "inquiry",
    });
  }

  function updateStatus(value: string): void {
    const parsedStatus = fundraisingInquiryStatusSchema.safeParse(value);
    if (!parsedStatus.success) return;

    setValues((current) => ({ ...current, status: parsedStatus.data }));
  }

  return (
    <form className="space-y-5" onSubmit={submitInquiry}>
      <div className="rounded-md border border-hairline bg-paper-2 p-4 text-sm leading-6">
        <p className="font-medium">{inquiry.contactName}</p>
        <p className="text-muted-foreground">{inquiry.contactEmail}</p>
        {inquiry.phone ? (
          <p className="text-muted-foreground">{inquiry.phone}</p>
        ) : null}
        {inquiry.organizationName ? (
          <p className="text-muted-foreground">{inquiry.organizationName}</p>
        ) : null}
        <p className="mt-3 whitespace-pre-wrap">{inquiry.message}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fundraising-inquiry-status">Status</Label>
        <Select onValueChange={updateStatus} value={values.status}>
          <SelectTrigger id="fundraising-inquiry-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FUNDRAISING_INQUIRY_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fundraising-inquiry-notes">Internal notes</Label>
        <Textarea
          className="min-h-32"
          id="fundraising-inquiry-notes"
          maxLength={2_000}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              internalNotes: event.currentTarget.value,
            }))
          }
          placeholder="Private follow-up notes"
          value={values.internalNotes}
        />
      </div>

      <DialogFooter>
        <Button
          asChild
          disabled={updateMutation.isPending}
          type="button"
          variant="outline"
        >
          <a href={`mailto:${inquiry.contactEmail}`}>
            <Mail className="size-4" />
            Email contact
          </a>
        </Button>
        <Button disabled={updateMutation.isPending} type="submit">
          Save review
        </Button>
      </DialogFooter>
    </form>
  );
}

function EmptyTableState({
  icon: Icon,
  message,
  title,
}: {
  icon: typeof BadgeDollarSign;
  message: string;
  title: string;
}) {
  return (
    <div className="flex h-44 flex-col items-center justify-center gap-1 text-center">
      <Icon className="size-8 text-muted-foreground/40" />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

function FundraisingStatusBadge({ status }: { status: ContentStatus }) {
  if (status === "published") {
    return <Badge>{CONTENT_STATUS_LABELS[status]}</Badge>;
  }

  if (status === "archived") {
    return (
      <Badge variant="secondary">
        <Archive className="size-3" />
        {CONTENT_STATUS_LABELS[status]}
      </Badge>
    );
  }

  return <Badge variant="outline">{CONTENT_STATUS_LABELS[status]}</Badge>;
}

function InquiryStatusBadge({ status }: { status: FundraisingInquiryStatus }) {
  if (status === "responded") {
    return (
      <Badge>
        <Send className="size-3" />
        {FUNDRAISING_INQUIRY_STATUS_LABELS[status]}
      </Badge>
    );
  }

  if (status === "archived") {
    return (
      <Badge variant="secondary">
        <Archive className="size-3" />
        {FUNDRAISING_INQUIRY_STATUS_LABELS[status]}
      </Badge>
    );
  }

  return <Badge variant="outline">{FUNDRAISING_INQUIRY_STATUS_LABELS[status]}</Badge>;
}

async function fetchAdminFundraisingCampaigns(searchParams: string) {
  const response = await fetch(
    `/api/admin/fundraising/campaigns?${searchParams}`,
    {
      headers: { Accept: "application/json" },
    },
  );
  const body: unknown = await response.json();

  if (!response.ok) {
    const parsedError = actionResultSchema.safeParse(body);
    throw new Error(
      parsedError.success
        ? parsedError.data.message
        : "Failed to load fundraising campaigns.",
    );
  }

  return adminFundraisingCampaignsResponseSchema.parse(body);
}

async function fetchAdminFundraisingInquiries(searchParams: string) {
  const response = await fetch(
    `/api/admin/fundraising/inquiries?${searchParams}`,
    {
      headers: { Accept: "application/json" },
    },
  );
  const body: unknown = await response.json();

  if (!response.ok) {
    const parsedError = actionResultSchema.safeParse(body);
    throw new Error(
      parsedError.success
        ? parsedError.data.message
        : "Failed to load fundraising inquiries.",
    );
  }

  return adminFundraisingInquiriesResponseSchema.parse(body);
}

async function createAdminFundraisingCampaign(
  input: CreateFundraisingCampaignInput,
): Promise<ActionResult> {
  const response = await fetch("/api/admin/fundraising", {
    body: JSON.stringify(input),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return parseActionResponse(response, "Campaign creation failed.");
}

async function updateAdminFundraisingMutation(
  mutation: AdminFundraisingMutation,
): Promise<ActionResult> {
  const parsedMutation = adminFundraisingMutationSchema.parse(mutation);
  const response = await fetch("/api/admin/fundraising", {
    body: JSON.stringify(parsedMutation),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });

  return parseActionResponse(response, "Fundraising update failed.");
}

async function deleteAdminFundraisingCampaign({
  campaignId,
}: {
  campaignId: number;
}): Promise<ActionResult> {
  const response = await fetch("/api/admin/fundraising", {
    body: JSON.stringify({ campaignId }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "DELETE",
  });

  return parseActionResponse(response, "Campaign deletion failed.");
}

async function parseActionResponse(
  response: Response,
  fallback: string,
): Promise<ActionResult> {
  const body: unknown = await response.json();
  const result = actionResultSchema.parse(body);

  if (!response.ok || !result.ok) {
    throw new Error(result.message || fallback);
  }

  return result;
}

function getInitialCampaignFormValues(
  campaign?: FundraisingCampaignRow,
): FundraisingCampaignFormValues {
  return {
    title: campaign?.title ?? "",
    slug: campaign?.slug ?? "",
    summary: campaign?.summary ?? "",
    body: campaign?.body ?? "",
    status: campaign?.status ?? "draft",
    goalAmount: campaign?.goalAmountMinor
      ? String(campaign.goalAmountMinor / 100)
      : "",
    currency: campaign?.currency ?? "GHS",
    startsAt: fromIsoDate(campaign?.startsAt ?? null),
    endsAt: fromIsoDate(campaign?.endsAt ?? null),
    paymentInstructions: campaign?.paymentInstructions ?? "",
    paymentMethods:
      campaign && campaign.paymentMethods.length > 0
        ? campaign.paymentMethods.map((method) => ({
            accountName: method.accountName ?? "",
            accountNumber: method.accountNumber ?? "",
            instructions: method.instructions ?? "",
            label: method.label,
            network: method.network ?? "",
          }))
        : [emptyPaymentMethod()],
    sponsorshipTiers:
      campaign && campaign.sponsorshipTiers.length > 0
        ? campaign.sponsorshipTiers.map((tier) => ({
            amountLabel: tier.amountLabel ?? "",
            benefits: tier.benefits.join("\n"),
            name: tier.name,
          }))
        : [emptySponsorTier()],
    cover: campaign?.cover
      ? {
          id: campaign.cover.id,
          objectKey: campaign.cover.objectKey,
          publicUrl: campaign.cover.publicUrl,
        }
      : null,
  };
}

function emptyPaymentMethod(): PaymentMethodFormValue {
  return {
    accountName: "",
    accountNumber: "",
    instructions: "",
    label: "",
    network: "",
  };
}

function emptySponsorTier(): SponsorshipTierFormValue {
  return {
    amountLabel: "",
    benefits: "",
    name: "",
  };
}

function parseGoalAmountMinor(value: string): AmountParseResult {
  const trimmed = value.trim();
  if (trimmed.length === 0) return { ok: true, value: null };

  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      ok: false,
      message: "Goal amount must be a positive number.",
    };
  }

  return { ok: true, value: Math.round(amount * 100) };
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function stringArrayFilter<TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: unknown,
): boolean {
  const selected = toStringArray(filterValue);
  if (selected.length === 0) return true;

  const value = row.getValue(columnId);
  return typeof value === "string" && selected.includes(value);
}

function nullableDateSort<TData>(
  first: Row<TData>,
  second: Row<TData>,
  columnId: string,
): number {
  return (
    dateValue(first.getValue(columnId)) - dateValue(second.getValue(columnId))
  );
}

function dateValue(value: unknown): number {
  return typeof value === "string" ? new Date(value).getTime() : 0;
}

function formatDate(value: string | null): string {
  return value ? dateFormatter.format(new Date(value)) : "Not set";
}

function fromIsoDate(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

function toIsoDateTime(value: string): string | null {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : null;
}
