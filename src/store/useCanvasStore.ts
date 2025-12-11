import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges, type Connection, type NodeChange, type EdgeChange } from 'reactflow';
import { nanoid } from 'nanoid';
import type { CanvasState, ApiBlock, BlockType, HttpMethod, RequestState, ResponseState, BodyField, HeaderField, HistoryItem, RequestBodyHistoryItem } from '../types';
import { saveState, loadState } from './indexedDB';

// Helper function to compute the active path nodes
function computeActivePathNodes(
  activePathId: string | null,
  nodes: ApiBlock[],
  edges: any[]
): string[] {
  if (!activePathId) return [];

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

  traceBackwards(activePathId);
  return pathNodeIds;
}

interface CanvasStore extends CanvasState {
  // Node operations
  addNode: (type: BlockType, value: string, method?: HttpMethod) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  updateNodeValue: (id: string, value: string) => void;
  updateNodeBodyFields: (id: string, bodyFields: BodyField[]) => void;
  updateNodeHeaders: (id: string, headers: HeaderField[]) => void;
  ensureRequestNode: (methodNodeId: string) => void;

  // Path operations
  setActivePath: (nodeId: string | null) => void;
  getComputedUrl: () => string | null;

  // Request/Response
  setRequest: (request: RequestState) => void;
  setResponse: (response: ResponseState, url?: string, method?: HttpMethod) => void;
  clearResponse: () => void;
  clearHistory: () => void;
  removeHistoryItem: (id: string) => void;

  // Body History
  addBodyHistory: (method: HttpMethod, url: string, bodyFields: BodyField[]) => void;
  getBodyHistoryForEndpoint: (method: HttpMethod, url: string) => RequestBodyHistoryItem[];
  removeBodyHistoryItem: (id: string) => void;

  // Variables
  setVariable: (key: string, value: string) => void;

  // Reset
  resetToDefault: () => void;
}

// Create default starter nodes and edges
function createDefaultState(): CanvasState {
  // Create node IDs
  const baseUrlId = 'default-base-url';
  const healthResourceId = 'default-health-resource';
  const healthMethodId = 'default-health-method';
  const authResourceId = 'default-auth-resource';
  const loginResourceId = 'default-login-resource';
  const loginMethodId = 'default-login-method';

  return {
    nodes: [
      // Base URL node
      {
        id: baseUrlId,
        type: 'baseUrl',
        position: { x: 100, y: 200 },
        data: { type: 'baseUrl', value: 'http://localhost:3000' },
      },
      // Health endpoint
      {
        id: healthResourceId,
        type: 'resource',
        position: { x: 350, y: 100 },
        data: { type: 'resource', value: 'health' },
      },
      {
        id: healthMethodId,
        type: 'method',
        position: { x: 600, y: 100 },
        data: { type: 'method', value: '', method: 'GET' },
      },
      // Auth endpoint
      {
        id: authResourceId,
        type: 'resource',
        position: { x: 350, y: 300 },
        data: { type: 'resource', value: 'auth' },
      },
      {
        id: loginResourceId,
        type: 'resource',
        position: { x: 600, y: 300 },
        data: { type: 'resource', value: 'login' },
      },
      {
        id: loginMethodId,
        type: 'method',
        position: { x: 850, y: 300 },
        data: {
          type: 'method',
          value: '',
          method: 'POST',
          bodyFields: [
            { key: 'email', value: '' },
            { key: 'password', value: '' },
          ],
        },
      },
    ],
    edges: [
      // Base URL → health
      { id: 'edge-base-health', source: baseUrlId, target: healthResourceId },
      // health → GET
      { id: 'edge-health-get', source: healthResourceId, target: healthMethodId },
      // Base URL → auth
      { id: 'edge-base-auth', source: baseUrlId, target: authResourceId },
      // auth → login
      { id: 'edge-auth-login', source: authResourceId, target: loginResourceId },
      // login → POST
      { id: 'edge-login-post', source: loginResourceId, target: loginMethodId },
    ],
    activePathId: null,
    activePathNodes: [],
    request: null,
    response: null,
    history: [],
    bodyHistory: [],
    variables: {},
  };
}

