import { useState, type ReactElement } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { ChevronDown, ChevronRight, X, GripVertical } from 'lucide-react';
import type { HistoryItem, HttpMethod } from '../../types';

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

const methodColors: Record<HttpMethod, { bg: string; border: string; text: string; badge: string }> = {
    GET: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', badge: 'bg-green-100' },
    POST: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', badge: 'bg-blue-100' },
    PUT: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', badge: 'bg-yellow-100' },
    PATCH: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', badge: 'bg-purple-100' },
    DELETE: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', badge: 'bg-red-100' },
};

function HistoryCard({ item, expanded, onToggle, onDelete }: {
    item: HistoryItem;
    expanded: boolean;
    onToggle: () => void;
    onDelete: () => void;
}) {
    const colors = methodColors[item.method];
    const statusColor = item.status >= 200 && item.status < 300
        ? 'text-green-600'
        : item.status >= 400
            ? 'text-red-600'
            : 'text-yellow-600';

    const getRelativeTime = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    return (
        <div className={`border ${colors.border} ${colors.bg} rounded-lg mb-2 transition-all hover:shadow-md`}>
            {/* Header */}
            <div className="px-3 py-2 flex items-center gap-2">
                <button
                    onClick={onToggle}
                    className="flex items-center gap-2 flex-1 min-w-0"
                >
                    {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}

                    <div className={`px-2 py-0.5 ${colors.badge} ${colors.text} rounded text-xs font-bold`}>
                        {item.method}
                    </div>

                    <div className="flex-1 text-xs font-mono truncate text-gray-700">
                        {item.url}
                    </div>

                    <div className={`text-xs font-semibold ${statusColor}`}>
                        {item.status}
                    </div>

                    <div className="text-xs text-gray-500">
                        {getRelativeTime(item.timestamp)}
                    </div>
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete this request"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Expanded Body */}
            {expanded && (
                <div className="px-3 pb-3 pt-1 border-t border-gray-200">
                    <div className="text-xs text-gray-600 mb-2">
                        <span className={statusColor}>{item.status} {item.statusText}</span>
                        {' • '}
                        <span>{item.time}ms</span>
                        {' • '}
                        <span>{item.size} bytes</span>
                    </div>

                    <div className="bg-white rounded border border-gray-200 p-2 max-h-60 overflow-auto">
                        {typeof item.data === 'object' && item.data !== null ? (
                            <DraggableJsonFields data={item.data} />
                        ) : (
                            <pre className="text-xs font-mono whitespace-pre-wrap text-gray-800">
                                {JSON.stringify(item.data, null, 2)}
                            </pre>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export function ResponseHistory() {
    const history = useCanvasStore((state) => state.history);
    const removeHistoryItem = useCanvasStore((state) => state.removeHistoryItem);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (history.length === 0) {
        return null;
    }

    return (
        <div className="w-96 max-h-[300px] overflow-auto">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
                <div className="text-xs font-semibold text-gray-600 mb-3 flex items-center justify-between">
                    <span>HISTORY</span>
                    <span className="text-gray-400">{history.length} request{history.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="space-y-0">
                    {history.map((item) => (
                        <HistoryCard
                            key={item.id}
                            item={item}
                            expanded={expandedId === item.id}
                            onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                            onDelete={() => {
                                removeHistoryItem(item.id);
                                if (expandedId === item.id) setExpandedId(null);
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
