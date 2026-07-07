import { describe, expect, test } from "bun:test";
import {
  FINANCE_DOCUMENT_TYPE_LABELS,
  createFinanceDocumentInputSchema,
  updateFinanceDocumentInputSchema,
} from "../../../src/modules/finance/contracts";

describe("finance contracts", () => {
  test("normalizes finance document metadata", () => {
    const parsed = createFinanceDocumentInputSchema.parse({
      title: "  First Semester Accountability Report  ",
      summary: "   ",
      type: "semester_report",
      academicYear: " 2025/2026 ",
      semester: "first",
      programmeName: undefined,
      datePresented: "2026-07-07T10:00:00.000Z",
      storageObjectId: "storage_finance_pdf",
      status: "published",
    });

    expect(parsed.title).toBe("First Semester Accountability Report");
    expect(parsed.summary).toBeNull();
    expect(parsed.academicYear).toBe("2025/2026");
    expect(parsed.programmeName).toBeNull();
  });

  test("requires semester metadata for semester reports", () => {
    const parsed = createFinanceDocumentInputSchema.safeParse({
      title: "Semester report",
      summary: null,
      type: "semester_report",
      academicYear: "2025/2026",
      semester: null,
      programmeName: null,
      datePresented: null,
      storageObjectId: "storage_finance_pdf",
      status: "draft",
    });

    expect(parsed.success).toBe(false);
  });

  test("requires programme metadata for programme budgets", () => {
    const parsed = createFinanceDocumentInputSchema.safeParse({
      title: "Health outreach budget",
      summary: null,
      type: "programme_budget",
      academicYear: "2025/2026",
      semester: null,
      programmeName: "   ",
      datePresented: null,
      storageObjectId: "storage_finance_pdf",
      status: "draft",
    });

    expect(parsed.success).toBe(false);
  });

  test("does not accept storage replacement in update payloads", () => {
    const parsed = updateFinanceDocumentInputSchema.parse({
      financeDocumentId: 1,
      title: "Annual accountability report",
      summary: null,
      type: "annual_report",
      academicYear: "2025/2026",
      semester: null,
      programmeName: null,
      datePresented: null,
      storageObjectId: "ignored",
      status: "draft",
    });

    expect(parsed).not.toHaveProperty("storageObjectId");
  });

  test("keeps finance document labels available for filters", () => {
    expect(FINANCE_DOCUMENT_TYPE_LABELS.semester_report).toBe(
      "Semester Report",
    );
    expect(FINANCE_DOCUMENT_TYPE_LABELS.programme_budget).toBe(
      "Programme Budget",
    );
  });
});
