import * as fs from 'fs';
import * as path from 'path';
import * as parser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as types from '@babel/types';
import { ModelSelectionPoint } from './types';
import { CostRegistry } from './cost-registry';
import { KNOWN_MODELS, isModelName } from './patterns';

export class ASTAnalyzer {
  private costRegistry: CostRegistry;

  constructor(costRegistry: CostRegistry) {
    this.costRegistry = costRegistry;
  }

  analyze(filePath: string): ModelSelectionPoint[] {
    // Skip test files
    if (filePath.endsWith('.test.ts') || filePath.endsWith('.spec.ts')) {
      return [];
    }

    try {
      const code = fs.readFileSync(filePath, 'utf-8');
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx', 'asyncGenerators'],
      });

      const selectionPoints: ModelSelectionPoint[] = [];
      let pointId = 0;

      traverse(ast, {
        VariableDeclarator: (nodePath: NodePath<types.VariableDeclarator>) => {
          // Skip destructuring patterns (ObjectPattern, ArrayPattern)
          if (!types.isIdentifier(nodePath.node.id)) {
            return;
          }
          const varName = this.extractVariableName(nodePath.node.id);
          if (this.isModelVariableName(varName) && nodePath.node.init) {
            const model = this.extractModel(nodePath.node.init);
            if (model) {
              selectionPoints.push({
                id: `sel_${pointId++}`,
                file: filePath,
                line: nodePath.node.loc?.start.line || 0,
                column: nodePath.node.loc?.start.column || 0,
                type: 'hardcoded',
                selectedModel: model,
                costTier: this.determineCostTier([model]),
                availableModels: [model],
              });
            }
          }
        },

        ObjectProperty: (nodePath: NodePath<types.ObjectProperty>) => {
          const key = this.extractPropertyKey(nodePath.node.key);
          if (this.isModelVariableName(key)) {
            const model = this.extractModel(nodePath.node.value);
            if (model) {
              selectionPoints.push({
                id: `sel_${pointId++}`,
                file: filePath,
                line: nodePath.node.loc?.start.line || 0,
                column: nodePath.node.loc?.start.column || 0,
                type: 'config',
                selectedModel: model,
                costTier: this.determineCostTier([model]),
                availableModels: [model],
              });
            }
          }
        },

        ConditionalExpression: (
          nodePath: NodePath<types.ConditionalExpression>
        ) => {
          const models = this.extractFromConditional(nodePath.node);
          if (models.length > 0) {
            const defaultModel = this.extractModel(nodePath.node.consequent);
            selectionPoints.push({
              id: `sel_${pointId++}`,
              file: filePath,
              line: nodePath.node.loc?.start.line || 0,
              column: nodePath.node.loc?.start.column || 0,
              type: 'conditional',
              selectedModel: defaultModel || models[0],
              costTier: this.determineCostTier(models),
              availableModels: models,
              condition: 'ternary-operator',
            });
          }
        },
      });

      return selectionPoints;
    } catch (error) {
      console.error(`Failed to parse ${filePath}:`, error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  private extractVariableName(node: types.Node | types.Pattern): string | null {
    if (types.isIdentifier(node)) {
      return node.name;
    }
    return null;
  }

  private extractPropertyKey(node: types.Expression | types.PrivateName): string | null {
    if (types.isIdentifier(node)) {
      return node.name;
    }
    if (types.isStringLiteral(node)) {
      return node.value;
    }
    return null;
  }

  /**
   * Checks if a variable name suggests it contains a model/provider.
   * Matches: 'model', 'provider', 'modelid', or any name containing 'model'/'provider'.
   * Note: Template literals and dynamic model selection are not supported.
   */
  private isModelVariableName(name: string | null): boolean {
    if (!name) return false;
    const lower = name.toLowerCase();
    return (
      lower === 'model' ||
      lower === 'provider' ||
      lower === 'modelid' ||
      lower.includes('model') ||
      lower.includes('provider')
    );
  }

  /**
   * Extracts model name from various expression types.
   * Handles: string literals, identifiers, and function calls with string args.
   * Note: Template literals (e.g., `${model}-turbo`) are not analyzed for
   * performance reasons - dynamic model selection at runtime cannot be statically analyzed.
   */
  private extractModel(node: types.Node | null | undefined): string | null {
    if (!node) return null;

    if (types.isStringLiteral(node)) {
      const value = node.value;
      if (isModelName(value)) {
        return value;
      }
    }

    if (types.isIdentifier(node)) {
      const name = node.name;
      if (isModelName(name)) {
        return name;
      }
    }

    if (types.isCallExpression(node)) {
      // Try to extract from function call arguments
      if (node.arguments.length > 0) {
        const firstArg = node.arguments[0];
        if (types.isStringLiteral(firstArg) && isModelName(firstArg.value)) {
          return firstArg.value;
        }
      }
    }

    return null;
  }

  private extractFromConditional(node: types.ConditionalExpression): string[] {
    const models: string[] = [];

    // Extract from consequent (true branch)
    const consequentModel = this.extractModel(node.consequent);
    if (consequentModel) {
      models.push(consequentModel);
    }

    // Extract from alternate (false branch)
    const alternateModel = this.extractModel(node.alternate);
    if (alternateModel) {
      models.push(alternateModel);
    }

    return Array.from(new Set(models)); // Remove duplicates
  }

  private determineCostTier(
    models: string[]
  ): 'free' | 'paid' | 'mixed' | 'unknown' {
    if (models.length === 0) return 'unknown';

    const tiers = models
      .map(m => this.costRegistry.getTier(m))
      .filter(t => t !== 'unknown');

    if (tiers.length === 0) return 'unknown';
    if (tiers.length === 1) return tiers[0] as 'free' | 'paid';

    // Mixed if we have both free and paid
    const hasFree = tiers.includes('free');
    const hasPaid = tiers.includes('paid');

    if (hasFree && hasPaid) return 'mixed';
    return tiers[0] as 'free' | 'paid';
  }
}
