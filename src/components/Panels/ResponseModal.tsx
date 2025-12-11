import { useState, type ReactElement } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { GripVertical } from 'lucide-react';

type Tab = 'body' | 'headers' | 'raw';

interface DraggableFieldProps {
  keyName: string;
  value: any;
  path?: string;
}

function DraggableJsonFields({ data, parentPath = '' }: { data: any; parentPath?: string }) {
  const renderValue = (key: string, value: any, currentPath: string): ReactElement => {
    const fullPath = currentPath ? `${currentPath}.${key}` : key;

    if (value === null || value === undefined) {
      return <DraggableField key={fullPath} keyName={key} value={String(value)} path={fullPath} />;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      return (
        <div key={fullPath} className="ml-3 border-l-2 border-gray-200 pl-2">
          <div className="text-xs font-semibold text-gray-700 mb-1">{key}:</div>
          <DraggableJsonFields data={value} parentPath={fullPath} />
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div key={fullPath} className="ml-3 border-l-2 border-gray-200 pl-2">
          <div className="text-xs font-semibold text-gray-700 mb-1">{key}: [{value.length} items]</div>
          {value.map((item, index) => {
            const itemPath = `${fullPath}[${index}]`;

            // If the item is an object, recursively render its fields
            if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
              return (
                <div key={itemPath} className="ml-3 border-l-2 border-gray-300 pl-2 mb-2">
                  <div className="text-xs font-semibold text-gray-600 mb-1">{key}[{index}]:</div>
                  <DraggableJsonFields data={item} parentPath={itemPath} />
                </div>
              );
            }

            // Otherwise, render as a simple draggable field
            return (
              <DraggableField
                key={itemPath}
                keyName={`${key}[${index}]`}
                value={typeof item === 'object' ? JSON.stringify(item) : String(item)}
                path={itemPath}
              />
            );
          })}
        </div>
      );
    }

    return <DraggableField key={fullPath} keyName={key} value={String(value)} path={fullPath} />;
  };

  return (
    <div className="space-y-1">
      {Object.entries(data).map(([key, value]) => renderValue(key, value, parentPath))}
    </div>
  );
}

function DraggableField({ keyName, value, path }: DraggableFieldProps) {
  const [isDraggingKey, setIsDraggingKey] = useState(false);
  const [isDraggingValue, setIsDraggingValue] = useState(false);

  const createDragData = (valueOnly: boolean) => {
    const leafKey = keyName.includes('.') ? keyName.split('.').pop()! : keyName;

    return {
      key: leafKey,
      value: value,
      valueOnly: valueOnly,
    };
  };

  const handleKeyDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDraggingKey(true);

    const dragData = createDragData(false); // Key + Value
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.setData('text/plain', `${dragData.key}: ${value}`);
  };

  const handleValueDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDraggingValue(true);

    const dragData = createDragData(true); // Value only
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.setData('text/plain', value);
  };

  const handleDragEnd = () => {
    setIsDraggingKey(false);
    setIsDraggingValue(false);
  };

  const displayKey = path || keyName;
  const isDragging = isDraggingKey || isDraggingValue;

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 group ${isDragging ? 'opacity-50 bg-blue-50' : ''
        }`}
    >
      <GripVertical size={12} className="text-gray-400 group-hover:text-gray-600" />
      <span
        className="text-xs font-semibold text-blue-600 min-w-[80px] cursor-grab active:cursor-grabbing"
        draggable
        onDragStart={handleKeyDragStart}
        onDragEnd={handleDragEnd}
        title="Drag to add as key + value"
      >{displayKey}:</span>
      <span
        className="text-xs text-gray-700 flex-1 break-all cursor-grab active:cursor-grabbing"
        draggable
        onDragStart={handleValueDragStart}
        onDragEnd={handleDragEnd}
        title="Drag to add value only"
      >{value}</span>
    </div>
  );
}

export function ResponseModal() {
  const response = useCanvasStore((state) => state.response);
  const [activeTab, setActiveTab] = useState<Tab>('body');

  if (!response) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200 w-96">
        <div className="text-xs font-semibold text-gray-600 mb-2">RESPONSE</div>
        <div className="text-sm text-gray-400 italic text-center py-8">
          No request sent yet
        </div>
      </div>
    );
  }

  const statusColor = response.status >= 200 && response.status < 300
    ? 'text-green-600'
    : response.status >= 400
      ? 'text-red-600'
      : 'text-yellow-600';

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-96 max-h-[500px] flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="text-xs font-semibold text-gray-600 mb-2">RESPONSE</div>
        <div className="flex items-center gap-3 text-sm">
          <span className={`font-bold ${statusColor}`}>
            {response.status} {response.statusText}
          </span>
          <span className="text-gray-500">{response.time}ms</span>
          <span className="text-gray-500">{response.size} bytes</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('body')}
          className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'body'
              ? 'bg-white text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Body
        </button>
        <button
          onClick={() => setActiveTab('headers')}
          className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'headers'
              ? 'bg-white text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Headers
        </button>
        <button
          onClick={() => setActiveTab('raw')}
          className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${activeTab === 'raw'
              ? 'bg-white text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Raw
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 overflow-auto flex-1">
        {activeTab === 'body' && (
          <div className="space-y-2">
            {typeof response.data === 'object' && response.data !== null ? (
              <DraggableJsonFields data={response.data} />
            ) : (
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            )}
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="space-y-2">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key} className="flex items-start gap-2 text-xs">
                <span className="font-semibold text-gray-700 min-w-[120px]">{key}:</span>
                <span className="text-gray-600 break-all">{String(value)}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'raw' && (
          <pre className="text-xs font-mono whitespace-pre-wrap text-gray-800">
            {JSON.stringify(response.data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
