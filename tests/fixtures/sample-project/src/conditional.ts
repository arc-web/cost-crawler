// This file selects model based on complexity - expensive fallback
export function selectModel(complexity: number): string {
  if (complexity > 8) {
    return 'gpt-4'; // Expensive fallback
  }
  return 'gpt-3.5-turbo';
}
