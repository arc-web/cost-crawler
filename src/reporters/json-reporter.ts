import { AnalysisResult } from '../core/types';

export class JSONReporter {
  format(result: AnalysisResult): string {
    return JSON.stringify(result, null, 2);
  }
}
