import { Node, Edge, MarkerType, Position } from 'react-flow-renderer'
import type { VPC, VPCConnection } from '../data/network.interface'

interface GroupedLayoutInput {
  nodes: Node[]
  edges: Edge[]
  connections: VPCConnection[]
  vpcs: VPC[]
  groupBy?: 'region' | 'accountId'
  columns?: number
  spacing?: number
}

export function getRenderedElements({
  nodes,
  edges,
  connections,
  vpcs,
  groupBy = 'region',
  columns = 5,
  spacing = 300,
}: GroupedLayoutInput): { nodes: Node[]; edges: Edge[] } {
  const positionedNodes: Node[] = []
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const vpcMap = new Map(vpcs.map((vpc) => [vpc.vpcId, vpc]))
  const groupMap = new Map<string, Node[]>()

  // Group nodes by region or accountId
  for (const conn of connections) {
    const nodeId = conn.resourceName || conn.networkInterfaceId
    const node = nodeMap.get(nodeId)
    const vpc = vpcMap.get(conn.vpcId)

    if (!node || !vpc) continue

    const groupKey = groupBy === 'region' ? vpc.region : vpc.accountId
    if (!groupMap.has(groupKey)) groupMap.set(groupKey, [])
    groupMap.get(groupKey)!.push(node)
  }

  let yOffset = 0

  for (const [, groupNodes] of groupMap.entries()) {
    groupNodes.forEach((node, index) => {
      const col = index % columns
      const row = Math.floor(index / columns)

      node.position = {
        x: col * spacing,
        y: yOffset + row * spacing,
      }

      node.sourcePosition = Position.Right
      node.targetPosition = Position.Left

      positionedNodes.push(node)
    })

    yOffset += Math.ceil(groupNodes.length / columns) * spacing + spacing
  }

  const positionedEdges = edges.map((edge) => ({
    ...edge,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  }))

  return { nodes: positionedNodes, edges: positionedEdges }
}
