import { AnalysisResult, Recommendation } from '../core/types';

export class CLIReporter {
  format(result: AnalysisResult): string {
    const lines: string[] = [];

    // Header
    lines.push('='.repeat(80));
    lines.push(`Cost Crawler Analysis Report`);
    lines.push(`Repository: ${result.repoPath}`);
    lines.push(`Timestamp: ${result.timestamp}`);
    lines.push('='.repeat(80));
    lines.push('');

    // Selection Points Section
    lines.push('📍 MODEL SELECTION POINTS');
    lines.push('-'.repeat(80));

    if (result.selectionPoints.length === 0) {
      lines.push('No model selection points found.');
    } else {
      for (const point of result.selectionPoints) {
        lines.push(
          `  ${point.file}:${point.line} [${point.type}] → ${point.selectedModel || 'unknown'}`
        );
        lines.push(`    Cost Tier: ${point.costTier} | Models: ${point.availableModels.join(', ')}`);
      }
    }
    lines.push('');

    // Recommendations Section
    lines.push('⚠️  RECOMMENDATIONS');
    lines.push('-'.repeat(80));

    if (result.recommendations.length === 0) {
      lines.push('No recommendations at this time.');
    } else {
      // Group by severity
      const bySeverity = new Map<string, Recommendation[]>();

      for (const rec of result.recommendations) {
        if (!bySeverity.has(rec.severity)) {
          bySeverity.set(rec.severity, []);
        }
        bySeverity.get(rec.severity)!.push(rec);
      }

      // Output in order: critical, warning, info
      const severityOrder = ['critical', 'warning', 'info'];

      for (const severity of severityOrder) {
        const recs = bySeverity.get(severity) || [];
        if (recs.length === 0) continue;

        const icon =
          severity === 'critical'
            ? '🔴'
            : severity === 'warning'
              ? '🟡'
              : '🔵';

        lines.push(`${icon} ${severity.toUpperCase()}`);

        for (const rec of recs) {
          lines.push(`  - ${rec.message}`);
          if (rec.affected.length > 0) {
            lines.push(`    Affects: ${rec.affected.join(', ')}`);
          }
          if (rec.suggestedAction) {
            lines.push(`    Action: ${rec.suggestedAction}`);
          }
        }
        lines.push('');
      }
    }

    // Smoke Test Results
    if (result.smokeTestResults && result.smokeTestResults.length > 0) {
      lines.push('🧪 SMOKE TEST RESULTS');
      lines.push('-'.repeat(80));

      for (const test of result.smokeTestResults) {
        const status = test.passed ? '✓' : '✗';
        lines.push(`  ${status} ${test.name}`);
        if (test.message) {
          lines.push(`    ${test.message}`);
        }
      }
      lines.push('');
    }

    lines.push('='.repeat(80));

    return lines.join('\n');
  }
}
