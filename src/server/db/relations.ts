import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  user: {
    sessions: r.many.session(),
    accounts: r.many.account(),
    passkeys: r.many.passkey(),
    twoFactors: r.many.twoFactor(),
    sentAuthInvitations: r.many.authInvitations({
      alias: "auth_invitation_inviter",
    }),
    acceptedAuthInvitations: r.many.authInvitations({
      alias: "auth_invitation_acceptor",
    }),
    permissionGrants: r.many.userPermissionGrants({
      alias: "user_permission_grant_user",
    }),
    grantedPermissionGrants: r.many.userPermissionGrants({
      alias: "user_permission_grant_granter",
    }),
    announcements: r.many.announcements(),
    events: r.many.events(),
    resources: r.many.resources(),
    uploadedStorageObjects: r.many.storageObjects(),
    reviewedConcerns: r.many.anonymousConcerns(),
    galleryItems: r.many.galleryItems(),
    studentSpotlights: r.many.studentSpotlights(),
    financeDocuments: r.many.financeDocuments(),
    fundraisingCampaigns: r.many.fundraisingCampaigns(),
    reviewedFundraisingInquiries: r.many.fundraisingInquiries(),
    scholarshipPrograms: r.many.scholarshipPrograms(),
    auditLogs: r.many.auditLogs(),
    createdBulletinIssues: r.many.bulletinIssues({
      alias: "created_bulletin_issues",
    }),
    updatedBulletinIssues: r.many.bulletinIssues({
      alias: "updated_bulletin_issues",
    }),
    sentBulletinIssues: r.many.bulletinIssues({
      alias: "sent_bulletin_issues",
    }),
    dashboardNotifications: r.many.dashboardNotifications(),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
      optional: false,
    }),
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
      optional: false,
    }),
  },
  passkey: {
    user: r.one.user({
      from: r.passkey.userId,
      to: r.user.id,
      optional: false,
    }),
  },
  twoFactor: {
    user: r.one.user({
      from: r.twoFactor.userId,
      to: r.user.id,
      optional: false,
    }),
  },
  authInvitations: {
    invitedBy: r.one.user({
      from: r.authInvitations.invitedByUserId,
      to: r.user.id,
      alias: "auth_invitation_inviter",
    }),
    acceptedBy: r.one.user({
      from: r.authInvitations.acceptedByUserId,
      to: r.user.id,
      alias: "auth_invitation_acceptor",
    }),
  },
  userPermissionGrants: {
    user: r.one.user({
      from: r.userPermissionGrants.userId,
      to: r.user.id,
      alias: "user_permission_grant_user",
      optional: false,
    }),
    grantedBy: r.one.user({
      from: r.userPermissionGrants.grantedByUserId,
      to: r.user.id,
      alias: "user_permission_grant_granter",
    }),
  },
  storageObjects: {
    uploader: r.one.user({
      from: r.storageObjects.uploadedByUserId,
      to: r.user.id,
    }),
    resource: r.one.resources({
      from: r.storageObjects.id,
      to: r.resources.storageObjectId,
    }),
    announcementAttachments: r.many.announcements(),
    eventPosters: r.many.events(),
    lecturerPhotos: r.many.lecturers(),
    concernAttachments: r.many.anonymousConcerns(),
    galleryItems: r.many.galleryItems(),
    spotlightPhotos: r.many.studentSpotlights(),
    financeDocuments: r.many.financeDocuments(),
    fundraisingCampaignCovers: r.many.fundraisingCampaigns(),
    scholarshipProgramAttachments: r.many.scholarshipPrograms(),
  },
  courses: {
    lecturerCourses: r.many.lecturerCourses(),
    resources: r.many.resources(),
  },
  lecturers: {
    photo: r.one.storageObjects({
      from: r.lecturers.photoStorageObjectId,
      to: r.storageObjects.id,
    }),
    lecturerCourses: r.many.lecturerCourses(),
  },
  lecturerCourses: {
    lecturer: r.one.lecturers({
      from: r.lecturerCourses.lecturerId,
      to: r.lecturers.id,
      optional: false,
    }),
    course: r.one.courses({
      from: r.lecturerCourses.courseId,
      to: r.courses.id,
      optional: false,
    }),
  },
  announcements: {
    author: r.one.user({
      from: r.announcements.authorId,
      to: r.user.id,
    }),
    attachment: r.one.storageObjects({
      from: r.announcements.attachmentStorageObjectId,
      to: r.storageObjects.id,
    }),
  },
  events: {
    creator: r.one.user({
      from: r.events.createdById,
      to: r.user.id,
    }),
    poster: r.one.storageObjects({
      from: r.events.posterStorageObjectId,
      to: r.storageObjects.id,
    }),
  },
  resources: {
    course: r.one.courses({
      from: r.resources.courseId,
      to: r.courses.id,
    }),
    file: r.one.storageObjects({
      from: r.resources.storageObjectId,
      to: r.storageObjects.id,
      optional: false,
    }),
    uploader: r.one.user({
      from: r.resources.uploadedByUserId,
      to: r.user.id,
    }),
  },
  anonymousConcerns: {
    attachment: r.one.storageObjects({
      from: r.anonymousConcerns.attachmentStorageObjectId,
      to: r.storageObjects.id,
    }),
    reviewer: r.one.user({
      from: r.anonymousConcerns.reviewedByUserId,
      to: r.user.id,
    }),
  },
  galleryItems: {
    file: r.one.storageObjects({
      from: r.galleryItems.storageObjectId,
      to: r.storageObjects.id,
      optional: false,
    }),
    creator: r.one.user({
      from: r.galleryItems.createdById,
      to: r.user.id,
    }),
  },
  studentSpotlights: {
    photo: r.one.storageObjects({
      from: r.studentSpotlights.photoStorageObjectId,
      to: r.storageObjects.id,
    }),
    creator: r.one.user({
      from: r.studentSpotlights.createdById,
      to: r.user.id,
    }),
  },
  financeDocuments: {
    file: r.one.storageObjects({
      from: r.financeDocuments.storageObjectId,
      to: r.storageObjects.id,
      optional: false,
    }),
    creator: r.one.user({
      from: r.financeDocuments.createdById,
      to: r.user.id,
    }),
  },
  fundraisingCampaigns: {
    cover: r.one.storageObjects({
      from: r.fundraisingCampaigns.coverStorageObjectId,
      to: r.storageObjects.id,
    }),
    creator: r.one.user({
      from: r.fundraisingCampaigns.createdById,
      to: r.user.id,
    }),
    inquiries: r.many.fundraisingInquiries(),
  },
  fundraisingInquiries: {
    campaign: r.one.fundraisingCampaigns({
      from: r.fundraisingInquiries.campaignId,
      to: r.fundraisingCampaigns.id,
    }),
    reviewer: r.one.user({
      from: r.fundraisingInquiries.reviewedByUserId,
      to: r.user.id,
    }),
  },
  scholarshipPrograms: {
    attachment: r.one.storageObjects({
      from: r.scholarshipPrograms.attachmentStorageObjectId,
      to: r.storageObjects.id,
    }),
    creator: r.one.user({
      from: r.scholarshipPrograms.createdById,
      to: r.user.id,
    }),
  },
  auditLogs: {
    actor: r.one.user({
      from: r.auditLogs.actorUserId,
      to: r.user.id,
    }),
  },
  bulletinIssues: {
    creator: r.one.user({
      from: r.bulletinIssues.createdById,
      to: r.user.id,
      alias: "created_bulletin_issues",
    }),
    updater: r.one.user({
      from: r.bulletinIssues.updatedById,
      to: r.user.id,
      alias: "updated_bulletin_issues",
    }),
    sender: r.one.user({
      from: r.bulletinIssues.sentById,
      to: r.user.id,
      alias: "sent_bulletin_issues",
    }),
    deliveries: r.many.bulletinDeliveries(),
  },
  bulletinSubscriptions: {
    deliveries: r.many.bulletinDeliveries(),
  },
  bulletinDeliveries: {
    issue: r.one.bulletinIssues({
      from: r.bulletinDeliveries.issueId,
      to: r.bulletinIssues.id,
      optional: false,
    }),
    subscription: r.one.bulletinSubscriptions({
      from: r.bulletinDeliveries.subscriptionId,
      to: r.bulletinSubscriptions.id,
    }),
  },
  dashboardNotifications: {
    user: r.one.user({
      from: r.dashboardNotifications.userId,
      to: r.user.id,
      optional: false,
    }),
  },
}));
