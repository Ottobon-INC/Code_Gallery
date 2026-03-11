import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const router = Router();

// ─── Supabase Storage Client ────────────────────────────────────────────────
// Uses the service-role key so uploads bypass Row Level Security.
// DO NOT expose SUPABASE_SERVICE_KEY on the frontend.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = 'component-images'; // create this bucket in Supabase Dashboard → Storage

if (!supabaseUrl || !supabaseKey) {
    console.warn(
        '[upload] SUPABASE_URL or SUPABASE_SERVICE_KEY is not set. ' +
        'Image uploads will fail until these are configured.'
    );
}

const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// ─── Allowed MIME types and their extensions ─────────────────────────────────
const MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
};

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * POST /api/upload
 * Body: { data: string (full data URL or raw base64), mimeType: string }
 * Returns: { success: true, data: { url: string } }
 */
router.post('/', async (req: Request, res: Response) => {
    if (!supabase) {
        return res.status(500).json({
            success: false,
            error: 'Image upload is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY.'
        });
    }

    const { data, mimeType } = req.body as { data?: string; mimeType?: string };

    if (!data || !mimeType) {
        return res.status(400).json({ success: false, error: 'Missing data or mimeType.' });
    }

    const ext = MIME_TO_EXT[mimeType];
    if (!ext) {
        return res.status(400).json({ success: false, error: `Unsupported image type: ${mimeType}` });
    }

    // Strip the optional data URL prefix  (e.g. "data:image/png;base64,…")
    const base64Data = data.replace(/^data:[a-z/+]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.byteLength > MAX_SIZE_BYTES) {
        return res.status(400).json({ success: false, error: 'Image exceeds 5 MB limit.' });
    }

    const filename = `${crypto.randomBytes(12).toString('hex')}${ext}`;

    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filename, buffer, {
            contentType: mimeType,
            upsert: false,
        });

    if (uploadError) {
        console.error('[upload] Supabase storage error:', uploadError.message);
        return res.status(500).json({ success: false, error: uploadError.message });
    }

    // Get the permanent public URL for this file
    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(filename);

    return res.status(200).json({
        success: true,
        data: { url: publicUrlData.publicUrl }
    });
});

export default router;
