import { CostAnalyzer } from '../../src/core/analyzer';
import { CostRegistry } from '../../src/core/cost-registry';
import { PluginRegistry } from '../../src/plugins/plugin-registry';
import { DetectHardcodedModelsRule } from '../../src/plugins/rules/detect-hardcoded-models';
import { CostOptimizationRecommender } from '../../src/plugins/recommendations/cost-optimization';
import * as path from 'path';

describe('End-to-End Analysis', () => {
  it('should analyze sample project and detect expensive models', async () => {
    const sampleProjectPath = path.join(__dirname, '../fixtures/sample-project');

    // Initialize registry and plugins
    const costRegistry = new CostRegistry();
    const pluginRegistry = new PluginRegistry();

    // Register plugins
    pluginRegistry.registerRule(new DetectHardcodedModelsRule());
    pluginRegistry.registerRecommender(new CostOptimizationRecommender());

    // Create analyzer and run analysis
    const analyzer = new CostAnalyzer(sampleProjectPath, costRegistry, pluginRegistry);
    const result = await analyzer.analyze({
      repoPath: sampleProjectPath,
      patterns: ['src/**/*.ts'],
    });

    // Assertions
    expect(result).toBeDefined();
    expect(result.selectionPoints).toBeDefined();
    expect(result.selectionPoints.length).toBeGreaterThan(0);
    expect(result.recommendations).toBeDefined();
    expect(result.recommendations.length).toBeGreaterThan(0);

    // Check that we detected hardcoded expensive models
    const hardcodedRecs = result.recommendations.filter(r =>
      r.message.includes('hardcoded') && r.message.includes('expensive')
    );
    expect(hardcodedRecs.length).toBeGreaterThan(0);

    // Verify the flagged files include our expensive model
    const allAffectedFiles = hardcodedRecs.flatMap(r => r.affected);
    const hasExpensiveFile = allAffectedFiles.some(f => f.includes('expensive'));
    expect(hasExpensiveFile).toBe(true);
  });
});
