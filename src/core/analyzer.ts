import { Crawler } from './crawler';
import { DependencyTracer } from './dependency-tracer';
import { CostRegistry } from './cost-registry';
import { AnalysisResult, CostCrawlerConfig } from './types';
import { PluginRegistry } from '../plugins/plugin-registry';

export class CostAnalyzer {
  private repoPath: string;
  private costRegistry: CostRegistry;
  private pluginRegistry: PluginRegistry;
  private crawler: Crawler;
  private dependencyTracer: DependencyTracer | null = null;

  constructor(repoPath: string, costRegistry: CostRegistry, pluginRegistry: PluginRegistry) {
    this.repoPath = repoPath;
    this.costRegistry = costRegistry;
    this.pluginRegistry = pluginRegistry;
    this.crawler = new Crawler(repoPath, costRegistry);
  }

  async analyze(config: CostCrawlerConfig): Promise<AnalysisResult> {
    // Step 1: Crawl repository
    const selectionPoints = this.crawler.crawl(config.patterns || []);

    // Step 2: Trace dependencies
    this.dependencyTracer = new DependencyTracer(selectionPoints, this.costRegistry);
    const dependencyChains = this.dependencyTracer.trace();

    // Step 3: Run plugin rules
    const ruleRecommendations = this.pluginRegistry.runAllRules(selectionPoints);

    // Step 4: Create initial result for recommenders
    const initialResult: AnalysisResult = {
      repoPath: this.repoPath,
      timestamp: new Date().toISOString(),
      selectionPoints,
      dependencyChains,
      recommendations: ruleRecommendations,
      smokeTestResults: config.smokeTestResults,
    };

    // Step 5: Run plugin recommenders
    const recommenderRecommendations = this.pluginRegistry.runAllRecommenders(initialResult);

    // Step 6: Combine all recommendations
    const allRecommendations = [...ruleRecommendations, ...recommenderRecommendations];

    // Step 7: Return complete result
    const finalResult: AnalysisResult = {
      repoPath: this.repoPath,
      timestamp: new Date().toISOString(),
      selectionPoints,
      dependencyChains,
      recommendations: allRecommendations,
      smokeTestResults: config.smokeTestResults,
    };

    return finalResult;
  }
}
