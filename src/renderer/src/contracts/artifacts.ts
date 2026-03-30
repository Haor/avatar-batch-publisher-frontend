export interface ArtifactSummary {
  artifactId: string;
  name: string;
  seedAvatarId: string | null;
  seedAvatarIdMode: string;
  platform: string;
  unityVersion: string;
  bundlePath: string;
  thumbnailPath: string | null;
  bundleHash: string;
  createdAt: string;
}

export interface ArtifactDetails extends ArtifactSummary {
  bundleFileName: string;
  thumbnailFileName: string | null;
  hasThumbnail: boolean;
}

export interface ArtifactImportFromBundleRequest {
  bundlePath: string;
  manifestPath: string | null;
  thumbnailPath: string | null;
  nameOverride: string | null;
}

export interface ArtifactImportFromManifestRequest {
  manifestPath: string;
}

export interface ArtifactUpdateRequest {
  name?: string;
  thumbnailPath?: string;
}

export interface ArtifactResponse {
  artifact: ArtifactSummary;
}
