import fs from "fs/promises";
import path from "path";
import { config, publicBaseUrl } from "../config";
import type { StorageProvider } from "../types";

/**
 * LocalDiskProvider — writes <AUDIO_DIR>/<id>.mp3 and returns the URL served by
 * GET /audio/:id. A future R2/S3 impl would upload + return a public URL with
 * the same envelope shape.
 */
export class LocalDiskProvider implements StorageProvider {
  async save(audio: Buffer, id: string): Promise<string> {
    await fs.mkdir(config.AUDIO_DIR, { recursive: true });
    const filePath = path.join(config.AUDIO_DIR, `${id}.mp3`);
    await fs.writeFile(filePath, audio);
    // EXACT format: http://localhost:<ENGINE_PORT>/audio/<id>.mp3
    return `${publicBaseUrl()}/audio/${id}.mp3`;
  }
}
