import { s3Configuration, StorageType } from '@app/common';
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class AwsS3Service {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly s3Url: string;

  constructor(
    @Inject(s3Configuration.KEY)
    private readonly s3Config: ConfigType<typeof s3Configuration>,
  ) {
    this.bucket = this.s3Config.awsS3BucketName;
    this.s3Url = this.s3Config.awsS3Url;

    this.s3Client = new S3Client({
      region: this.s3Config.awsS3Region,
      ...(this.s3Config.storageType === StorageType.Minio
        ? {
            endpoint: this.s3Url,
            forcePathStyle: true,
          }
        : {}),
      credentials: this.s3Config.awsS3CredentialsRequired
        ? {
            accessKeyId: this.s3Config.awsS3AccessKeyId,
            secretAccessKey: this.s3Config.awsS3SecretAccessKey,
          }
        : undefined,
    });
  }

  isConfigured() {
    return Boolean(
      this.bucket &&
        this.s3Url &&
        this.s3Config.awsS3Region &&
        (!this.s3Config.awsS3CredentialsRequired ||
          (this.s3Config.awsS3AccessKeyId && this.s3Config.awsS3SecretAccessKey)),
    );
  }

  private assertConfigured() {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException('File storage is not configured');
    }
  }

  async getPresignedUploadUrl(
    fileName: string,
    contentType: string,
    bucketFolder?: string,
  ): Promise<{ uploadUrl: string; fileUrl: string; fileKey: string }> {
    this.assertConfigured();
    const fileKey = bucketFolder
      ? `${bucketFolder.replace(/^\/|\/$/g, '')}/${fileName}`
      : fileName;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 900, // 15 minutes
    });

    const baseUrl = this.s3Url.replace(/\/+$/, '');
    const fileUrl = `${baseUrl}/${encodeURI(fileKey)}`;

    return { uploadUrl, fileUrl, fileKey };
  }

  async uploadFile(
    fileName: string,
    contentType: string,
    body: Buffer,
    bucketFolder?: string,
  ): Promise<{ fileKey: string }> {
    this.assertConfigured();
    const fileKey = bucketFolder ? `${bucketFolder}/${fileName}` : `${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      Body: body,
      ContentType: contentType,
    });
    await this.s3Client.send(command);

    return { fileKey };
  }

  async assertObjectExists(fileKey: string) {
    this.assertConfigured();
    await this.s3Client.send(
      new HeadObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      }),
    );
  }

  async getPresignedDownloadUrl(
    fileKey: string,
    fileName?: string,
    contentType?: string,
  ): Promise<string> {
    this.assertConfigured();
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      ...(contentType ? { ResponseContentType: contentType } : {}),
      ...(fileName
        ? {
            ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
          }
        : {}),
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: 900 });
  }
}
