import { Plus, Trash2 } from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { type HttpMethod } from '../../types';

export function BlockToolbar() {
  const addNode = useCanvasStore((state) => state.addNode);
  const resetToDefault = useCanvasStore((state) => state.resetToDefault);

  const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-2 z-10 border border-gray-200">
      <div className="flex items-center gap-2">
        <button
          onClick={() => addNode('baseUrl', 'http://localhost:3000')}
          className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium flex items-center gap-1.5 whitespace-nowrap"
        >
          <Plus size={14} />
          Base URL
        </button>

        <button
          onClick={() => addNode('resource', 'users')}
          className="px-3 py-1.5 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded text-xs font-medium flex items-center gap-1.5 whitespace-nowrap"
        >
          <Plus size={14} />
          Resource
        </button>

        <div className="border-l border-gray-200 pl-2 flex items-center gap-1.5">
          {methods.map((method) => (
            <button
              key={method}
              onClick={() => addNode('method', '', method)}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium whitespace-nowrap"
            >
              {method}
            </button>
          ))}
        </div>

        <div className="border-l border-gray-200 pl-2">
          <button
            onClick={resetToDefault}
            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-medium flex items-center gap-1.5 whitespace-nowrap"
            title="Reset to default starter nodes"
          >
            <Trash2 size={14} />
            Erase All
          </button>
        </div>
      </div>
    </div>
  );
}
