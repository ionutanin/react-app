import { NodeProps } from 'react-flow-renderer'

export default function RegionNode({ data }: NodeProps) {
  return (
    <div className="w-full h-full border-2 border-indigo-300 rounded-lg relative p-3 z-0">
      <div className="absolute top-2 left-3 text-indigo-800 font-bold text-xs uppercase tracking-wide">
        {data.label}
      </div>
    </div>
  )
}
