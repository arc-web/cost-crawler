import { AnalysisResult, Recommendation } from '../../core/types';
import { IRecommender } from '../plugin-registry';

export class CostOptimizationRecommender implements IRecommender {
  name = 'cost-optimization';

  recommend(result: AnalysisResult): Recommendation[] {
    const recommendations: Recommendation[] = [];
    let recId = 0;

    // Analyze selection points for consolidation opportunities
    const expensivePoints = result.selectionPoints.filter(
      p => p.costTier === 'paid' || p.costTier === 'mixed'
    );

    if (expensivePoints.length === 0) {
      return [];
    }

    // Group expensive points by model
    const byModel = new Map<string, typeof expensivePoints>();
    for (const point of expensivePoints) {
      if (!byModel.has(point.selectedModel)) {
        byModel.set(point.selectedModel, []);
      }
      byModel.get(point.selectedModel)!.push(point);
    }

    // Check if there are multiple expensive models used
    if (byModel.size > 1) {
      const models = Array.from(byModel.keys());
      const files = Array.from(new Set(expensivePoints.map(p => p.file)));

      recommendations.push({
        id: `rec_consolidate_${recId++}`,
        severity: 'warning',
        message: `Found ${models.length} different expensive models (${models.join(', ')}) used across ${files.length} files. Consider consolidating to a single model for cost efficiency.`,
        affected: files,
        suggestedAction: `Consolidate usage to a single cost-efficient model like claude-3-haiku or gpt-3.5-turbo.`,
        estimatedSavings: expensivePoints.length * 50, // Rough estimate per point
      });
    }

    // Check for high concentration of expensive models in single files
    const fileExpensiveCount = new Map<string, number>();
    for (const point of expensivePoints) {
      fileExpensiveCount.set(
        point.file,
        (fileExpensiveCount.get(point.file) || 0) + 1
      );
    }

    for (const [file, count] of fileExpensiveCount.entries()) {
      if (count > 2) {
        recommendations.push({
          id: `rec_file_concentration_${recId++}`,
          severity: 'info',
          message: `File ${file} contains ${count} expensive model selections. Consider refactoring to use a single model selector.`,
          affected: [file],
          suggestedAction: `Refactor model selection logic to centralize decision-making.`,
          estimatedSavings: count * 25,
        });
      }
    }

    return recommendations;
  }
}
