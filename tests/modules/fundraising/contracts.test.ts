import { describe, expect, test } from "bun:test";
import {
  FUNDRAISING_INQUIRY_STATUS_LABELS,
  createFundraisingCampaignInputSchema,
  createFundraisingInquiryInputSchema,
  updateFundraisingInquiryInputSchema,
} from "../../../src/modules/fundraising/contracts";

describe("fundraising contracts", () => {
  test("normalizes campaign payment and sponsorship metadata", () => {
    const parsed = createFundraisingCampaignInputSchema.parse({
      title: "  Lab Equipment Support  ",
      slug: " Lab-Equipment-Support ",
      summary: "",
      body: "Support procurement of practical learning equipment for students.",
      status: "published",
      goalAmountMinor: 500000,
      currency: "ghs",
      startsAt: "2026-07-07T10:00:00.000Z",
      endsAt: "2026-08-07T10:00:00.000Z",
      paymentInstructions: "  Send mobile money with reference MELSSA LAB. ",
      paymentMethods: [
        {
          label: "MTN Mobile Money",
          accountName: "MELSSA Treasurer",
          accountNumber: "0240000000",
          network: "MTN",
          instructions: "",
        },
      ],
      sponsorshipTiers: [
        {
          name: "Gold Sponsor",
          amountLabel: "GHS 5,000+",
          benefits: ["Public acknowledgement", "Event branding"],
        },
      ],
      coverStorageObjectId: undefined,
    });

    expect(parsed.title).toBe("Lab Equipment Support");
    expect(parsed.slug).toBe("lab-equipment-support");
    expect(parsed.summary).toBeNull();
    expect(parsed.currency).toBe("GHS");
    expect(parsed.coverStorageObjectId).toBeNull();
    expect(parsed.paymentMethods[0]?.instructions).toBeNull();
  });

  test("rejects campaigns with dates in the wrong order", () => {
    const parsed = createFundraisingCampaignInputSchema.safeParse({
      title: "Lab Equipment Support",
      slug: "lab-equipment-support",
      summary: null,
      body: "Support procurement of practical learning equipment for students.",
      status: "draft",
      goalAmountMinor: null,
      currency: "GHS",
      startsAt: "2026-08-07T10:00:00.000Z",
      endsAt: "2026-07-07T10:00:00.000Z",
      paymentInstructions: null,
      paymentMethods: [],
      sponsorshipTiers: [],
      coverStorageObjectId: null,
    });

    expect(parsed.success).toBe(false);
  });

  test("rejects unsupported currency codes", () => {
    const parsed = createFundraisingCampaignInputSchema.safeParse({
      title: "Lab Equipment Support",
      slug: "lab-equipment-support",
      summary: null,
      body: "Support procurement of practical learning equipment for students.",
      status: "draft",
      goalAmountMinor: 500000,
      currency: "ZZZ",
      startsAt: null,
      endsAt: null,
      paymentInstructions: null,
      paymentMethods: [],
      sponsorshipTiers: [],
      coverStorageObjectId: null,
    });

    expect(parsed.success).toBe(false);
  });

  test("normalizes sponsor inquiries", () => {
    const parsed = createFundraisingInquiryInputSchema.parse({
      campaignId: undefined,
      organizationName: "  Blue Health Foundation  ",
      contactName: "  Kelly Test  ",
      contactEmail: "  KELLY@example.COM ",
      phone: "   ",
      message:
        "We would like to discuss sponsoring practical learning activities this semester.",
    });

    expect(parsed.campaignId).toBeNull();
    expect(parsed.organizationName).toBe("Blue Health Foundation");
    expect(parsed.contactEmail).toBe("kelly@example.com");
    expect(parsed.phone).toBeNull();
  });

  test("normalizes inquiry review notes", () => {
    const parsed = updateFundraisingInquiryInputSchema.parse({
      inquiryId: 1,
      status: "reviewing",
      internalNotes: "   ",
    });

    expect(parsed.internalNotes).toBeNull();
  });

  test("keeps inquiry status labels available for filters", () => {
    expect(FUNDRAISING_INQUIRY_STATUS_LABELS.new).toBe("New");
    expect(FUNDRAISING_INQUIRY_STATUS_LABELS.responded).toBe("Responded");
  });
});
