import * as path from 'path';
import { globSync } from 'glob';
import { ASTAnalyzer } from './ast-analyzer';
import { CostRegistry } from './cost-registry';
import { ModelSelectionPoint } from './types';

export class Crawler {
  private repoPath: string;
  private costRegistry: CostRegistry;
  private analyzer: ASTAnalyzer;

  constructor(repoPath: string, costRegistry: CostRegistry) {
    this.repoPath = repoPath;
    this.costRegistry = costRegistry;
    this.analyzer = new ASTAnalyzer(costRegistry);
  }

  crawl(patterns: string[]): ModelSelectionPoint[] {
    const defaultPatterns = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'];
    const patternsToUse = patterns.length > 0 ? patterns : defaultPatterns;

    // Exclusion patterns
    const excludePatterns = [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/*.test.ts',
      '**/*.spec.ts',
    ];

    const allPatterns = patternsToUse.map(pattern => {
      // Resolve pattern relative to repo path
      return path.join(this.repoPath, pattern);
    });

    // Perform glob search
    const files = globSync(allPatterns, {
      cwd: this.repoPath,
      ignore: excludePatterns,
      absolute: false,
    });

    console.log(`Found ${files.length} files matching patterns`);

    const allSelectionPoints: ModelSelectionPoint[] = [];

    // Analyze each file
    for (const file of files) {
      const absolutePath = path.join(this.repoPath, file);
      const selectionPoints = this.analyzer.analyze(absolutePath);

      // Normalize file paths to relative paths
      for (const point of selectionPoints) {
        point.file = path.relative(this.repoPath, point.file);
        allSelectionPoints.push(point);
      }
    }

    console.log(`Found ${allSelectionPoints.length} model selection points`);

    return allSelectionPoints;
  }
}
