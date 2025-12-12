import { nanoid } from 'nanoid';
import { parse as parseYaml } from 'yaml';
import type { ApiBlock, HttpMethod, BodyField } from '../types';
import type { Edge } from 'reactflow';

// OpenAPI Types (simplified for our needs)
interface OpenAPISchema {
    type?: string;
    properties?: Record<string, OpenAPISchema>;
    required?: string[];
    items?: OpenAPISchema;
    $ref?: string;
}

interface OpenAPIRequestBody {
    content?: {
        'application/json'?: {
            schema?: OpenAPISchema;
        };
    };
}

interface OpenAPIOperation {
    summary?: string;
    operationId?: string;
    tags?: string[];
    parameters?: Array<{
        name: string;
        in: 'path' | 'query' | 'header';
        required?: boolean;
        schema?: OpenAPISchema;
    }>;
    requestBody?: OpenAPIRequestBody;
}

interface OpenAPIPathItem {
    get?: OpenAPIOperation;
    post?: OpenAPIOperation;
    put?: OpenAPIOperation;
    delete?: OpenAPIOperation;
    patch?: OpenAPIOperation;
}

interface OpenAPISpec {
    openapi?: string;
    info?: {
        title?: string;
        version?: string;
        description?: string;
    };
    servers?: Array<{ url: string }>;
    paths?: Record<string, OpenAPIPathItem>;
    components?: {
        schemas?: Record<string, OpenAPISchema>;
    };
}

// Layout constants - generous spacing for readability
const LAYOUT = {
    BASE_URL_X: 100,
    BASE_URL_Y: 300,
    RESOURCE_START_X: 400,
    RESOURCE_SPACING_X: 280,
    PATH_SPACING_Y: 220,
    METHOD_OFFSET_X: 80,
    METHOD_SPACING_Y: 90,
};

// Result type
export interface ImportResult {
    nodes: ApiBlock[];
    edges: Edge[];
    stats: {
        endpoints: number;
        baseUrl: string;
        paths: number;
    };
}

/**
 * Resolve a $ref to get the actual schema
 */
