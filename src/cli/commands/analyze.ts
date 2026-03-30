import { Command } from 'commander';
import { CostAnalyzer } from '../../core/analyzer';
import { PluginRegistry } from '../../plugins/plugin-registry';
import { CostRegistry } from '../../core/cost-registry';
import { DetectHardcodedModelsRule } from '../../plugins/rules/detect-hardcoded-models';
import { CostOptimizationRecommender } from '../../plugins/recommendations/cost-optimization';
import { CLIReporter } from '../../reporters/cli-reporter';
import { JSONReporter } from '../../reporters/json-reporter';
import * as fs from 'fs';
import * as path from 'path';

export function createAnalyzeCommand(): Command {
  const command = new Command('analyze');

  command
    .description('Analyze a codebase for model selection mechanisms and cost risks')
    .argument('<repoPath>', 'path to repository to analyze')
    .option('-p, --patterns <patterns...>', 'glob patterns to analyze', ['src/**/*.ts', 'src/**/*.js'])
    .option('-o, --output <format>', 'output format', 'cli')
    .option('-f, --file <path>', 'write report to file (optional)')
    .action(async (repoPath: string, options: any) => {
      try {
        // Validate output format
        const validFormats = ['cli', 'json', 'html'];
        if (!validFormats.includes(options.output)) {
          console.error(`Invalid output format: ${options.output}`);
          console.error(`Valid formats: ${validFormats.join(', ')}`);
          process.exit(1);
        }

        // Initialize registry and plugins
        const costRegistry = new CostRegistry();
        const pluginRegistry = new PluginRegistry();

        // Register plugins
        pluginRegistry.registerRule(new DetectHardcodedModelsRule());
        pluginRegistry.registerRecommender(new CostOptimizationRecommender());

        // Create analyzer and run analysis
        const analyzer = new CostAnalyzer(repoPath, costRegistry, pluginRegistry);
        const result = await analyzer.analyze({
          repoPath: repoPath,
          patterns: options.patterns,
        });

        // Format output
        let formattedOutput: string;
        if (options.output === 'json') {
          const jsonReporter = new JSONReporter();
          formattedOutput = jsonReporter.format(result);
        } else if (options.output === 'html') {
          // HTML format - simple implementation
          formattedOutput = generateHTMLReport(result);
        } else {
          const cliReporter = new CLIReporter();
          formattedOutput = cliReporter.format(result);
        }

        // Output to console or file
        if (options.file) {
          const outputPath = path.resolve(options.file);
          fs.writeFileSync(outputPath, formattedOutput, 'utf-8');
          console.log(`Report written to ${outputPath}`);
        } else {
          console.log(formattedOutput);
        }
      } catch (error) {
        console.error('Analysis failed:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return command;
}

function generateHTMLReport(result: any): string {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cost Crawler Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto; margin: 20px; }
    .header { border-bottom: 2px solid #333; padding-bottom: 10px; }
    .section { margin: 20px 0; }
    .section h2 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    .point { background: #f5f5f5; padding: 10px; margin: 5px 0; border-left: 3px solid #007bff; }
    .recommendation { background: #fff3cd; padding: 10px; margin: 5px 0; border-left: 3px solid #ff9800; }
    .critical { border-left-color: #d32f2f; }
    .warning { border-left-color: #fbc02d; }
    .info { border-left-color: #1976d2; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Cost Crawler Analysis Report</h1>
    <p><strong>Repository:</strong> ${result.repoPath}</p>
    <p><strong>Timestamp:</strong> ${result.timestamp}</p>
  </div>

  <div class="section">
    <h2>Model Selection Points (${result.selectionPoints.length})</h2>
    ${
      result.selectionPoints.length === 0
        ? '<p>No model selection points found.</p>'
        : result.selectionPoints.map((p: any) => `
      <div class="point">
        <strong>${p.file}:${p.line}</strong> [${p.type}]<br/>
        Model: ${p.selectedModel || 'unknown'} | Cost: ${p.costTier} | Available: ${p.availableModels.join(', ')}
      </div>
    `).join('')
    }
  </div>

  <div class="section">
    <h2>Recommendations (${result.recommendations.length})</h2>
    ${
      result.recommendations.length === 0
        ? '<p>No recommendations at this time.</p>'
        : result.recommendations.map((r: any) => `
      <div class="recommendation ${r.severity}">
        <strong>${r.severity.toUpperCase()}:</strong> ${r.message}<br/>
        ${r.affected.length > 0 ? `Affected: ${r.affected.join(', ')}<br/>` : ''}
        ${r.suggestedAction ? `Action: ${r.suggestedAction}` : ''}
      </div>
    `).join('')
    }
  </div>
</body>
</html>`;

  return html;
}
