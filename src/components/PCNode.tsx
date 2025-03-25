import React, { memo } from 'react';
import { Handle, Position } from 'react-flow-renderer';

const PCNode = ({ data }: { data: { label: string } }) => {
  return (
    <div className="flex flex-col items-center">
      <Handle type="target" position={Position.Left} />

      <svg width="40" height="40" viewBox="0 0 1024 1024" className="mb-1">
        <path d="M640 960H384l21.333333-149.333333h213.333334z" fill="#B3B3B3" />
        <path d="M938.666667 21.333333H85.333333a64 64 0 0 0-64 64v597.333334h981.333334V85.333333a64 64 0 0 0-64-64z" fill="#444444" />
        <path d="M21.333333 682.666667v106.666666a64 64 0 0 0 64 64h853.333334a64 64 0 0 0 64-64v-106.666666H21.333333z" fill="#E6E6E6" />
        <path d="M85.333333 85.333333h853.333334v533.333334H85.333333z" fill="#43A6DD" />
        <path d="M746.666667 1024H277.333333a85.333333 85.333333 0 0 1 85.333334-85.333333h298.666666a85.333333 85.333333 0 0 1 85.333334 85.333333z" fill="#E6E6E6" />
      </svg>
      
      <div className="text-xs text-center max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">
        {data.label}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default memo(PCNode); 