import { ModelSelectionPoint, Recommendation, AnalysisResult } from '../core/types';

export interface IRule {
  name: string;
  check(points: ModelSelectionPoint[]): Recommendation[];
}

export interface IRecommender {
  name: string;
  recommend(result: AnalysisResult): Recommendation[];
}

export class PluginRegistry {
  private rules: Map<string, IRule> = new Map();
  private recommenders: Map<string, IRecommender> = new Map();

  registerRule(rule: IRule): void {
    this.rules.set(rule.name, rule);
  }

  registerRecommender(recommender: IRecommender): void {
    this.recommenders.set(recommender.name, recommender);
  }

  getRules(): IRule[] {
    return Array.from(this.rules.values());
  }

  getRecommenders(): IRecommender[] {
    return Array.from(this.recommenders.values());
  }

  runAllRules(points: ModelSelectionPoint[]): Recommendation[] {
    const allRecommendations: Recommendation[] = [];

    for (const rule of this.getRules()) {
      const recommendations = rule.check(points);
      allRecommendations.push(...recommendations);
    }

    return allRecommendations;
  }

  runAllRecommenders(result: AnalysisResult): Recommendation[] {
    const allRecommendations: Recommendation[] = [];

    for (const recommender of this.getRecommenders()) {
      const recommendations = recommender.recommend(result);
      allRecommendations.push(...recommendations);
    }

    return allRecommendations;
  }
}
