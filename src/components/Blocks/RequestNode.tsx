import { useState } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Play } from 'lucide-react';
import type { BlockData } from '../../types';
import { useCanvasStore } from '../../store/useCanvasStore';
import axios from 'axios';

export function RequestNode({ data, id }: NodeProps<BlockData>) {
    const nodes = useCanvasStore((state) => state.nodes);
    const edges = useCanvasStore((state) => state.edges);
    const activePathId = useCanvasStore((state) => state.activePathId);
    const variables = useCanvasStore((state) => state.variables);
    const setResponse = useCanvasStore((state) => state.setResponse);
    const updateNodeHeaders = useCanvasStore((state) => state.updateNodeHeaders);

    const [loading, setLoading] = useState(false);
    const headers = data.headers || [{ key: 'Content-Type', value: 'application/json' }];

    // Compute URL and method from active path
    let url: string | null = null;
    let method: string = 'GET';
    let bodyFields: Array<{ key: string; value: string }> = [];

    if (activePathId) {
        const pathNodeIds: string[] = [];
        const visitedNodes = new Set<string>();

        const traceBackwards = (nodeId: string): boolean => {
            if (visitedNodes.has(nodeId)) return false;
            visitedNodes.add(nodeId);

            const node = nodes.find((n) => n.id === nodeId);
            if (!node) return false;

            pathNodeIds.unshift(nodeId);

            if (node.data.type === 'baseUrl') {
                return true;
            }

            const incomingEdges = edges.filter((e) => e.target === nodeId);
            for (const edge of incomingEdges) {
                if (traceBackwards(edge.source)) {
                    return true;
                }
            }

            pathNodeIds.shift();
            return false;
        };

        if (traceBackwards(activePathId)) {
            const path: string[] = [];
            for (const nodeId of pathNodeIds) {
                const node = nodes.find((n) => n.id === nodeId);
                if (!node) continue;

                if (node.data.type === 'baseUrl') {
                    path.push(node.data.value);
                } else if (node.data.type === 'resource') {
                    let value = node.data.value;
                    const isParam = /\{(.+)\}/.test(value);
                    if (isParam) {
                        value = value.replace(/\{(\w+)\}/g, (_, key) => {
                            return variables[key] || `{${key}}`;
                        });
                    }
                    path.push(value);
                } else if (node.data.type === 'method') {
                    method = node.data.method || 'GET';
                    bodyFields = node.data.bodyFields || [];
                }
            }

            url = path.join('/').replace(/([^:]\/)\/+/g, '$1');
        }
    }

    const handleSend = async () => {
        if (!url) return;

        setLoading(true);
        const startTime = Date.now();

        try {
            const headersObj = headers.reduce((acc, { key, value }) => {
                if (key && value) acc[key] = value;
                return acc;
            }, {} as Record<string, string>);

            const config: any = {
                method,
                url,
                headers: headersObj,
            };

            if (['POST', 'PUT', 'PATCH'].includes(method) && bodyFields.length > 0) {
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
            });
        } catch (error: any) {
            const endTime = Date.now();
            setResponse({
                status: error.response?.status || 0,
                statusText: error.response?.statusText || 'Error',
                data: error.response?.data || { error: error.message },
                headers: error.response?.headers || {},
                time: endTime - startTime,
                size: 0,
            });
        } finally {
            setLoading(false);
        }
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

    const methodColors: Record<string, string> = {
        GET: 'bg-green-100 text-green-700 border-green-400',
        POST: 'bg-blue-100 text-blue-700 border-blue-400',
        PUT: 'bg-yellow-100 text-yellow-700 border-yellow-400',
        PATCH: 'bg-purple-100 text-purple-700 border-purple-400',
        DELETE: 'bg-red-100 text-red-700 border-red-400',
    };

    const colorClass = methodColors[method] || 'bg-gray-100 text-gray-700 border-gray-400';

    return (
        <div className="px-4 py-3 bg-white border-2 border-gray-300 rounded-lg shadow-md min-w-[300px]">
            <div className="text-xs font-semibold text-gray-600 mb-2">REQUEST</div>

            <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 ${colorClass} border font-bold text-xs rounded`}>
                        {method}
                    </span>
                    <span className="text-xs text-gray-600 font-mono truncate flex-1">
                        {url || 'No path selected'}
                    </span>
                </div>
            </div>

            <div className="mb-3">
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
                disabled={loading || !url}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded font-medium text-sm flex items-center justify-center gap-2"
            >
                {loading ? (
                    'Sending...'
                ) : (
                    <>
                        <Play size={16} />
                        Send Request
                    </>
                )}
            </button>

            <Handle type="target" position={Position.Left} className="bg-gray-500!" />
        </div>
    );
}
