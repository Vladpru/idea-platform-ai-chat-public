import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

const UPLOAD_FOLDER = 'avatars';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly config: ConfigService) {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName?.trim() || !apiKey?.trim() || !apiSecret?.trim()) {
      throw new Error(
        'Cloudinary is not configured: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET',
      );
    }

    cloudinary.config({
      cloud_name: cloudName.trim(),
      api_key: apiKey.trim(),
      api_secret: apiSecret.trim(),
      secure: true,
    });
  }

  async uploadAvatar(file: Express.Multer.File): Promise<string> {
    if (!file?.buffer || !Buffer.isBuffer(file.buffer)) {
      throw new BadRequestException(
        'Avatar upload requires an in-memory file buffer (use Multer memory storage)',
      );
    }

    const source = Readable.from(file.buffer);

    return await new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: UPLOAD_FOLDER,
          resource_type: 'image',
        },
        (err, result) => {
          if (err) {
            reject(
              new InternalServerErrorException(
                `Cloudinary upload failed: ${err.message ?? 'unknown error'}`,
              ),
            );
            return;
          }
          const secureUrl = result?.secure_url;
          if (typeof secureUrl !== 'string' || secureUrl.length === 0) {
            reject(
              new InternalServerErrorException(
                'Cloudinary upload succeeded but returned no secure_url',
              ),
            );
            return;
          }
          resolve(secureUrl);
        },
      );

      source.on('error', reject);
      uploadStream.on('error', reject);
      source.pipe(uploadStream);
    });
  }

  /**
   * Best-effort removal of an asset by delivery URL. Swallows errors so callers are not crashed
   * by CDN/API issues or malformed URLs.
   */
  async deleteAvatar(fileUrl: string): Promise<void> {
    let publicId: string;
    try {
      publicId = this.extractPublicIdFromDeliveryUrl(fileUrl);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.warn(
        `Avatar delete skipped (could not parse public_id): ${message}`,
      );
      return;
    }

    try {
      const res = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
      });
      if (res.result !== 'ok' && res.result !== 'not found') {
        this.logger.warn(
          `Cloudinary destroy returned unexpected result for public_id=${publicId}: ${String(res.result)}`,
        );
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.warn(
        `Cloudinary destroy failed for public_id=${publicId}: ${message}`,
      );
    }
  }

  /**
   * Parses a Cloudinary HTTPS delivery URL and returns public_id (no extension), e.g. `avatars/abc`.
   * Supports optional transformation segments (comma-separated) and version prefix `v123`.
   */
  private extractPublicIdFromDeliveryUrl(fileUrl: string): string {
    let parsed: URL;
    try {
      parsed = new URL(fileUrl);
    } catch {
      throw new Error('Invalid URL');
    }

    const pathname = parsed.pathname;
    const marker = '/upload/';
    const uploadIdx = pathname.indexOf(marker);
    if (uploadIdx === -1) {
      throw new Error('URL is not a Cloudinary /upload/ delivery URL');
    }

    let tail = pathname.slice(uploadIdx + marker.length);
    const q = tail.indexOf('?');
    if (q !== -1) {
      tail = tail.slice(0, q);
    }

    const segments = tail.split('/').filter(Boolean);
    while (segments.length > 0) {
      const head = segments[0] ?? '';
      if (/^v\d+$/i.test(head)) {
        segments.shift();
        continue;
      }
      if (head.includes(',')) {
        segments.shift();
        continue;
      }
      break;
    }

    const joined = segments.join('/');
    if (!joined) {
      throw new Error('Empty public_id path after /upload/');
    }

    return joined.replace(/\.[^/.]+$/, '');
  }
}
