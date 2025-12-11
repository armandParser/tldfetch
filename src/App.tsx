import { ReactFlowProvider } from 'reactflow';
import { Canvas } from './components/Canvas/Canvas';
import { BlockToolbar } from './components/Toolbar/BlockToolbar';
import { ResponseModal } from './components/Panels/ResponseModal';
import { ResponseHistory } from './components/Panels/ResponseHistory';

function App() {
  return (
    <ReactFlowProvider>
      <div className="w-screen h-screen relative">
        <Canvas />
        <BlockToolbar />

        {/* Bottom-right panel container with flex layout */}
        <div className="absolute bottom-4 right-4 flex flex-col justify-end items-end gap-2 max-h-[calc(100vh-2rem)] pointer-events-none">
          <div className="pointer-events-auto">
            <ResponseHistory />
          </div>
          <div className="pointer-events-auto">
            <ResponseModal />
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}

export default App;
