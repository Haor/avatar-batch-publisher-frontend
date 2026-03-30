import type { ArtifactSummary } from "./artifacts";

export interface MyAvatarPlatformPackage {
  platform: string;
  unityVersion: string | null;
  assetVersion: number;
  assetUrlAvailable: boolean;
  assetUrl: string | null;
  fileSizeBytes: number | null;
}

export interface MyAvatarSummary {
  avatarId: string;
  accountId: string;
  name: string;
  description: string | null;
  releaseStatus: string;
  authorId: string;
  authorName: string | null;
  imageUrl: string | null;
  thumbnailImageUrl: string | null;
  version: number;
  createdAt: string | null;
  updatedAt: string | null;
  pendingUpload: boolean;
  tags: string[];
  contentTags: string[];
  authorTags: string[];
  primaryStyleId: string | null;
  secondaryStyleId: string | null;
  platforms: MyAvatarPlatformPackage[];
  linkedEntryId: string | null;
  isLinkedToArtifact: boolean;
  memoPreview: string | null;
  tagsOverlay: string[];
  favorite: boolean;
}

export interface MyAvatarCollectionLink {
  collectionId: string;
  collectionName: string;
}

export interface MyAvatarLinkedArtifact {
  artifactId: string;
  name: string;
}

export interface MyAvatarLocalOverlay {
  linkedEntryId: string | null;
  memo: string | null;
  tags: string[];
  collections: MyAvatarCollectionLink[];
  favorite: boolean;
  lastViewedAt: string | null;
  lastDownloadedAt: string | null;
  lastPublishedAt: string | null;
  linkedArtifacts: MyAvatarLinkedArtifact[];
}

export interface MyAvatarActionSet {
  canEditInfo: boolean;
  canEditImage: boolean;
  canDelete: boolean;
  canDownload: boolean;
  canImport: boolean;
  canSelectFallback: boolean;
  canPublish: boolean;
}

export interface MyAvatarRemoteAvatar {
  avatarId: string;
  name: string;
  description: string | null;
  releaseStatus: string;
  authorId: string;
  authorName: string | null;
  imageUrl: string | null;
  thumbnailImageUrl: string | null;
  version: number;
  createdAt: string | null;
  updatedAt: string | null;
  pendingUpload: boolean;
  featured: boolean;
  tags: string[];
  contentTags: string[];
  authorTags: string[];
  primaryStyleId: string | null;
  secondaryStyleId: string | null;
  platforms: MyAvatarPlatformPackage[];
}

export interface MyAvatarDetails {
  avatarId: string;
  accountId: string;
  remoteAvatar: MyAvatarRemoteAvatar;
  localOverlay: MyAvatarLocalOverlay;
  availableActions: MyAvatarActionSet;
}

export interface MyAvatarStyleOption {
  styleId: string;
  styleName: string;
}

export interface MyAvatarUpdateInfoRequest {
  accountId: string;
  name: string;
  description: string | null;
  releaseStatus: string;
  contentTags: string[];
  authorTags: string[];
  primaryStyleId: string | null;
  secondaryStyleId: string | null;
}

export interface MyAvatarUpdateImageRequest {
  accountId: string;
  imagePath: string;
}

export interface MyAvatarActionRequest {
  accountId: string;
}

export interface MyAvatarDownloadRequest {
  accountId: string;
  platform: string | null;
}

export interface MyAvatarImportRequest {
  accountId: string;
  platform: string | null;
  nameOverride: string | null;
  linkToExistingEntryId: string | null;
}

export interface MyAvatarDownloadRecord {
  downloadId: string;
  avatarId: string;
  accountId: string;
  platform: string;
  unityVersion: string | null;
  filePath: string;
  fileSizeBytes: number | null;
  sha256: string | null;
  createdAt: string;
  linkedEntryId: string | null;
  importedArtifactId: string | null;
}

export interface MyAvatarImportResult {
  artifact: ArtifactSummary;
  download: MyAvatarDownloadRecord;
  linkedEntryId: string;
}
