import { useState } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { type BlockData } from '../../types';
import { useCanvasStore } from '../../store/useCanvasStore';

export function BaseUrlBlock({ data, id }: NodeProps<BlockData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(data.value);
  const updateNodeValue = useCanvasStore((state) => state.updateNodeValue);

  // ✨ OPTIMIZED: Simple selector instead of O(N×E) path tracing
  const isInActivePath = useCanvasStore((state) =>
    state.activePathNodes.includes(id)
  );

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    updateNodeValue(id, value);
  };

  return (
    <div className={`px-4 py-3 bg-blue-100 border-2 ${isInActivePath ? 'border-blue-600 ring-2 ring-blue-400' : 'border-blue-400'} rounded-lg shadow-md min-w-[200px] transition-all`}>
      <div className="text-xs text-blue-600 font-semibold mb-1">BASE URL</div>
      {isEditing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onClick={(e) => e.stopPropagation()}
          autoFocus
          className="w-full px-2 py-1 border border-blue-400 rounded text-sm"
        />
      ) : (
        <div
          onDoubleClick={handleDoubleClick}
          className="text-sm font-mono cursor-pointer hover:bg-blue-200 px-2 py-1 rounded"
        >
          {data.value || 'Double-click to edit'}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="bg-blue-500!" />
    </div>
  );
}
