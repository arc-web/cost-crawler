export const PATTERN_TYPES = {
  CONFIG: 'config',
  ENV: 'env',
  HARDCODED: 'hardcoded',
  CONDITIONAL: 'conditional',
} as const;

export const CONFIG_PATTERNS = [
  /model\s*[:=]\s*["']([a-z0-9\-\.]+)["']/gi,
  /modelName\s*[:=]\s*["']([a-z0-9\-\.]+)["']/gi,
  /modelId\s*[:=]\s*["']([a-z0-9\-\.]+)["']/gi,
  /llmModel\s*[:=]\s*["']([a-z0-9\-\.]+)["']/gi,
  /aiModel\s*[:=]\s*["']([a-z0-9\-\.]+)["']/gi,
  /model\s*["']?\s*:\s*["']([a-z0-9\-\.]+)["']/gi,
];

export const ENV_PATTERNS = [
  /process\.env\.([A-Z_]+(?:MODEL|LLM|AI)[A-Z_]*)/gi,
  /process\.env\.([A-Z_]*MODEL[A-Z_]*)/gi,
  /process\.env\["([A-Z_]*MODEL[A-Z_]*)"\]/gi,
  /process\.env\['([a-z_]*model[a-z_]*)'\]/gi,
];

export const HARDCODED_PATTERNS = [
  /["'](?:gpt-4|gpt-3\.5-turbo|claude-3-opus|claude-3-sonnet|claude-3-haiku|llama2|mixtral)["']/gi,
  /model\s*:\s*["'](?:gpt-4|gpt-3\.5-turbo|claude-3-opus|claude-3-sonnet)["']/gi,
];

export const CONDITIONAL_PATTERNS = [
  /if\s*\([^)]*model[^)]*\)/gi,
  /switch\s*\([^)]*model[^)]*\)/gi,
  /\?\s*["']([a-z0-9\-\.]+)["']\s*:/gi,
  /model\s*===\s*["']([a-z0-9\-\.]+)["']/gi,
];

export const KNOWN_MODELS = [
  'gpt-4',
  'gpt-3.5-turbo',
  'claude-3-opus',
  'claude-3-sonnet',
  'claude-3-haiku',
  'llama2',
  'mixtral',
  'ollama',
  'node-local',
];

export function isModelName(name: string): boolean {
  return KNOWN_MODELS.some(
    model => model.toLowerCase() === name.toLowerCase()
  );
}
