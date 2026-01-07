import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';

export interface CloudinaryUploadResult {
    publicId: string;
    url: string;
    secureUrl: string;
    format: string;
    resourceType: string;
    bytes: number;
    width?: number;
    height?: number;
    duration?: number;
}

export class CloudinaryService {
    constructor() {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
    }

    /**
     * Upload image to Cloudinary
     */
    async uploadImage(
        file: Express.Multer.File,
        folder: string = 'teamup/images'
    ): Promise<CloudinaryUploadResult> {
        try {
            const result = await this.uploadFile(file, folder, 'image', {
                transformation: [
                    { quality: 'auto', fetch_format: 'auto' },
                    { width: 1920, height: 1080, crop: 'limit' }
                ]
            });
            return result;
        } catch (error) {
            throw new Error(`Image upload failed: ${error}`);
        }
    }

    /**
     * Upload audio to Cloudinary
     */
    async uploadAudio(
        file: Express.Multer.File,
        folder: string = 'teamup/audio'
    ): Promise<CloudinaryUploadResult> {
        try {
            const result = await this.uploadFile(file, folder, 'video', {
                resource_type: 'video',
                format: 'mp3'
            });
            return result;
        } catch (error) {
            throw new Error(`Audio upload failed: ${error}`);
        }
    }

    /**
     * Upload document to Cloudinary
     */
    async uploadDocument(
        file: Express.Multer.File,
        folder: string = 'teamup/documents'
    ): Promise<CloudinaryUploadResult> {
        try {
            const result = await this.uploadFile(file, folder, 'raw');
            return result;
        } catch (error) {
            throw new Error(`Document upload failed: ${error}`);
        }
    }

    /**
     * Generic file upload method
     */
    private async uploadFile(
        file: Express.Multer.File,
        folder: string,
        resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto',
        options: any = {}
    ): Promise<CloudinaryUploadResult> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: resourceType,
                    ...options
                },
                (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                    if (error) {
                        reject(error);
                    } else if (result) {
                        resolve({
                            publicId: result.public_id,
                            url: result.url,
                            secureUrl: result.secure_url,
                            format: result.format,
                            resourceType: result.resource_type,
                            bytes: result.bytes,
                            width: result.width,
                            height: result.height,
                            duration: result.duration
                        });
                    } else {
                        reject(new Error('Upload failed: No result returned'));
                    }
                }
            );

            // Convert buffer to stream and pipe to Cloudinary
            const bufferStream = new Readable();
            bufferStream.push(file.buffer);
            bufferStream.push(null);
            bufferStream.pipe(uploadStream);
        });
    }

    /**
     * Delete file from Cloudinary
     */
    async deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<void> {
        try {
            await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        } catch (error) {
            throw new Error(`File deletion failed: ${error}`);
        }
    }

    /**
     * Get optimized image URL
     */
    getOptimizedImageUrl(publicId: string, width?: number, height?: number): string {
        return cloudinary.url(publicId, {
            transformation: [
                { quality: 'auto', fetch_format: 'auto' },
                { width, height, crop: 'limit' }
            ]
        });
    }

    /**
     * Generate signed URL for private resources
     */
    getSignedUrl(publicId: string, expiresIn: number = 3600): string {
        const timestamp = Math.floor(Date.now() / 1000) + expiresIn;
        return cloudinary.url(publicId, {
            sign_url: true,
            type: 'authenticated',
            expires_at: timestamp
        });
    }
}
