export interface ModelSelectionPoint {
  id: string;
  file: string;
  line: number;
  column: number;
  type: 'config' | 'env' | 'hardcoded' | 'conditional' | 'function_param' | 'dependency';
  selectedModel: string;
  costTier: 'free' | 'paid' | 'mixed' | 'unknown';
  availableModels: string[];
  condition?: string;
  source?: string;
}

export interface CostProfile {
  model: string;
  tier: 'free' | 'paid';
  costPerUnit: number;
  unit: 'hour' | 'token' | 'call' | 'request';
  provider: string;
  estimatedMonthlyIfActive: number;
}

export interface DecisionNode {
  id: string;
  type: 'config' | 'env' | 'runtime' | 'request' | 'api';
  model: string;
  source: string;
  line: number;
  costTier: 'free' | 'paid';
  dependsOn: string[]; // IDs of parent nodes
  affectsDownstream: string[]; // IDs of child nodes
}

export interface DependencyChain {
  startPoint: ModelSelectionPoint;
  chain: DecisionNode[];
  finalModel: string;
  costDelta: number;
}

export interface AnalysisResult {
  repoPath: string;
  timestamp: string;
  selectionPoints: ModelSelectionPoint[];
  dependencyChains: DependencyChain[];
  recommendations: Recommendation[];
  smokeTestResults?: SmokeTestResult[];
}

export interface Recommendation {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  affected: string[];
  suggestedAction?: string;
  estimatedSavings?: number;
}

export interface SmokeTestResult {
  name: string;
  passed: boolean;
  message?: string;
}

export interface CostCrawlerConfig {
  repoPath: string;
  patterns?: string[]; // Glob patterns for files to analyze
  costRegistry?: Record<string, CostProfile>;
  plugins?: string[]; // Plugin names to enable
  runSmokeTests?: boolean;
  smokeTestResults?: SmokeTestResult[];
  outputFormat?: 'json' | 'cli' | 'csv';
}
