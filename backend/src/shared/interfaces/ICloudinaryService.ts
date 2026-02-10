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

export interface ICloudinaryService {
    uploadImage(file: Express.Multer.File, folder?: string): Promise<CloudinaryUploadResult>;
    uploadAudio(file: Express.Multer.File, folder?: string): Promise<CloudinaryUploadResult>;
    uploadDocument(file: Express.Multer.File, folder?: string): Promise<CloudinaryUploadResult>;
    deleteFile(publicId: string, resourceType?: 'image' | 'video' | 'raw'): Promise<void>;
    getOptimizedImageUrl(publicId: string, width?: number, height?: number): string;
    getSignedUrl(publicId: string, expiresIn?: number): string;
}
