import ELK, { ElkNode } from 'elkjs'
import { Node as FlowNode, Edge as FlowEdge, MarkerType } from 'react-flow-renderer'

import { VPC, VPCConnection } from '../data/network.interface.ts'
import { stringToColor } from './stringColor.ts'

const elk = new ELK()

export async function layoutWithElk({
  connections,
  vpcs,
  rawNodes,
  rawEdges,
}: {
  connections: VPCConnection[]
  vpcs: VPC[]
  rawNodes: FlowNode[]
  rawEdges: FlowEdge[]
}): Promise<{ nodes: FlowNode[]; edges: FlowEdge[] }> {
  const connectionNodes = rawNodes.filter(n => n.nodeType === 'connection')
  const vpcNodes = rawNodes.filter(n => n.nodeType === 'vpc')

  const nodeMap = new Map(connectionNodes.map((n) => [n.id, n]))
  const vpcMap = new Map<string, VPC>(vpcs.map((v) => [v.vpcId, v]))

  const regionGroups: Record<string, ElkNode> = {}

  // Group only connection nodes
  for (const conn of connections) {
    const nodeId = conn.resourceName || conn.networkInterfaceId
    const vpc = vpcMap.get(conn.vpcId)
    if (!vpc || !nodeMap.has(nodeId)) continue

    const hasInbound = Object.keys(conn.baseline?.PRIVATE_INBOUND?.ports?.TCP || {}).length > 0
      || Object.keys(conn.baseline?.PRIVATE_INBOUND?.ports?.UDP || {}).length > 0

    const hasOutbound = Object.keys(conn.baseline?.PRIVATE_OUTBOUND?.ports?.TCP || {}).length > 0
      || Object.keys(conn.baseline?.PRIVATE_OUTBOUND?.ports?.UDP || {}).length > 0

    if (!hasInbound && !hasOutbound) continue

    const region = vpc.region

    if (!regionGroups[region]) {
      regionGroups[region] = {
        id: region,
        layoutOptions: {
          'elk.algorithm': 'mrtree',
          'elk.direction': 'RIGHT',
          'elk.padding': '[top=40,left=20,bottom=20,right=20]',
          'elk.spacing.nodeNode': '40',
        },
        children: [],
      }
    }

    regionGroups[region].children!.push({
      id: nodeId,
      width: 180,
      height: 60,
    })
  }

  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '80',
    },
    children: Object.values(regionGroups),
    edges: rawEdges
      .filter(e => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map((e) => ({
        id: e.id,
        sources: [e.source],
        targets: [e.target],
      }))

  }

  const layouted = await elk.layout(elkGraph)

  const positionedNodes: FlowNode[] = []
  const edgeNodeIds = new Set<string>()
  rawEdges.forEach(edge => {
    edgeNodeIds.add(edge.source)
    edgeNodeIds.add(edge.target)
  })

  // Region nodes and their children
  for (const region of layouted.children || []) {
    const regionId = `region-${region.id}`

    // Count the number of nodes in this region for better sizing
    const nodeCount = region.children?.length || 0
    const cols = 4
    const rows = Math.ceil(nodeCount / cols)

    // Calculate height based on rows
    const minHeight = Math.max(rows * 100 + 80, region.height || 0)
    // Calculate width based on columns
    const minWidth = Math.max(cols * 220 + 40, region.width || 0)

    positionedNodes.push({
      id: regionId,
      type: 'group',
      position: { x: region.x || 0, y: region.y || 0 },
      style: {
        width: minWidth,
        height: minHeight,
        border: '2px dashed #c3dafe',
        borderRadius: 12,
        padding: 20,
        zIndex: 0,
        minWidth: minWidth,
        minHeight: minHeight,
        overflow: 'visible',
      },
      data: { label: region.id },
      draggable: false,
      selectable: false,
    })

    const colStagger = [0, 15, -5, 10]; // Vertical offsets for columns 0, 1, 2, 3

    region.children?.forEach((child, index) => {
      const ref = nodeMap.get(child.id)
      if (!ref) return

      const col = index % cols
      const row = Math.floor(index / cols)

      // Apply the stagger offset based on column
      const yOffset = colStagger[col];

      positionedNodes.push({
        ...ref,
        position: {
          x: col * 220 + 40,
          y: row * 100 + 60 + yOffset, // Apply the vertical stagger offset
        },
        parentNode: regionId,
        extent: 'parent',
      })
    })
  }

  // VPC column to the right
  const maxX = Math.max(
    ...positionedNodes.map(n =>
      n.position.x + (typeof n.style?.width === 'number' ? n.style.width : 180)
    ),
    0
  )

  let vpcY = 0

  for (const node of vpcNodes) {
    if (
      edgeNodeIds.has(node.id) &&
      !positionedNodes.some(n => n.id === node.id)
    ) {
      positionedNodes.push({
        ...node,
        position: {
          x: maxX + 300,
          y: vpcY,
        },
        type: node.type,
      })
      vpcY += 120
    }
  }

  return {
    nodes: positionedNodes,
    edges: rawEdges.map((e) => {
      const color = stringToColor(e.target)
      return {
        ...e,
        style: {
          stroke: color,
          strokeWidth: 2,
          zIndex: 100,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color,
        },
      }
    }),
  }
}
