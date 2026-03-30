import { ModelSelectionPoint, DecisionNode, DependencyChain } from './types';
import { CostRegistry } from './cost-registry';

export class DependencyTracer {
  private selectionPoints: ModelSelectionPoint[];
  private costRegistry: CostRegistry;
  private readonly defaultModel = 'gpt-3.5-turbo';

  constructor(selectionPoints: ModelSelectionPoint[], costRegistry: CostRegistry) {
    this.selectionPoints = selectionPoints;
    this.costRegistry = costRegistry;
  }

  trace(): DependencyChain[] {
    // Group selection points by file
    const pointsByFile = this.groupByFile(this.selectionPoints);

    const dependencyChains: DependencyChain[] = [];

    // For each selection point, create a dependency chain
    for (const point of this.selectionPoints) {
      const chain = this.createChainForPoint(point, pointsByFile);
      const finalModel = point.selectedModel || this.defaultModel;

      // Calculate cost delta
      let costDelta = 0;
      try {
        costDelta = this.costRegistry.costDelta(this.defaultModel, finalModel);
      } catch (error) {
        // If cost profile not found, delta is 0
        costDelta = 0;
      }

      dependencyChains.push({
        startPoint: point,
        chain,
        finalModel,
        costDelta,
      });
    }

    return dependencyChains;
  }

  private groupByFile(
    points: ModelSelectionPoint[]
  ): Map<string, ModelSelectionPoint[]> {
    const grouped = new Map<string, ModelSelectionPoint[]>();

    for (const point of points) {
      if (!grouped.has(point.file)) {
        grouped.set(point.file, []);
      }
      grouped.get(point.file)!.push(point);
    }

    return grouped;
  }

  private createChainForPoint(
    point: ModelSelectionPoint,
    pointsByFile: Map<string, ModelSelectionPoint[]>
  ): DecisionNode[] {
    const chain: DecisionNode[] = [];
    let nodeId = 0;

    // Create a decision node for the current point
    const node: DecisionNode = {
      id: `node_${nodeId++}`,
      type: point.type as 'config' | 'env' | 'runtime' | 'request' | 'api',
      model: point.selectedModel,
      source: point.file,
      line: point.line,
      costTier: point.costTier === 'unknown' ? 'free' : (point.costTier as 'free' | 'paid'),
      dependsOn: [],
      affectsDownstream: [],
    };

    chain.push(node);

    // Find downstream points in the same file
    const downstreamPoints = this.findDownstreamPoints(point, pointsByFile);

    for (const downstream of downstreamPoints) {
      const downstreamNode: DecisionNode = {
        id: `node_${nodeId++}`,
        type: downstream.type as 'config' | 'env' | 'runtime' | 'request' | 'api',
        model: downstream.selectedModel,
        source: downstream.file,
        line: downstream.line,
        costTier: downstream.costTier === 'unknown' ? 'free' : (downstream.costTier as 'free' | 'paid'),
        dependsOn: [node.id],
        affectsDownstream: [],
      };

      node.affectsDownstream.push(downstreamNode.id);
      chain.push(downstreamNode);
    }

    return chain;
  }

  private findDownstreamPoints(
    point: ModelSelectionPoint,
    pointsByFile: Map<string, ModelSelectionPoint[]>
  ): ModelSelectionPoint[] {
    const filePoints = pointsByFile.get(point.file) || [];

    // Find points that come after the current point (by line number)
    return filePoints.filter(p => p.line > point.line);
  }
}
