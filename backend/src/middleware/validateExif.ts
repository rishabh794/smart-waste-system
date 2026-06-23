import { Request, Response, NextFunction } from 'express';
import exifr from 'exifr';

export const validateExif = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    // If no image URL is provided, continue to let the schema validation handle it
    return next();
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return res.status(400).json({ error: 'Failed to fetch the uploaded image for EXIF validation.' });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse EXIF metadata
    const exifData = await exifr.parse(buffer).catch(() => null);

    if (!exifData) {
      return res.status(400).json({ error: 'Image lacks EXIF metadata. Downloaded images and screenshots are not allowed.' });
    }

    const { Make, Model, Software } = exifData;

    // Check if it's a screenshot based on software or lack of device Make/Model
    if (!Make && !Model) {
      return res.status(400).json({ error: 'Image lacks camera Make/Model EXIF data. Downloaded images are not allowed.' });
    }

    if (Software && typeof Software === 'string') {
      const lowerSoftware = Software.toLowerCase();
      if (lowerSoftware.includes('screenshot') || lowerSoftware.includes('snipping') || lowerSoftware.includes('capture')) {
        return res.status(400).json({ error: 'Screenshots are not allowed. Please take a live photo.' });
      }
    }

    // Pass validation
    next();
  } catch (error) {
    console.error('EXIF validation error:', error);
    return res.status(500).json({ error: 'Internal server error during image validation.' });
  }
};
