import type { Node, Edge } from 'react-flow-renderer'
import { nanoid } from 'nanoid'
import type { NetworkData } from '../data/network.interface'

const regionColors: Record<string, string> = {
  'us-east-1': '#E0F7FA',
  'us-west-1': '#FFF9C4',
  'eu-central-1': '#F3E5F5',
}

export function parseNetworkToGraph(data: NetworkData): {
  nodes: Node[]
  edges: Edge[]
} {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const seenNodes = new Set<string>()

  const vpcMap = new Map(data.vpcs.map(vpc => [vpc.vpcId, vpc]))

  data.vpcConnections.forEach(conn => {
    const sourceId = conn.resourceName || conn.networkInterfaceId
    const vpc = vpcMap.get(conn.vpcId)
    const region = vpc?.region || 'unknown'
    const bg = regionColors[region] || '#f3f4f6'

    const outTCP = conn.baseline.PRIVATE_OUTBOUND?.ports?.TCP || {}
    const outUDP = conn.baseline.PRIVATE_OUTBOUND?.ports?.UDP || {}

    const hasOutbound =
      Object.keys(outTCP).length > 0 ||
      Object.keys(outUDP).length > 0

    const inTCP = conn.baseline.PRIVATE_INBOUND?.ports?.TCP || {}
    const inUDP = conn.baseline.PRIVATE_INBOUND?.ports?.UDP || {}

    const hasInbound =
      Object.keys(inTCP).length > 0 ||
      Object.keys(inUDP).length > 0

    if (!hasInbound && !hasOutbound) return // skip if no traffic

    if (!seenNodes.has(sourceId)) {
      nodes.push({
        id: sourceId,
        type: 'pc',
        nodeType: 'connection',
        data: { label: sourceId },
        position: { x: 0, y: 0 },
        style: {
          padding: 8,
          borderRadius: 4,
          fontSize: 12,
        },
      })
      seenNodes.add(sourceId)
    }

    // only process real outbound edges
    for (const protocol of [outTCP, outUDP]) {
      for (const port in protocol) {
        const { assets } = protocol[port]
        for (const asset of assets) {
          const targetId = asset.resourceName || asset.addressIP

          if (!seenNodes.has(targetId)) {
            nodes.push({
              id: targetId,
              type: 'server',
              nodeType: 'vpc',
              data: { label: targetId },
              position: { x: 0, y: 0 },
              style: {
                padding: 8,
                borderRadius: 4,
                fontSize: 12,
              },
            })
            seenNodes.add(targetId)
          }

          edges.push({
            id: nanoid(),
            source: sourceId,
            target: targetId,
            animated: true,
            label: `TCP ${port}`,
            style: {
              stroke: '#1d4ed8',
              strokeWidth: 2.5,
              position: 'absolute',
              zIndex: 100,
            },
          })
        }
      }
    }
  })

  return { nodes, edges }
}
