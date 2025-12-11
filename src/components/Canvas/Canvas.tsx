import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { useCanvasStore } from '../../store/useCanvasStore';
import { BaseUrlBlock } from '../Blocks/BaseUrlBlock';
import { ResourceBlock } from '../Blocks/ResourceBlock';
import { MethodBlock } from '../Blocks/MethodBlock';
import { useMemo } from 'react';

const nodeTypes = {
  baseUrl: BaseUrlBlock,
  resource: ResourceBlock,
  method: MethodBlock,
};

export function Canvas() {
  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const onNodesChange = useCanvasStore((state) => state.onNodesChange);
  const onEdgesChange = useCanvasStore((state) => state.onEdgesChange);
  const onConnect = useCanvasStore((state) => state.onConnect);
  const setActivePath = useCanvasStore((state) => state.setActivePath);

  // Map nodes to use custom types
  const mappedNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        type: node.data.type,
      })),
    [nodes]
  );

  const handleNodeClick = (_event: React.MouseEvent, node: any) => {
    // Only activate path when clicking method blocks
    if (node.data.type === 'method') {
      setActivePath(node.id);
    }
  };

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={mappedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
