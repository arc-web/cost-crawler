import { Command } from 'commander';
import { createAnalyzeCommand } from './commands/analyze';

export function createCLI(): Command {
  const program = new Command();

  program
    .name('cost-crawler')
    .description('Analyze codebases for model selection mechanisms and API cost risks')
    .version('0.1.0');

  program.addCommand(createAnalyzeCommand());

  return program;
}
