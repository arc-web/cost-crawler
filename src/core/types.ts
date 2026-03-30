export interface ModelSelectionPoint {
  id: string;
  file: string;
  line: number;
  column: number;
  type: 'config' | 'env' | 'hardcoded' | 'conditional' | 'function_param' | 'dependency';
  selectedModel: string;
  costTier: 'free' | 'paid' | 'mixed' | 'unknown';
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
  timestamp: number;
  selectionPoints: ModelSelectionPoint[];
  dependencyChains: DependencyChain[];
  costProfiles: Record<string, CostProfile>;
  recommendations: Recommendation[];
  smokeTestResults?: SmokeTestResult[];
}

export interface Recommendation {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  affectedFiles: string[];
  suggestedAction: string;
  estimatedSavings?: number;
}

export interface SmokeTestResult {
  testType: 'trace' | 'simulate';
  scenario: string;
  modelsUsed: string[];
  estimatedCost: number;
  status: 'pass' | 'fail' | 'inconclusive';
  evidence: string;
}

export interface CostCrawlerConfig {
  repoPath: string;
  patterns?: string[]; // Glob patterns for files to analyze
  costRegistry?: Record<string, CostProfile>;
  plugins?: string[]; // Plugin names to enable
  runSmokeTests?: boolean;
  outputFormat?: 'json' | 'cli' | 'csv';
}
