import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

const uploadDir = path.resolve("/tmp", env.UPLOAD_DIR);
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(
            null,
            `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`,
        );
    },
});

export const upload = multer({
    storage,
    limits: { fileSize: env.MAX_UPLOAD_BYTES },
    fileFilter: (_req, file, cb) => {
        const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
        if (!allowed.has(file.mimetype))
            return cb(
                new HttpError(
                    400,
                    "Only JPG, PNG, and WebP images are allowed",
                ),
            );
        cb(null, true);
    },
});
