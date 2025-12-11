import { useState, useRef } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { BlockData, HttpMethod } from '../../types';
import { useCanvasStore } from '../../store/useCanvasStore';
import { Settings, Play, Copy, History } from 'lucide-react';
import axios from 'axios';
import { RequestBodyHistoryModal } from '../Modals/RequestBodyHistoryModal';

const methodColors: Record<HttpMethod, { bg: string; border: string; text: string }> = {
  GET: { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' },
  POST: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
  PUT: { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700' },
  PATCH: { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700' },
  DELETE: { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-700' },
};

export function MethodBlock({ data, id }: NodeProps<BlockData>) {
  const method = data.method || 'GET';
  const colors = methodColors[method];

  // ✨ OPTIMIZED: Precise selectors instead of over-subscription
  const activePathId = useCanvasStore((state) => state.activePathId);
  const isInActivePath = useCanvasStore((state) =>
    state.activePathNodes.includes(id)
  );
  const getComputedUrl = useCanvasStore((state) => state.getComputedUrl);
  const updateNodeBodyFields = useCanvasStore((state) => state.updateNodeBodyFields);
  const updateNodeHeaders = useCanvasStore((state) => state.updateNodeHeaders);
  const setResponse = useCanvasStore((state) => state.setResponse);
  const addBodyHistory = useCanvasStore((state) => state.addBodyHistory);

  const [isEditingBody, setIsEditingBody] = useState(false);
  const [showBodyHistoryModal, setShowBodyHistoryModal] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverField, setDragOverField] = useState<'key' | 'value' | 'container' | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const historyButtonRef = useRef<HTMLButtonElement>(null);

  const bodyFields = data.bodyFields || [];
  const headers = data.headers || [{ key: 'Content-Type', value: 'application/json' }];
  const bearerToken = data.bearerToken || '';
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method);
  const isActive = activePathId === id;

  // ✨ OPTIMIZED: Use store's getComputedUrl instead of duplicate computation
  const computedUrl = isActive ? getComputedUrl() : null;


  const handleBodyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingBody(!isEditingBody);
  };

  const handleFieldChange = (index: number, field: 'key' | 'value', newValue: string) => {
    const newFields = [...bodyFields];
    newFields[index][field] = newValue;
    updateNodeBodyFields(id, newFields);
  };

  const addBodyField = () => {
    updateNodeBodyFields(id, [...bodyFields, { key: '', value: '' }]);
  };

  const removeBodyField = (index: number) => {
    const newFields = bodyFields.filter((_, i) => i !== index);
    updateNodeBodyFields(id, newFields);
  };

  const handleHeaderChange = (index: number, field: 'key' | 'value', newValue: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = newValue;
    updateNodeHeaders(id, newHeaders);
  };

  const addHeader = () => {
    updateNodeHeaders(id, [...headers, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    const newHeaders = headers.filter((_, i) => i !== index);
    updateNodeHeaders(id, newHeaders);
  };

  const handleCopyUrl = () => {
    if (computedUrl) {
      navigator.clipboard.writeText(computedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBearerTokenChange = (newToken: string) => {
    const nodes = useCanvasStore.getState().nodes;
    useCanvasStore.setState({
      nodes: nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, bearerToken: newToken } }
          : node
      ),
    });
  };

  const handleSend = async () => {
    if (!computedUrl) return;

    // Save body to history before sending (if has body fields)
    if (hasBody && bodyFields.length > 0) {
      addBodyHistory(method, computedUrl, bodyFields);
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      const headersObj = headers.reduce((acc, { key, value }) => {
        if (key && value) acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      // Automatically add Authorization header if bearer token is provided
      if (bearerToken) {
        headersObj['Authorization'] = `Bearer ${bearerToken}`;
      }

      const config: any = {
        method,
        url: computedUrl,
        headers: headersObj,
      };

      if (hasBody && bodyFields.length > 0) {
        const bodyObj = bodyFields.reduce((acc, { key, value }) => {
          if (key) acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        config.data = bodyObj;
      }

      const response = await axios(config);
      const endTime = Date.now();

      setResponse({
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers as Record<string, string>,
        time: endTime - startTime,
        size: JSON.stringify(response.data).length,
      }, computedUrl, method);
    } catch (error: any) {
      const endTime = Date.now();
      setResponse({
        status: error.response?.status || 0,
        statusText: error.response?.statusText || 'Error',
        data: error.response?.data || { error: error.message },
        headers: error.response?.headers || {},
        time: endTime - startTime,
        size: 0,
      }, computedUrl, method);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex?: number, targetField?: 'key' | 'value') => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);
    setDragOverField(null);

    try {
      const jsonData = e.dataTransfer.getData('application/json');
      if (!jsonData) return;

      const dragData = JSON.parse(jsonData);
      const { key, value, valueOnly } = dragData;

      // If dropping on the container (not a specific field), add new field
      if (targetIndex === undefined) {
        if (!valueOnly) {
          updateNodeBodyFields(id, [...bodyFields, { key, value }]);
        }
        return;
      }

      // If dropping on a specific field
      const newFields = [...bodyFields];

      if (targetField === 'value' || valueOnly) {
        // Update only the value
        newFields[targetIndex].value = value;
      } else if (targetField === 'key') {
        // Update the key
        newFields[targetIndex].key = key;
      } else {
        // Update both
        newFields[targetIndex] = { key, value };
      }

      updateNodeBodyFields(id, newFields);
    } catch (error) {
      console.error('Failed to parse drop data:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent, index?: number, field?: 'key' | 'value') => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(index ?? null);
    setDragOverField(field ?? 'container');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);
    setDragOverField(null);
  };

  return (
    <div className={`px-4 py-3 ${colors.bg} border-2 ${colors.border} ${isInActivePath ? 'ring-2 ring-opacity-50' : ''} rounded-lg shadow-md min-w-[160px] cursor-pointer transition-all`}>
      <div className="flex items-center justify-between mb-1">
        <div className={`text-xs ${colors.text} font-semibold`}>METHOD</div>
        {hasBody && (
          <div className="flex items-center gap-1">
            <button
              ref={historyButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                setShowBodyHistoryModal(!showBodyHistoryModal);
              }}
              className={`p-1 hover:${colors.bg === 'bg-blue-100' ? 'bg-blue-200' : colors.bg.replace('100', '200')} rounded`}
              title="View body history"
            >
              <History size={14} className={colors.text} />
            </button>
            <button
              onClick={handleBodyClick}
              className={`p-1 hover:${colors.bg === 'bg-blue-100' ? 'bg-blue-200' : colors.bg.replace('100', '200')} rounded`}
              title="Edit request body"
            >
              <Settings size={14} className={colors.text} />
            </button>
          </div>
        )}
      </div>
      <div className={`text-lg font-bold ${colors.text} text-center`}>
        {method}
      </div>

      {hasBody && isEditingBody && (
        <div className="mt-2 pt-2 border-t border-opacity-30" style={{ borderColor: colors.border.replace('border-', '') }}>
          <div className={`text-xs ${colors.text} mb-1`}>Request Body:</div>
          <div
            className={`space-y-1 min-h-[40px] rounded p-1 transition-colors ${dragOverField === 'container' && dragOverIndex === null ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''
              }`}
            onDrop={(e) => handleDrop(e)}
            onDragOver={(e) => handleDragOver(e)}
            onDragLeave={handleDragLeave}
          >
            {bodyFields.map((field, index) => (
              <div key={index} className="flex gap-1">
                <input
                  type="text"
                  value={field.key}
                  onChange={(e) => handleFieldChange(index, 'key', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onDrop={(e) => handleDrop(e, index, 'key')}
                  onDragOver={(e) => handleDragOver(e, index, 'key')}
                  onDragLeave={handleDragLeave}
                  placeholder="key"
                  className={`flex-1 px-1.5 py-0.5 border ${colors.border} rounded text-xs transition-colors ${dragOverIndex === index && dragOverField === 'key' ? 'border-blue-400 border-2 bg-blue-50' : ''
                    }`}
                />
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onDrop={(e) => handleDrop(e, index, 'value')}
                  onDragOver={(e) => handleDragOver(e, index, 'value')}
                  onDragLeave={handleDragLeave}
                  placeholder="value"
                  className={`flex-1 px-1.5 py-0.5 border ${colors.border} rounded text-xs transition-colors ${dragOverIndex === index && dragOverField === 'value' ? 'border-blue-400 border-2 bg-blue-50' : ''
                    }`}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBodyField(index);
                  }}
                  className={`px-1.5 text-red-600 hover:bg-red-50 rounded text-xs`}
                >
                  ×
                </button>
              </div>
            ))}
            {bodyFields.length === 0 && (
              <div className="text-xs text-gray-400 italic text-center py-2">
                Drag fields from response or click below to add
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                addBodyField();
              }}
              className={`text-xs ${colors.text} hover:underline`}
            >
              + Add field
            </button>
          </div>
        </div>
      )}

      {isActive && (
        <div className="mt-2 pt-2 border-t border-gray-300">
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-semibold text-gray-700">URL:</div>
              {computedUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyUrl();
                  }}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Copy URL"
                >
                  {copied ? (
                    <Copy size={12} className="text-green-600" />
                  ) : (
                    <Copy size={12} className="text-gray-600" />
                  )}
                </button>
              )}
            </div>
            <div className="text-xs text-gray-600 font-mono break-all p-1 bg-gray-50 rounded">
              {computedUrl || 'No path computed'}
            </div>
          </div>

          <div className="mb-2">
            <input
              type="text"
              value={bearerToken}
              onChange={(e) => {
                e.stopPropagation();
                handleBearerTokenChange(e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder="Enter token (auto-adds to Authorization header)"
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
            />
          </div>

          <div className="mb-2">
            <div className="text-xs font-semibold text-gray-700 mb-1">Headers:</div>
            <div className="space-y-1">
              {headers.map((header, index) => (
                <div key={index} className="flex gap-1">
                  <input
                    type="text"
                    value={header.key}
                    onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Key"
                    className="flex-1 px-1.5 py-0.5 border border-gray-300 rounded text-xs"
                  />
                  <input
                    type="text"
                    value={header.value}
                    onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Value"
                    className="flex-1 px-1.5 py-0.5 border border-gray-300 rounded text-xs"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeHeader(index);
                    }}
                    className="px-1.5 text-red-600 hover:bg-red-50 rounded text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addHeader();
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                + Add header
              </button>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSend();
            }}
            disabled={loading || !computedUrl}
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded font-medium text-xs flex items-center justify-center gap-2"
          >
            {loading ? (
              'Sending...'
            ) : (
              <>
                <Play size={14} />
              </>
            )}
          </button>
        </div>
      )}

      {showBodyHistoryModal && computedUrl && (
        <RequestBodyHistoryModal
          method={method}
          url={computedUrl}
          onSelectBody={(bodyFields) => {
            updateNodeBodyFields(id, bodyFields);
            setIsEditingBody(true);
          }}
          onClose={() => setShowBodyHistoryModal(false)}
          triggerButtonRef={historyButtonRef.current}
        />
      )}

      <Handle type="target" position={Position.Left} className="bg-gray-500!" />
    </div>
  );
}
