import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "~/lib/env";

export type UploadIntent = {
  key: string;
  contentType: string;
  fileSize?: number;
  expiresIn?: number;
};

export const storagePolicy = {
  "maxFileSizeBytes": 26214400,
  "allowedContentTypes": [],
  "keyPrefix": "uploads",
  "presignExpiresSeconds": 900,
  "objectPolicy": "private",
  "deleteMode": "hard"
} as const;

function assertUploadAllowed(input: UploadIntent) {
  if (input.fileSize !== undefined && input.fileSize > storagePolicy.maxFileSizeBytes) {
    throw new Error(`File exceeds max upload size of ${storagePolicy.maxFileSizeBytes} bytes.`);
  }
  if (storagePolicy.allowedContentTypes.length > 0 && !(storagePolicy.allowedContentTypes as readonly string[]).includes(input.contentType)) {
    throw new Error(`Content type ${input.contentType} is not allowed by storage policy.`);
  }
  if (!input.key.startsWith(`${storagePolicy.keyPrefix}/`)) {
    throw new Error(`Object key must start with ${storagePolicy.keyPrefix}/.`);
  }
}

function parseForcePathStyle(value?: string) {
  return value === "true" || value === "1";
}

function storageRegion() {
  return env.AWS_REGION ?? env.S3_REGION ?? "us-east-1";
}

export function storageBucket() {
  const value = env.AWS_S3_BUCKET || env.S3_BUCKET;
  if (!value) throw new Error("Missing object storage bucket. Set AWS_S3_BUCKET or S3_BUCKET.");
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

export function getStorageClient() {
  return new S3Client({
    region: storageRegion(),
    bucketEndpoint: false,
    endpoint: storageEndpoint(),
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    forcePathStyle: parseForcePathStyle(env.S3_FORCE_PATH_STYLE),
    credentials: {
      accessKeyId: storageAccessKeyId(),
      secretAccessKey: storageSecretAccessKey(),
    },
  });
}

export async function createPresignedUpload(input: UploadIntent) {
  assertUploadAllowed(input);
  const client = getStorageClient();
  const expiresIn = input.expiresIn ?? storagePolicy.presignExpiresSeconds;
  const command = new PutObjectCommand({
    Bucket: storageBucket(),
    Key: input.key,
    ContentType: input.contentType,
  });
  const url = await getSignedUrl(client, command, { expiresIn });
  return {
    method: 'PUT' as const,
    url,
    key: input.key,
    bucket: storageBucket(),
    expiresIn,
    policy: storagePolicy,
    headers: {
      "content-type": input.contentType,
    },
  };
}

export async function createPresignedDownload(input: { key: string; expiresIn?: number }) {
  const client = getStorageClient();
  const expiresIn = input.expiresIn ?? storagePolicy.presignExpiresSeconds;
  const command = new GetObjectCommand({
    Bucket: storageBucket(),
    Key: input.key,
  });
  const url = await getSignedUrl(client, command, { expiresIn });
  return {
    method: "GET" as const,
    url,
    key: input.key,
    bucket: storageBucket(),
    expiresIn,
  };
}

export async function deleteObject(key: string) {
  const client = getStorageClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: storageBucket(),
      Key: key,
    }),
  );
}
