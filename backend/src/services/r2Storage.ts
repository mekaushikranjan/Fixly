import { DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

const MAX_SIGNED_URL_TTL_SECONDS = 7 * 24 * 60 * 60;
let cachedClient: S3Client | undefined;

export class R2StorageConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'R2StorageConfigurationError';
  }
}

export interface UploadedIssuePhoto {
  downloadUrl: string;
  remove: () => Promise<void>;
}

export type UploadedProfilePhoto = UploadedIssuePhoto;

function getR2Configuration() {
  const endpoint = process.env.R2_ENDPOINT?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const missing = [
    !endpoint && 'R2_ENDPOINT',
    !bucket && 'R2_BUCKET_NAME',
    !accessKeyId && 'R2_ACCESS_KEY_ID',
    !secretAccessKey && 'R2_SECRET_ACCESS_KEY',
  ].filter((name): name is string => Boolean(name));

  if (missing.length) {
    throw new R2StorageConfigurationError(
      `Configure ${missing.join(', ')} in the backend environment to upload issue photos to Cloudflare R2.`,
    );
  }

  let parsedEndpoint: URL;
  try {
    parsedEndpoint = new URL(endpoint!);
  } catch {
    throw new R2StorageConfigurationError('R2_ENDPOINT must be a valid Cloudflare R2 S3 API endpoint URL.');
  }
  if (!['https:', 'http:'].includes(parsedEndpoint.protocol)
    || parsedEndpoint.pathname !== '/'
    || parsedEndpoint.search
    || parsedEndpoint.hash) {
    throw new R2StorageConfigurationError(
      'R2_ENDPOINT must be the S3 API origin only. Set R2_BUCKET_NAME separately.',
    );
  }

  const configuredTtl = Number(process.env.R2_SIGNED_URL_TTL_SECONDS || 604800);
  if (!Number.isInteger(configuredTtl) || configuredTtl < 60 || configuredTtl > MAX_SIGNED_URL_TTL_SECONDS) {
    throw new R2StorageConfigurationError('R2_SIGNED_URL_TTL_SECONDS must be between 60 and 604800.');
  }

  return { endpoint: parsedEndpoint.origin, bucket: bucket!, accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey!, configuredTtl };
}

function getR2Client(configuration: ReturnType<typeof getR2Configuration>): S3Client {
  if (!cachedClient) {
    cachedClient = new S3Client({
      endpoint: configuration.endpoint,
      region: 'auto',
      forcePathStyle: true,
      credentials: {
        accessKeyId: configuration.accessKeyId,
        secretAccessKey: configuration.secretAccessKey,
      },
    });
  }
  return cachedClient;
}

export async function checkR2Connection(): Promise<void> {
  const configuration = getR2Configuration();
  await getR2Client(configuration).send(new HeadBucketCommand({ Bucket: configuration.bucket }));
}

export async function uploadIssuePhoto(
  userId: string,
  base64: string,
  contentType: string,
): Promise<UploadedIssuePhoto> {
  return uploadPhoto(`issue-photos/${userId}`, base64, contentType);
}

export async function uploadUserAvatar(
  userId: string,
  base64: string,
  contentType: string,
): Promise<UploadedProfilePhoto> {
  return uploadPhoto(`profile-photos/${userId}`, base64, contentType);
}

async function uploadPhoto(
  prefix: string,
  base64: string,
  contentType: string,
): Promise<UploadedIssuePhoto> {
  const configuration = getR2Configuration();
  const client = getR2Client(configuration);
  const key = `${prefix}/${randomUUID()}`;

  await client.send(new PutObjectCommand({
    Bucket: configuration.bucket,
    Key: key,
    Body: Buffer.from(base64, 'base64'),
    ContentType: contentType,
  }));

  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, '');
  const downloadUrl = publicBaseUrl
    ? `${publicBaseUrl}/${key.split('/').map(encodeURIComponent).join('/')}`
    : await getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: configuration.bucket,
        Key: key,
      }),
      { expiresIn: configuration.configuredTtl },
    );

  return {
    downloadUrl,
    remove: async () => {
      await client.send(new DeleteObjectCommand({
        Bucket: configuration.bucket,
        Key: key,
      }));
    },
  };
}
