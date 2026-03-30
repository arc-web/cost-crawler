import { ModelSelectionPoint, Recommendation } from '../../core/types';
import { IRule } from '../plugin-registry';

export class DetectHardcodedModelsRule implements IRule {
  name = 'detect-hardcoded-models';

  private readonly expensiveModels = [
    'gpt-4',
    'claude-3-opus',
    'claude-3.5-sonnet',
  ];

  check(points: ModelSelectionPoint[]): Recommendation[] {
    const recommendations: Recommendation[] = [];
    let recId = 0;

    // Filter for hardcoded selection points
    const hardcodedPoints = points.filter(p => p.type === 'hardcoded');

    // Filter for expensive models
    const expensivePoints = hardcodedPoints.filter(p =>
      this.isExpensiveModel(p.selectedModel)
    );

    if (expensivePoints.length === 0) {
      return [];
    }

    // Group by model
    const byModel = new Map<string, ModelSelectionPoint[]>();
    for (const point of expensivePoints) {
      if (!byModel.has(point.selectedModel)) {
        byModel.set(point.selectedModel, []);
      }
      byModel.get(point.selectedModel)!.push(point);
    }

    // Create a recommendation for each expensive model
    for (const [model, pointsList] of byModel.entries()) {
      const files = pointsList.map(p => p.file);
      const uniqueFiles = Array.from(new Set(files));

      recommendations.push({
        id: `rec_hardcoded_${recId++}`,
        severity: 'warning',
        title: `Hardcoded expensive model: ${model}`,
        description: `Found hardcoded usage of expensive model ${model} in ${pointsList.length} location(s). Consider using environment variables or configuration for model selection.`,
        affectedFiles: uniqueFiles,
        suggestedAction: `Replace hardcoded ${model} with a configurable model selection mechanism.`,
        estimatedSavings: pointsList.length * 100, // Rough estimate
      });
    }

    return recommendations;
  }

  private isExpensiveModel(model: string): boolean {
    return this.expensiveModels.some(expensive =>
      model.toLowerCase().includes(expensive.toLowerCase())
    );
  }
}
