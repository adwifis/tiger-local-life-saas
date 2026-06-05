export type StorageStatus = {
  configured: boolean;
  provider: "oss-compatible";
  missing: string[];
  bucket?: string;
  endpoint?: string;
};

const requiredKeys = ["S3_ENDPOINT", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_BUCKET"];

export function getStorageStatus(): StorageStatus {
  const missing = requiredKeys.filter((key) => !process.env[key]);

  return {
    configured: missing.length === 0,
    provider: "oss-compatible",
    missing,
    bucket: process.env.S3_BUCKET,
    endpoint: process.env.S3_ENDPOINT
  };
}

export function buildAssetKey(input: { merchantId: string; fileName: string }) {
  const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `merchants/${input.merchantId}/assets/${Date.now()}-${safeFileName}`;
}

export function buildDeliveryKey(input: { merchantId: string; taskId: string; fileName: string }) {
  const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `merchants/${input.merchantId}/deliveries/${input.taskId}/${safeFileName}`;
}
