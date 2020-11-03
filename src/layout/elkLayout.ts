import { EdgeData, NodeData } from 'Canvas';
import ELK, { ElkNode } from 'elkjs/lib/elk.bundled';
import PCancelable from 'p-cancelable';
import calculateSize from 'calculate-size';

const defaultLayoutOptions = {
  'elk.nodeLabels.placement': 'INSIDE V_CENTER H_RIGHT',
  'elk.algorithm': 'org.eclipse.elk.layered',
  'elk.direction': 'DOWN',
  nodeLayering: 'INTERACTIVE',
  'org.eclipse.elk.edgeRouting': 'ORTHOGONAL',
  'elk.layered.unnecessaryBendpoints': 'true',
  'elk.layered.spacing.edgeNodeBetweenLayers': '50',
  'org.eclipse.elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
  'org.eclipse.elk.layered.cycleBreaking.strategy': 'DEPTH_FIRST',
  'org.eclipse.elk.insideSelfLoops.activate': 'true',
  separateConnectedComponents: 'false',
  'spacing.componentComponent': '70',
  spacing: '75',
  'spacing.nodeNodeBetweenLayers': '70'
};

function measureText(node: NodeData) {
  const result = { height: 0, width: 0 };

  if (node.text) {
    const sizes = calculateSize(node.text, {
      font: 'Arial, sans-serif',
      fontSize: '14px'
    });

    // Adding height messes things up
    result.width = sizes.width;
  }

  return result;
}

function mapNode(node: NodeData, layoutOptions) {
  const isVertical = layoutOptions['elk.direction'] === 'DOWN';
  const SOURCE_PORT_DIRECTION = isVertical ? 'SOUTH' : 'EAST';
  const TARGET_PORT_DIRECTION = isVertical ? 'NORTH' : 'WEST';

  return {
    id: node.id,
    height: node.height || 50,
    width: node.width || 150,
    ports: [
      {
        id: `${node.id}_default`,
        properties: {
          width: 10,
          height: 10,
          'port.side': SOURCE_PORT_DIRECTION,
          'port.alignment': 'CENTER',
          index: 0,
          type: 'default'
        }
      },
      {
        id: `${node.id}_target`,
        properties: {
          width: 10,
          height: 10,
          'port.side': TARGET_PORT_DIRECTION,
          'port.alignment': 'CENTER'
        }
      }
    ],
    layoutOptions: {
      'elk.padding': '[left=50, top=50, right=50, bottom=50]',
      portConstraints: 'FIXED_ORDER'
    },
    properties: {
      ...node
    },
    labels: node.text
      ? [
          {
            ...measureText(node),
            text: node.text,
            layoutOptions: {
              'elk.nodeLabels.placement': 'INSIDE V_CENTER H_CENTER'
            }
          }
        ]
      : []
  };
}

function mapEdge({ id, from, to, ...rest }: EdgeData) {
  return {
    id,
    source: from,
    target: to,
    properties: {
      ...rest
    },
    sourcePort: `${from}_default`,
    targetPort: `${to}_target`
  };
}

function mapInput(nodes: NodeData[], edges: EdgeData[], layoutOptions) {
  const children = [];
  for (const node of nodes) {
    const map = mapNode(node, layoutOptions);
    if (map !== null) {
      children.push(map);
    }
  }

  const mappedEdges = [];
  for (const edge of edges) {
    const map = mapEdge(edge);
    if (map !== null) {
      mappedEdges.push(map);
    }
  }

  return {
    children,
    edges: mappedEdges
  };
}

export const elkLayout = (
  nodes: NodeData[],
  edges: EdgeData[],
  layoutOptions = defaultLayoutOptions
) => {
  const graph = new ELK();

  return new PCancelable<ElkNode>((resolve, reject) => {
    graph
      .layout(
        {
          id: 'root',
          ...mapInput(nodes, edges, layoutOptions)
        },
        {
          layoutOptions
        }
      )
      .then((result) => resolve(result))
      .catch(reject);
  });
};