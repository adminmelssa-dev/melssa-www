import { describe, expect, test } from "bun:test";
import {
  SCHOLARSHIP_APPLICATION_MODE_LABELS,
  createScholarshipProgramInputSchema,
  updateScholarshipProgramInputSchema,
} from "../../../src/modules/scholarships/contracts";

describe("scholarship contracts", () => {
  test("accepts information-only scholarship programmes without application URLs", () => {
    const parsed = createScholarshipProgramInputSchema.parse({
      title: "  Alumni Emergency Support Grant  ",
      slug: " Alumni-Emergency-Support ",
      providerName: "  MELSSA Alumni Desk  ",
      summary: "   ",
      description:
        "Information for students who need short-term academic support from the alumni desk.",
      status: "published",
      academicYear: "2025/2026",
      amountDescription: "",
      eligibility: "  Open to MELSSA members with documented need. ",
      requirements: "",
      applicationMode: "information",
      applicationUrl: null,
      applicationInstructions:
        "Contact the MELSSA welfare desk for guidance before applying.",
      contactEmail: " Welfare@Example.COM ",
      opensAt: null,
      closesAt: null,
      attachmentStorageObjectId: undefined,
    });

    expect(parsed.title).toBe("Alumni Emergency Support Grant");
    expect(parsed.slug).toBe("alumni-emergency-support");
    expect(parsed.providerName).toBe("MELSSA Alumni Desk");
    expect(parsed.summary).toBeNull();
    expect(parsed.amountDescription).toBeNull();
    expect(parsed.requirements).toBeNull();
    expect(parsed.contactEmail).toBe("welfare@example.com");
    expect(parsed.attachmentStorageObjectId).toBeNull();
  });

  test("requires application URLs for external programmes", () => {
    const parsed = createScholarshipProgramInputSchema.safeParse({
      title: "External scholarship",
      slug: "external-scholarship",
      providerName: "External Provider",
      summary: null,
      description:
        "A scholarship opportunity from an external partner for qualified students.",
      status: "draft",
      academicYear: null,
      amountDescription: null,
      eligibility: null,
      requirements: null,
      applicationMode: "external",
      applicationUrl: null,
      applicationInstructions: null,
      contactEmail: null,
      opensAt: null,
      closesAt: null,
      attachmentStorageObjectId: null,
    });

    expect(parsed.success).toBe(false);
  });

  test("rejects programmes with dates in the wrong order", () => {
    const parsed = createScholarshipProgramInputSchema.safeParse({
      title: "External scholarship",
      slug: "external-scholarship",
      providerName: "External Provider",
      summary: null,
      description:
        "A scholarship opportunity from an external partner for qualified students.",
      status: "draft",
      academicYear: null,
      amountDescription: null,
      eligibility: null,
      requirements: null,
      applicationMode: "external",
      applicationUrl: "https://example.com/apply",
      applicationInstructions: null,
      contactEmail: null,
      opensAt: "2026-08-07T10:00:00.000Z",
      closesAt: "2026-07-07T10:00:00.000Z",
      attachmentStorageObjectId: null,
    });

    expect(parsed.success).toBe(false);
  });

  test("accepts attachment replacement in update payloads", () => {
    const parsed = updateScholarshipProgramInputSchema.parse({
      scholarshipProgramId: 1,
      title: "External scholarship",
      slug: "external-scholarship",
      providerName: "External Provider",
      summary: null,
      description:
        "A scholarship opportunity from an external partner for qualified students.",
      status: "draft",
      academicYear: null,
      amountDescription: null,
      eligibility: null,
      requirements: null,
      applicationMode: "external",
      applicationUrl: "https://example.com/apply",
      applicationInstructions: null,
      contactEmail: null,
      opensAt: null,
      closesAt: null,
      attachmentStorageObjectId: "storage_scholarship_pdf",
    });

    expect(parsed.attachmentStorageObjectId).toBe("storage_scholarship_pdf");
  });

  test("keeps scholarship application mode labels available for filters", () => {
    expect(SCHOLARSHIP_APPLICATION_MODE_LABELS.information).toBe(
      "Information Only",
    );
    expect(SCHOLARSHIP_APPLICATION_MODE_LABELS.external).toBe(
      "External Application",
    );
  });
});