function resolveRef(ref: string, spec: OpenAPISpec): OpenAPISchema | undefined {
    // Parse refs like "#/components/schemas/post"
    const match = ref.match(/^#\/components\/schemas\/(.+)$/);
    if (match && spec.components?.schemas) {
        return spec.components.schemas[match[1]];
    }
    return undefined;
}

/**
 * Extract body fields from OpenAPI request body schema
 */
function extractBodyFields(requestBody: OpenAPIRequestBody | undefined, spec: OpenAPISpec): BodyField[] {
    let schema = requestBody?.content?.['application/json']?.schema;
    if (!schema) return [];

    // Resolve $ref if present
    if (schema.$ref) {
        schema = resolveRef(schema.$ref, spec);
        if (!schema) return [];
    }

    if (!schema.properties) return [];

    const fields: BodyField[] = [];

    for (const key of Object.keys(schema.properties)) {
        // Skip complex nested objects/arrays for now, just add the key
        fields.push({
            key,
            value: '', // Empty default value
        });
    }

    return fields;
}

/**
 * Parse a path string into segments
 * e.g., "/users/{userId}/orders" → ["users", "{userId}", "orders"]
 */
function parsePathSegments(path: string): string[] {
    return path
        .split('/')
        .filter((segment) => segment.length > 0);
}

/**
 * Build a tree structure from paths to share common prefixes
 */
interface PathNode {
    segment: string;
    children: Map<string, PathNode>;
    methods: Array<{ method: HttpMethod; operation: OpenAPIOperation }>;
    fullPath: string;
}

function buildPathTree(paths: Record<string, OpenAPIPathItem>): PathNode {
    const root: PathNode = {
        segment: '',
        children: new Map(),
        methods: [],
        fullPath: '',
    };

    for (const [path, pathItem] of Object.entries(paths)) {
        const segments = parsePathSegments(path);
        let current = root;
        let currentPath = '';

        for (const segment of segments) {
            currentPath += '/' + segment;

            if (!current.children.has(segment)) {
                current.children.set(segment, {
                    segment,
                    children: new Map(),
                    methods: [],
                    fullPath: currentPath,
                });
            }
            current = current.children.get(segment)!;
        }

        // Add methods to the leaf node
        const httpMethods: Array<{ key: keyof OpenAPIPathItem; method: HttpMethod }> = [
            { key: 'get', method: 'GET' },
            { key: 'post', method: 'POST' },
            { key: 'put', method: 'PUT' },
            { key: 'delete', method: 'DELETE' },
            { key: 'patch', method: 'PATCH' },
        ];

        for (const { key, method } of httpMethods) {
            if (pathItem[key]) {
                current.methods.push({ method, operation: pathItem[key]! });
            }
        }
    }

    return root;
}

/**
 * Convert OpenAPI spec to TLDFetch nodes and edges
 */
export function importOpenAPI(spec: OpenAPISpec): ImportResult {
    const nodes: ApiBlock[] = [];
    const edges: Edge[] = [];

    // Get base URL
    const baseUrl = spec.servers?.[0]?.url || 'http://localhost:3000';

    // Create base URL node
    const baseUrlId = nanoid();
    nodes.push({
        id: baseUrlId,
        type: 'baseUrl',
        position: { x: LAYOUT.BASE_URL_X, y: LAYOUT.BASE_URL_Y },
        data: { type: 'baseUrl', value: baseUrl },
    });

    // Build path tree
    const pathTree = buildPathTree(spec.paths || {});

    // Track created nodes to share resources
    const resourceNodeMap = new Map<string, string>(); // fullPath → nodeId
    let totalEndpoints = 0;

    // Recursively create nodes from tree
    function processNode(
        node: PathNode,
        parentId: string,
        depth: number,
        yOffset: number
    ): number {
        let currentY = yOffset;

        for (const [segment, child] of node.children) {
            const nodeId = nanoid();
            const isParam = segment.startsWith('{') && segment.endsWith('}');

            // Calculate position
            const x = LAYOUT.RESOURCE_START_X + (depth * LAYOUT.RESOURCE_SPACING_X);
            const y = currentY;

            // Create resource node
            nodes.push({
                id: nodeId,
                type: 'resource',
                position: { x, y },
                data: {
                    type: 'resource',
                    value: segment,
                    isParam,
                },
            });

            // Connect to parent
            edges.push({
                id: nanoid(),
                source: parentId,
                target: nodeId,
            });

            // Store for reference
            resourceNodeMap.set(child.fullPath, nodeId);

            // Create method nodes for this resource
            let methodY = y;
            for (const { method, operation } of child.methods) {
                const methodId = nanoid();
                const bodyFields = extractBodyFields(operation.requestBody, spec);

                nodes.push({
                    id: methodId,
                    type: 'method',
                    position: {
                        x: x + LAYOUT.RESOURCE_SPACING_X + LAYOUT.METHOD_OFFSET_X,
                        y: methodY,
                    },
                    data: {
                        type: 'method',
                        value: '',
                        method,
                        bodyFields: bodyFields.length > 0 ? bodyFields : undefined,
                    },
                });

                edges.push({
                    id: nanoid(),
                    source: nodeId,
                    target: methodId,
                });

                methodY += LAYOUT.METHOD_SPACING_Y;
                totalEndpoints++;
            }

            // Calculate space needed for children
            const methodsHeight = Math.max(
                child.methods.length * LAYOUT.METHOD_SPACING_Y,
                LAYOUT.PATH_SPACING_Y
            );

            // Process children recursively
            const childrenHeight = processNode(
                child,
                nodeId,
                depth + 1,
                currentY
            );

            // Move Y for next sibling
            currentY += Math.max(methodsHeight, childrenHeight, LAYOUT.PATH_SPACING_Y);
        }

        return currentY - yOffset;
    }

    // Start processing from root
    processNode(pathTree, baseUrlId, 0, LAYOUT.BASE_URL_Y - 100);

    return {
        nodes,
        edges,
        stats: {
            endpoints: totalEndpoints,
            baseUrl,
            paths: Object.keys(spec.paths || {}).length,
        },
    };
}

/**
 * Parse OpenAPI from JSON or YAML string
 */
export function parseOpenAPIJson(content: string): OpenAPISpec {
    // Try JSON first
    try {
        return JSON.parse(content) as OpenAPISpec;
    } catch {
        // If JSON fails, try YAML
        try {
            return parseYaml(content) as OpenAPISpec;
        } catch {
            throw new Error('Invalid JSON or YAML format');
        }
    }
}

/**
 * Validate that the spec looks like OpenAPI
 */
export function validateOpenAPISpec(spec: unknown): spec is OpenAPISpec {
    if (!spec || typeof spec !== 'object') return false;
    const s = spec as Record<string, unknown>;

    // Check for OpenAPI 3.x or Swagger 2.x markers
    const hasOpenApi = 'openapi' in s && typeof s.openapi === 'string';
    const hasSwagger = 'swagger' in s && typeof s.swagger === 'string';
    const hasPaths = 'paths' in s && typeof s.paths === 'object';

    return (hasOpenApi || hasSwagger) && hasPaths;
}
