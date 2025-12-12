import { Plus, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { type HttpMethod } from '../../types';

export function BlockToolbar() {
  const addNode = useCanvasStore((state) => state.addNode);
  const resetToDefault = useCanvasStore((state) => state.resetToDefault);
  const importFromOpenAPI = useCanvasStore((state) => state.importFromOpenAPI);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = importFromOpenAPI(text);
      setImportStatus(`✓ Imported ${result.stats.endpoints} endpoints from ${result.stats.paths} paths`);
      setTimeout(() => setImportStatus(null), 4000);
    } catch (error) {
      setImportStatus(`✗ ${error instanceof Error ? error.message : 'Import failed'}`);
      setTimeout(() => setImportStatus(null), 4000);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

        <div className="border-l border-gray-200 pl-2 flex items-center gap-2">
          {/* Import OpenAPI Button */}
          <button
            onClick={handleImportClick}
            className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs font-medium flex items-center gap-1.5 whitespace-nowrap"
            title="Import from OpenAPI/Swagger JSON file"
          >
            <Upload size={14} />
            Import OpenAPI
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.yaml,.yml"
            onChange={handleFileChange}
            className="hidden"
          />

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

      {/* Import Status Toast */}
      {importStatus && (
        <div className={`absolute top-full left-0 mt-2 px-3 py-2 rounded-lg text-xs font-medium shadow-lg ${importStatus.startsWith('✓')
            ? 'bg-green-100 text-green-700 border border-green-200'
            : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
          {importStatus}
        </div>
      )}
    </div>
  );
}
