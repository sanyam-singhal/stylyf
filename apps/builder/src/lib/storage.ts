import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "~/lib/env";

export type UploadIntent = {
  key: string;
  contentType: string;
  fileSize?: number;
  expiresIn?: number;
};

export const storagePolicy = {
  maxFileSizeBytes: 26_214_400,
  keyPrefix: "uploads",
  presignExpiresSeconds: 900,
  objectPolicy: "private",
} as const;

function parseForcePathStyle(value?: string) {
  return value === "true" || value === "1";
}

function storageRegion() {
  return env.AWS_REGION ?? env.S3_REGION ?? "us-east-1";
}

export function storageBucket() {
  const value = env.AWS_S3_BUCKET || env.S3_BUCKET;
  if (!value) throw new Error("Missing object storage bucket. Set AWS_S3_BUCKET or S3_BUCKET.");
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(value) || value.includes("..")) {
    throw new Error("Object storage bucket must be a DNS-compatible lowercase S3 bucket name.");
  }
  return value;
}

function storageEndpoint() {
  return env.AWS_ENDPOINT_URL_S3 || env.S3_ENDPOINT || undefined;
}

function storageAccessKeyId() {
  const value = env.AWS_ACCESS_KEY_ID || env.S3_ACCESS_KEY_ID;
  if (!value) throw new Error("Missing object storage access key. Set AWS_ACCESS_KEY_ID or S3_ACCESS_KEY_ID.");
  return value;
}

function storageSecretAccessKey() {
  const value = env.AWS_SECRET_ACCESS_KEY || env.S3_SECRET_ACCESS_KEY;
  if (!value) throw new Error("Missing object storage secret key. Set AWS_SECRET_ACCESS_KEY or S3_SECRET_ACCESS_KEY.");
  return value;
}

function assertUploadAllowed(input: UploadIntent) {
  if (input.fileSize !== undefined && input.fileSize > storagePolicy.maxFileSizeBytes) {
    throw new Error(`File exceeds max upload size of ${storagePolicy.maxFileSizeBytes} bytes.`);
  }
  assertObjectKey(input.key);
}

function assertObjectKey(key: string) {
  if (!key.startsWith(`${storagePolicy.keyPrefix}/`)) {
    throw new Error(`Object key must start with ${storagePolicy.keyPrefix}/.`);
  }
}

export function getStorageClient() {
  return new S3Client({
    region: storageRegion(),
    endpoint: storageEndpoint(),
    forcePathStyle: parseForcePathStyle(env.S3_FORCE_PATH_STYLE),
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: storageAccessKeyId(),
      secretAccessKey: storageSecretAccessKey(),
    },
  });
}

export async function createPresignedUpload(input: UploadIntent) {
  assertUploadAllowed(input);
  const bucket = storageBucket();
  const expiresIn = input.expiresIn ?? storagePolicy.presignExpiresSeconds;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: input.key,
    ContentType: input.contentType,
  });
  const url = await getSignedUrl(getStorageClient(), command, { expiresIn });
  return {
    method: "PUT" as const,
    url,
    key: input.key,
    bucket,
    expiresIn,
    headers: {
      "content-type": input.contentType,
    },
  };
}

export async function createPresignedDownload(input: { key: string; expiresIn?: number }) {
  assertObjectKey(input.key);
  const bucket = storageBucket();
  const expiresIn = input.expiresIn ?? storagePolicy.presignExpiresSeconds;
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: input.key,
  });
  const url = await getSignedUrl(getStorageClient(), command, { expiresIn });
  return {
    method: "GET" as const,
    url,
    key: input.key,
    bucket,
    expiresIn,
  };
}

export async function readObjectMetadata(key: string) {
  assertObjectKey(key);
  const result = await getStorageClient().send(
    new HeadObjectCommand({
      Bucket: storageBucket(),
      Key: key,
    }),
  );
  return {
    contentType: result.ContentType ?? null,
    fileSize: typeof result.ContentLength === "number" ? result.ContentLength : null,
    eTag: result.ETag ?? null,
    lastModified: result.LastModified ?? null,
  };
}

export async function deleteObject(key: string) {
  assertObjectKey(key);
  await getStorageClient().send(
    new DeleteObjectCommand({
      Bucket: storageBucket(),
      Key: key,
    }),
  );
}
