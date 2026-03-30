import { CostProfile } from './types';

export class CostRegistry {
  private profiles: Map<string, CostProfile> = new Map();
  private readonly TOKENS_PER_HOUR = 1_000_000;
  private readonly CALLS_PER_HOUR = 100;

  constructor(customProfiles?: Record<string, CostProfile>) {
    this.initializeDefaults();
    if (customProfiles) {
      Object.entries(customProfiles).forEach(([model, profile]) => {
        this.register(model, profile);
      });
    }
  }

  initializeDefaults(): void {
    const defaults: Record<string, CostProfile> = {
      'ollama': {
        model: 'ollama',
        tier: 'free',
        costPerUnit: 0,
        unit: 'hour',
        provider: 'Ollama',
        estimatedMonthlyIfActive: 0,
      },
      'node-local': {
        model: 'node-local',
        tier: 'free',
        costPerUnit: 0,
        unit: 'hour',
        provider: 'Local Node.js',
        estimatedMonthlyIfActive: 0,
      },
      'claude-3-opus': {
        model: 'claude-3-opus',
        tier: 'paid',
        costPerUnit: 0.015,
        unit: 'token',
        provider: 'Anthropic',
        estimatedMonthlyIfActive: 450,
      },
      'claude-3-sonnet': {
        model: 'claude-3-sonnet',
        tier: 'paid',
        costPerUnit: 0.003,
        unit: 'token',
        provider: 'Anthropic',
        estimatedMonthlyIfActive: 90,
      },
      'gpt-4': {
        model: 'gpt-4',
        tier: 'paid',
        costPerUnit: 0.03,
        unit: 'token',
        provider: 'OpenAI',
        estimatedMonthlyIfActive: 900,
      },
      'gpt-3.5-turbo': {
        model: 'gpt-3.5-turbo',
        tier: 'paid',
        costPerUnit: 0.0005,
        unit: 'token',
        provider: 'OpenAI',
        estimatedMonthlyIfActive: 15,
      },
      'claude-3-haiku': {
        model: 'claude-3-haiku',
        tier: 'free',
        costPerUnit: 0,
        unit: 'token',
        provider: 'Anthropic',
        estimatedMonthlyIfActive: 0,
      },
      'llama2': {
        model: 'llama2',
        tier: 'free',
        costPerUnit: 0,
        unit: 'token',
        provider: 'Local',
        estimatedMonthlyIfActive: 0,
      },
      'mixtral': {
        model: 'mixtral',
        tier: 'free',
        costPerUnit: 0,
        unit: 'token',
        provider: 'Local',
        estimatedMonthlyIfActive: 0,
      },
    };

    Object.entries(defaults).forEach(([model, profile]) => {
      this.profiles.set(model, profile);
    });
  }

  register(model: string, profile: CostProfile): void {
    if (!profile.model || profile.costPerUnit < 0) {
      throw new Error(`Invalid CostProfile: ${profile.model}`);
    }
    this.profiles.set(model, profile);
  }

  get(model: string): CostProfile | undefined {
    return this.profiles.get(model);
  }

  getTier(model: string): 'free' | 'paid' | 'unknown' {
    const profile = this.get(model);
    if (!profile) return 'unknown';
    return profile.tier;
  }

  isExpensive(model: string): boolean {
    const tier = this.getTier(model);
    return tier === 'paid';
  }

  getAll(): Record<string, CostProfile> {
    return Object.fromEntries(this.profiles);
  }

  costDelta(modelA: string, modelB: string): number {
    const profileA = this.get(modelA);
    const profileB = this.get(modelB);

    if (!profileA || !profileB) {
      throw new Error(
        `CostProfile not found: ${!profileA ? modelA : modelB}`
      );
    }

    // Normalize to hourly cost for comparison
    const hourlyA = this.normalizeToHourly(profileA);
    const hourlyB = this.normalizeToHourly(profileB);

    return hourlyB - hourlyA;
  }

  normalizeToHourly(profile: CostProfile): number {
    switch (profile.unit) {
      case 'hour':
        return profile.costPerUnit;
      case 'token':
        // Assume ~1M tokens per hour as a standard metric
        return profile.costPerUnit * this.TOKENS_PER_HOUR;
      case 'call':
      case 'request':
        // Assume ~100 calls per hour
        return profile.costPerUnit * this.CALLS_PER_HOUR;
      default:
        return 0;
    }
  }
}

export const defaultRegistry = new CostRegistry();
