/**
 * Compress image file if it exceeds the maximum size
 * @param file - The image file to compress
 * @param maxSizeMB - Maximum file size in MB (default: 4.5)
 * @param maxWidthOrHeight - Maximum width or height in pixels (default: 1920)
 * @returns Compressed file or original if already small enough
 */
export async function compressImage(
    file: File,
    maxSizeMB: number = 4.5,
    maxWidthOrHeight: number = 1920,
): Promise<File> {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
        return file;
    }

    // Check if file size is already within limit
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB <= maxSizeMB) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = async () => {
                // Calculate new dimensions
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidthOrHeight) {
                        height = (height * maxWidthOrHeight) / width;
                        width = maxWidthOrHeight;
                    }
                } else {
                    if (height > maxWidthOrHeight) {
                        width = (width * maxWidthOrHeight) / height;
                        height = maxWidthOrHeight;
                    }
                }

                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Binary search for optimal quality
                let minQuality = 0.5;
                let maxQuality = 0.98;
                let bestFile: File | null = null;
                let bestQuality = 0;
                const targetSizeBytes = maxSizeMB * 1024 * 1024;
                const tolerance = 0.05 * 1024 * 1024; // 50KB tolerance

                // Try to find the best quality that fits within size limit
                for (let i = 0; i < 8; i++) {
                    const quality = (minQuality + maxQuality) / 2;

                    const blob = await new Promise<Blob | null>(
                        (resolveBlob) => {
                            canvas.toBlob(
                                (blob) => resolveBlob(blob),
                                file.type,
                                quality,
                            );
                        },
                    );

                    if (!blob) continue;

                    const tempFile = new File([blob], file.name, {
                        type: file.type,
                        lastModified: Date.now(),
                    });

                    if (tempFile.size <= targetSizeBytes) {
                        // This quality works, try higher
                        bestFile = tempFile;
                        bestQuality = quality;
                        minQuality = quality;

                        // If we're very close to target, stop
                        if (tempFile.size >= targetSizeBytes - tolerance) {
                            break;
                        }
                    } else {
                        // Too large, try lower quality
                        maxQuality = quality;
                    }
                }

                // If binary search didn't find anything, try with minimum quality
                if (!bestFile) {
                    const blob = await new Promise<Blob | null>(
                        (resolveBlob) => {
                            canvas.toBlob(
                                (blob) => resolveBlob(blob),
                                file.type,
                                0.5,
                            );
                        },
                    );

                    if (blob) {
                        bestFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now(),
                        });
                    }
                }

                if (!bestFile) {
                    reject(new Error('Failed to compress image'));
                    return;
                }

                resolve(bestFile);
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = e.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Format file size to human readable string
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
