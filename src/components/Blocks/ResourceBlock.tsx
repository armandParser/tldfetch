import { useState } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { type BlockData } from '../../types';
import { useCanvasStore } from '../../store/useCanvasStore';
import { Settings } from 'lucide-react';

export function ResourceBlock({ data, id }: NodeProps<BlockData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingParam, setIsEditingParam] = useState(false);
  const [value, setValue] = useState(data.value);
  const updateNodeValue = useCanvasStore((state) => state.updateNodeValue);
  const setVariable = useCanvasStore((state) => state.setVariable);
  const variables = useCanvasStore((state) => state.variables);

  // ✨ OPTIMIZED: Simple selector instead of O(N×E) path tracing
  const isInActivePath = useCanvasStore((state) =>
    state.activePathNodes.includes(id)
  );

  const isParam = /\{(.+)\}/.test(value);
  const paramName = isParam ? value.match(/\{(.+)\}/)?.[1] || '' : '';
  const paramValue = variables[paramName] || '';

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    updateNodeValue(id, value);
  };

  const handleParamClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingParam(!isEditingParam);
  };

  const handleParamValueChange = (newValue: string) => {
    setVariable(paramName, newValue);
  };

  return (
    <div className={`px-4 py-3 ${isParam ? 'bg-orange-100 border-orange-400' : 'bg-pink-100 border-pink-400'} border-2 ${isInActivePath ? 'ring-2 ring-opacity-50' : ''} rounded-lg shadow-md min-w-[150px] transition-all relative`}>
      <div className={`text-xs ${isParam ? 'text-orange-600' : 'text-pink-600'} font-semibold mb-1`}>
        {isParam ? 'PARAM' : 'RESOURCE'}
      </div>
      {isEditing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onClick={(e) => e.stopPropagation()}
          autoFocus
          className={`w-full px-2 py-1 border ${isParam ? 'border-orange-400' : 'border-pink-400'} rounded text-sm`}
        />
      ) : (
        <div className="flex items-center gap-2">
          <div
            onDoubleClick={handleDoubleClick}
            className={`text-sm font-mono cursor-pointer hover:${isParam ? 'bg-orange-200' : 'bg-pink-200'} px-2 py-1 rounded flex-1`}
          >
            {data.value || 'Double-click to edit'}
          </div>
          {isParam && (
            <button
              onClick={handleParamClick}
              className="p-1 hover:bg-orange-200 rounded"
              title="Edit parameter value"
            >
              <Settings size={14} className="text-orange-600" />
            </button>
          )}
        </div>
      )}

      {isEditingParam && isParam && (
        <div className="mt-2 pt-2 border-t border-orange-300">
          <div className="text-xs text-orange-600 mb-1">Value for {paramName}:</div>
          <input
            type="text"
            value={paramValue}
            onChange={(e) => handleParamValueChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder={`Enter ${paramName}`}
            className="w-full px-2 py-1 border border-orange-400 rounded text-xs"
          />
        </div>
      )}

      <Handle type="target" position={Position.Left} className={`${isParam ? 'bg-orange-500' : 'bg-pink-500'}!`} />
      <Handle type="source" position={Position.Right} className={`${isParam ? 'bg-orange-500' : 'bg-pink-500'}!`} />
    </div>
  );
}
