import { useState, useRef, useEffect } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { Clock, X } from 'lucide-react';
import type { HttpMethod, BodyField } from '../../types';

interface RequestBodyHistoryModalProps {
    method: HttpMethod;
    url: string;
    onSelectBody: (bodyFields: BodyField[]) => void;
    onClose: () => void;
    triggerButtonRef: HTMLButtonElement | null;
}

export function RequestBodyHistoryModal({
    method,
    url,
    onSelectBody,
    onClose,
    triggerButtonRef,
}: RequestBodyHistoryModalProps) {
    const getBodyHistoryForEndpoint = useCanvasStore(
        (state) => state.getBodyHistoryForEndpoint
    );
    const removeBodyHistoryItem = useCanvasStore(
        (state) => state.removeBodyHistoryItem
    );
    const modalRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

    const history = getBodyHistoryForEndpoint(method, url);

    // Position modal near the trigger button
    useEffect(() => {
        if (triggerButtonRef) {
            const buttonRect = triggerButtonRef.getBoundingClientRect();

            // Calculate position immediately
            // Position to the right of the button by default
            let left = buttonRect.right - 500;
            let top = buttonRect.top - 250;

            // If modal width would go off-screen to the right, position to the left
            const estimatedModalWidth = 384; // w-96 = 384px
            if (left + estimatedModalWidth > window.innerWidth) {
                left = buttonRect.left - estimatedModalWidth - 16;
            }

            // If still going off left edge, just center it
            if (left < 16) {
                left = (window.innerWidth - estimatedModalWidth) / 2;
            }

            // Ensure top doesn't go off screen
            const estimatedModalHeight = 400;
            if (top + estimatedModalHeight > window.innerHeight) {
                top = Math.max(16, window.innerHeight - estimatedModalHeight - 16);
            }

            setPosition({ top, left });
        }
    }, [triggerButtonRef]);

    const getRelativeTime = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const handleSelectBody = (bodyFields: BodyField[]) => {
        onSelectBody(bodyFields);
        onClose();
    };

    // Don't render modal until position is calculated
    if (!position) {
        return null;
    }

    if (history.length === 0) {
        return (
            <div
                ref={modalRef}
                className="fixed bg-white rounded-lg shadow-2xl border border-gray-300 p-4 w-80 z-50"
                style={{ top: position.top, left: position.left }}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-600" />
                        <span className="text-sm font-semibold text-gray-700">
                            Request Body History
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Close"
                    >
                        <X size={14} className="text-gray-600" />
                    </button>
                </div>
                <div className="text-sm text-gray-500 italic text-center py-4">
                    No body history for this endpoint yet
                </div>
            </div>
        );
    }

    return (
        <div
            ref={modalRef}
            className="fixed bg-white rounded-lg shadow-2xl border border-gray-300 p-4 w-96 max-h-[500px] flex flex-col z-50"
            style={{ top: position.top, left: position.left }}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">
                        Request Body History
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Close"
                >
                    <X size={14} className="text-gray-600" />
                </button>
            </div>

            <div className="text-xs text-gray-500 mb-2 font-mono truncate">
                {method} {url}
            </div>

            <div className="overflow-auto flex-1 space-y-2">
                {history.map((item) => (
                    <div
                        key={item.id}
                        className="relative p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded transition-colors group"
                    >
                        <button
                            onClick={() => handleSelectBody(item.bodyFields)}
                            className="w-full text-left"
                        >
                            <div className="flex items-center justify-between mb-2 pr-6">
                                <span className="text-xs text-gray-500">
                                    {getRelativeTime(item.timestamp)}
                                </span>
                                <span className="text-xs text-blue-600 font-medium">
                                    {item.bodyFields.length} field{item.bodyFields.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="space-y-1">
                                {item.bodyFields.slice(0, 3).map((field, idx) => (
                                    <div key={idx} className="text-xs font-mono">
                                        <span className="text-blue-700 font-semibold">{field.key}:</span>{' '}
                                        <span className="text-gray-700 truncate">
                                            {field.value.length > 30
                                                ? `${field.value.substring(0, 30)}...`
                                                : field.value}
                                        </span>
                                    </div>
                                ))}
                                {item.bodyFields.length > 3 && (
                                    <div className="text-xs text-gray-400 italic">
                                        +{item.bodyFields.length - 3} more
                                    </div>
                                )}
                            </div>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                removeBodyHistoryItem(item.id);
                            }}
                            className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded transition-all text-gray-400 hover:text-red-600"
                            title="Delete this history item"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
