import "server-only";

import {
  emailBase,
  emailButton,
  emailDivider,
  emailHeading,
  emailInfoCard,
  emailMutedParagraph,
  emailParagraph,
} from "@/server/mail/base";

interface PublishedAnnouncementTemplateInput {
  title: string;
  categoryLabel: string;
  dashboardUrl: string;
}

interface PublishedResourceTemplateInput {
  title: string;
  typeLabel: string;
  levelLabel: string;
  semesterLabel: string;
  dashboardUrl: string;
}

interface PublishedEventTemplateInput {
  title: string;
  startsAtLabel: string;
  locationLabel: string;
  dashboardUrl: string;
}

interface ConcernSubmittedTemplateInput {
  subject: string;
  categoryLabel: string;
  dashboardUrl: string;
}

export function publishedAnnouncementTemplate({
  title,
  categoryLabel,
  dashboardUrl,
}: PublishedAnnouncementTemplateInput): string {
  return emailBase({
    preheader: `Announcement published: ${title}`,
    body: [
      emailHeading("Announcement published", title),
      emailParagraph(
        "A MELSSA announcement has been published and is now visible on the portal.",
      ),
      emailInfoCard([{ label: "Category", value: categoryLabel }]),
      emailButton("Review announcement", dashboardUrl),
      emailDivider(),
      emailMutedParagraph(
        "You are receiving this because your role or email is configured for announcement notifications.",
      ),
    ].join(""),
  });
}

export function publishedResourceTemplate({
  title,
  typeLabel,
  levelLabel,
  semesterLabel,
  dashboardUrl,
}: PublishedResourceTemplateInput): string {
  return emailBase({
    preheader: `Resource published: ${title}`,
    body: [
      emailHeading("Resource published", title),
      emailParagraph(
        "An academic resource has been published and is now available to students.",
      ),
      emailInfoCard([
        { label: "Type", value: typeLabel },
        { label: "Level", value: levelLabel },
        { label: "Semester", value: semesterLabel },
      ]),
      emailButton("Review resource", dashboardUrl),
      emailDivider(),
      emailMutedParagraph(
        "You are receiving this because your role or email is configured for resource notifications.",
      ),
    ].join(""),
  });
}

export function publishedEventTemplate({
  title,
  startsAtLabel,
  locationLabel,
  dashboardUrl,
}: PublishedEventTemplateInput): string {
  return emailBase({
    preheader: `Event published: ${title}`,
    body: [
      emailHeading("Event published", title),
      emailParagraph(
        "A MELSSA event has been published and is now visible on the portal.",
      ),
      emailInfoCard([
        { label: "Starts", value: startsAtLabel },
        { label: "Location", value: locationLabel },
      ]),
      emailButton("Review event", dashboardUrl),
      emailDivider(),
      emailMutedParagraph(
        "You are receiving this because your role or email is configured for event notifications.",
      ),
    ].join(""),
  });
}

export function concernSubmittedTemplate({
  subject,
  categoryLabel,
  dashboardUrl,
}: ConcernSubmittedTemplateInput): string {
  return emailBase({
    preheader: `New anonymous concern: ${subject}`,
    body: [
      emailHeading("Concern submitted", subject),
      emailParagraph(
        "A new anonymous student concern has been submitted for MELSSA review.",
      ),
      emailInfoCard([{ label: "Category", value: categoryLabel }]),
      emailButton("Review concern", dashboardUrl),
      emailDivider(),
      emailMutedParagraph(
        "You are receiving this because your role or email is configured for concern notifications.",
      ),
    ].join(""),
  });
}
