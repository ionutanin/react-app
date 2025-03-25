import ReactFlow, {Background, Controls, Node as FlowNode, Edge as FlowEdge} from 'react-flow-renderer'
import {useCallback, useEffect, useState} from 'react';

import { useAppContext } from '../contexts/AppContext'
import { parseNetworkToGraph } from '../utils/parseNetworkToGraph'
import {layoutWithElk} from '../utils/layoutWithElk.ts';
import RegionNode from './RegionNode.tsx';
import PCNode from './PCNode';
import ServerNode from './ServerNode';

export default function NetworkGraph() {
  const { data } = useAppContext()
  const [nodes, setNodes] = useState<FlowNode[]>([])
  const [edges, setEdges] = useState<FlowEdge[]>([])
  const [originalEdges, setOriginalEdges] = useState<FlowEdge[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  useEffect(() => {
    if (!data) return

    const raw = parseNetworkToGraph(data)

    layoutWithElk({
      rawNodes: raw.nodes,
      rawEdges: raw.edges,
      connections: data.vpcConnections,
      vpcs: data.vpcs,
    }).then(({ nodes, edges }) => {
      setNodes(nodes)
      setEdges(edges)
      setOriginalEdges(edges) // Store original edges for filtering
    })
  }, [data])

  // Handle node click - skip group/region nodes
  const onNodeClick = useCallback((event: React.MouseEvent, node: FlowNode) => {
    // Skip if the node is a region container
    if (node.type === 'group') return;

    event.preventDefault()

    if (selectedNode === node.id) {
      // If clicking the already selected node, reset to show all edges
      setSelectedNode(null)
      setEdges(originalEdges)
    } else {
      // Show only edges connected to the selected node
      setSelectedNode(node.id)
      const filteredEdges = originalEdges.filter(
        edge => edge.source === node.id || edge.target === node.id
      )
      setEdges(filteredEdges)
    }
  }, [selectedNode, originalEdges])

  // Update node styles based on selection
  const styledNodes = nodes.map(node => ({
    ...node,
    // Ensure region containers are not selectable
    selectable: node.type !== 'group',
    style: {
      ...(node.style || {}),
      // Add highlighted border to selected node, but not to group nodes
      border: node.id === selectedNode && node.type !== 'group'
        ? '2px solid #ff3366'
        : node.style?.border || '1px solid #ccc',
      boxShadow: node.id === selectedNode && node.type !== 'group'
        ? '0 0 8px rgba(255, 51, 102, 0.6)'
        : 'none',
    }
  }))

  if (!data) return <div className="p-4">Loading network...</div>

  return (
    <div className="w-full h-screen">
      <ReactFlow
        nodes={styledNodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodeTypes={{
          group: RegionNode,
          pc: PCNode,
          server: ServerNode,
        }}
        onNodeClick={onNodeClick}
      >
        <Background />
        <Controls />
        {selectedNode && (
          <div className="absolute top-4 right-4 bg-white p-2 rounded shadow z-10">
            <button
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => {
                setSelectedNode(null)
                setEdges(originalEdges)
              }}
            >
              Show All Connections
            </button>
          </div>
        )}
      </ReactFlow>
    </div>
  )
}
