import { config } from "../config";
import type { LLMProvider, StorageProvider, TTSProvider } from "../types";
import { ClaudeProvider } from "./claude";
import { ElevenLabsProvider } from "./elevenlabs";
import { LocalDiskProvider } from "./localdisk";
import { MockLLMProvider, MockTTSProvider } from "./mock";

/**
 * Provider factory — reads LLM_PROVIDER / TTS_PROVIDER / STORAGE_PROVIDER from
 * env and returns the selected impl. This is the open-source value prop made
 * visible: registering a new provider = drop a file + add one line to the
 * matching registry below.
 */

const llmRegistry: Record<string, () => LLMProvider> = {
  claude: () => new ClaudeProvider(),
  mock: () => new MockLLMProvider(),
};

const ttsRegistry: Record<string, () => TTSProvider> = {
  elevenlabs: () => new ElevenLabsProvider(),
  mock: () => new MockTTSProvider(),
};

const storageRegistry: Record<string, () => StorageProvider> = {
  local: () => new LocalDiskProvider(),
};

export function getLLMProvider(name: string = config.LLM_PROVIDER): LLMProvider {
  const make = llmRegistry[name.toLowerCase()];
  if (!make) {
    throw new Error(
      `Unknown LLM_PROVIDER "${name}". Known: ${Object.keys(llmRegistry).join(", ")}`
    );
  }
  return make();
}

export function getTTSProvider(name: string = config.TTS_PROVIDER): TTSProvider {
  const make = ttsRegistry[name.toLowerCase()];
  if (!make) {
    throw new Error(
      `Unknown TTS_PROVIDER "${name}". Known: ${Object.keys(ttsRegistry).join(", ")}`
    );
  }
  return make();
}

export function getStorageProvider(
  name: string = config.STORAGE_PROVIDER
): StorageProvider {
  const make = storageRegistry[name.toLowerCase()];
  if (!make) {
    throw new Error(
      `Unknown STORAGE_PROVIDER "${name}". Known: ${Object.keys(storageRegistry).join(", ")}`
    );
  }
  return make();
}
