import { type Node, type Edge } from 'reactflow';

export type BlockType = 'baseUrl' | 'resource' | 'method' | 'request';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface BodyField {
  key: string;
  value: string;
}

export interface HeaderField {
  key: string;
  value: string;
}

export interface BlockData {
  type: BlockType;
  value: string;
  method?: HttpMethod;
  isParam?: boolean;
  paramValue?: string;
  bodyFields?: BodyField[];
  headers?: HeaderField[];
  bearerToken?: string;
}

export type ApiBlock = Node<BlockData>;

export interface RequestState {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body: string;
}

export interface ResponseState {
  status: number;
  statusText: string;
  data: any;
  headers: Record<string, string>;
  time: number;
  size: number;
}

export interface HistoryItem extends ResponseState {
  id: string;
  url: string;
  method: HttpMethod;
  timestamp: number;
}

export interface RequestBodyHistoryItem {
  id: string;
  method: HttpMethod;
  url: string;
  bodyFields: BodyField[];
  timestamp: number;
}

export interface CanvasState {
  nodes: ApiBlock[];
  edges: Edge[];
  activePathId: string | null;
  activePathNodes: string[];
  request: RequestState | null;
  response: ResponseState | null;
  history: HistoryItem[];
  bodyHistory: RequestBodyHistoryItem[];
  variables: Record<string, string>;
}