// Default initial state
const defaultState: CanvasState = createDefaultState();

// Debounce helper - saves complete state from store
let saveTimeout: number | undefined;
const debouncedSave = () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = window.setTimeout(() => {
    const state = useCanvasStore.getState();
    // Save all persistable state
    saveState({
      nodes: state.nodes,
      edges: state.edges,
      activePathId: state.activePathId,
      activePathNodes: state.activePathNodes,
      history: state.history,
      bodyHistory: state.bodyHistory,
      variables: state.variables,
      // Don't persist request/response as they're transient
    }).catch((error) => {
      console.error('Failed to persist state:', error);
    });
  }, 500); // 500ms debounce
};

// Create the store with default state (will be hydrated after creation)
export const useCanvasStore = create<CanvasStore>((set, get) => ({
  ...defaultState,

  addNode: (type, value, method) => {
    const newNode: ApiBlock = {
      id: nanoid(),
      type: type, // ✨ Use actual block type
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { type, value, method },
    };

    set((state) => {
      const newState = { nodes: [...state.nodes, newNode] };
      debouncedSave();
      return newState;
    });
  },

  onNodesChange: (changes) => {
    set((state) => {
      const newNodes = applyNodeChanges(changes, state.nodes) as ApiBlock[];
      const newActivePathNodes = computeActivePathNodes(
        state.activePathId,
        newNodes,
        state.edges
      );
      const updates = {
        nodes: newNodes,
        activePathNodes: newActivePathNodes,
      };
      debouncedSave();
      return updates;
    });
  },

  onEdgesChange: (changes) => {
    set((state) => {
      const newEdges = applyEdgeChanges(changes, state.edges);
      const newActivePathNodes = computeActivePathNodes(
        state.activePathId,
        state.nodes,
        newEdges
      );
      const updates = {
        edges: newEdges,
        activePathNodes: newActivePathNodes,
      };
      debouncedSave();
      return updates;
    });
  },

  onConnect: (connection) => {
    set((state) => {
      const newEdges = addEdge({ ...connection, id: nanoid() }, state.edges);
      const newActivePathNodes = computeActivePathNodes(
        state.activePathId,
        state.nodes,
        newEdges
      );
      const updates = {
        edges: newEdges,
        activePathNodes: newActivePathNodes,
      };
      debouncedSave();
      return updates;
    });
  },

  updateNodeValue: (id, value) => {
    set((state) => {
      const newNodes = state.nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, value } }
          : node
      );
      debouncedSave();
      return { nodes: newNodes };
    });
  },

  updateNodeBodyFields: (id, bodyFields) => {
    set((state) => {
      const newNodes = state.nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, bodyFields } }
          : node
      );
      debouncedSave();
      return { nodes: newNodes };
    });
  },

  updateNodeHeaders: (id, headers) => {
    set((state) => {
      const newNodes = state.nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, headers } }
          : node
      );
      debouncedSave();
      return { nodes: newNodes };
    });
  },

  ensureRequestNode: (methodNodeId) => {
    const { nodes, edges } = get();

    const existingRequestEdge = edges.find(
      (e) => e.source === methodNodeId && nodes.find((n) => n.id === e.target && n.data.type === 'request')
    );

    if (existingRequestEdge) {
      return;
    }

    const methodNode = nodes.find((n) => n.id === methodNodeId);
    if (!methodNode || methodNode.data.type !== 'method') return;

    const requestNode: ApiBlock = {
      id: nanoid(),
      type: 'default',
      position: {
        x: methodNode.position.x + 250,
        y: methodNode.position.y
      },
      data: {
        type: 'request',
        value: '',
        headers: [{ key: 'Content-Type', value: 'application/json' }]
      },
    };

    const newEdge = {
      id: nanoid(),
      source: methodNodeId,
      target: requestNode.id,
    };

    set((state) => {
      const newNodes = [...state.nodes, requestNode];
      const newEdges = [...state.edges, newEdge];
      debouncedSave();
      return { nodes: newNodes, edges: newEdges };
    });
  },

  setActivePath: (nodeId) => {
    set((state) => {
      const newActivePathNodes = computeActivePathNodes(
        nodeId,
        state.nodes,
        state.edges
      );
      const updates = {
        activePathId: nodeId,
        activePathNodes: newActivePathNodes,
      };
      debouncedSave();
      return updates;
    });
  },

  getComputedUrl: () => {
    const { nodes, edges, activePathId, variables } = get();

    if (!activePathId) return null;

    const activeNode = nodes.find((n) => n.id === activePathId);
    if (!activeNode) return null;

    const path: string[] = [];
    const visitedNodes = new Set<string>();

    const traceBackwards = (nodeId: string): boolean => {
      if (visitedNodes.has(nodeId)) return false;
      visitedNodes.add(nodeId);

      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return false;

      if (node.data.type === 'baseUrl') {
        path.unshift(node.data.value);
        return true;
      }

      if (node.data.type === 'resource') {
        let value = node.data.value;

        const isParam = /\{(.+)\}/.test(value);
        if (isParam) {
          value = value.replace(/\{(\w+)\}/g, (_, key) => {
            return variables[key] || `{${key}}`;
          });
        }

        path.unshift(value);
      }

      const incomingEdges = edges.filter((e) => e.target === nodeId);

      for (const edge of incomingEdges) {
        if (traceBackwards(edge.source)) {
          return true;
        }
      }

      return false;
    };

    const foundPath = traceBackwards(activePathId);

    if (!foundPath || path.length === 0) return null;

    return path.join('/').replace(/([^:]\/)\/+/g, '$1');
  },

  setRequest: (request) => {
    set({ request });
    debouncedSave();
  },

  setResponse: (response, url, method) => {
    set((state) => {
      const updates: Partial<CanvasState> = { response };

      // Add to history if we have url and method
      if (url && method) {
        const historyItem: HistoryItem = {
          ...response,
          id: nanoid(),
          url,
          method,
          timestamp: Date.now(),
        };

        // Keep last 10 items, newest first
        updates.history = [historyItem, ...state.history].slice(0, 10);
      }

      debouncedSave();
      return updates;
    });
  },

  clearResponse: () => {
    set({ response: null });
    debouncedSave();
  },

  clearHistory: () => {
    set({ history: [] });
    debouncedSave();
  },

  removeHistoryItem: (id) => {
    set((state) => {
      const newHistory = state.history.filter((item) => item.id !== id);
      debouncedSave();
      return { history: newHistory };
    });
  },

  addBodyHistory: (method, url, bodyFields) => {
    // Only add if there are body fields
    if (bodyFields.length === 0) return;

    set((state) => {
      const historyItem: RequestBodyHistoryItem = {
        id: nanoid(),
        method,
        url,
        // Deep clone to avoid reference issues
        bodyFields: bodyFields.map(field => ({ ...field })),
        timestamp: Date.now(),
      };

      // Keep all items, just add new one and limit to 50 total
      const newBodyHistory = [historyItem, ...state.bodyHistory].slice(0, 50);
      debouncedSave();
      return { bodyHistory: newBodyHistory };
    });
  },

  getBodyHistoryForEndpoint: (method, url) => {
    const { bodyHistory } = get();
    return bodyHistory.filter(
      (item) => item.method === method && item.url === url
    );
  },

  removeBodyHistoryItem: (id) => {
    set((state) => {
      const newBodyHistory = state.bodyHistory.filter((item) => item.id !== id);
      debouncedSave();
      return { bodyHistory: newBodyHistory };
    });
  },

  setVariable: (key, value) => {
    set((state) => {
      const newVariables = { ...state.variables, [key]: value };
      debouncedSave();
      return { variables: newVariables };
    });
  },

  resetToDefault: () => {
    const newState = createDefaultState();
    set(newState);
    // Save the default state to IndexedDB
    debouncedSave();
  },
}));

/**
 * Hydrate store with saved state from IndexedDB
 * Call this once when the app initializes
 */
export async function hydrateStore() {
  const savedState = await loadState();
  if (savedState) {
    useCanvasStore.setState(savedState);
  }
}

