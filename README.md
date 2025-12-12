# TLDFetch - Visual API Client

A canvas-based API testing tool where you create visual flows using blocks and arrows to construct and execute API requests. Think tldraw meets Postman, but more intuitive and visual.

## ✨ Key Features

### Visual Block System
- **Base URL Block** (blue): Your API's base URL (e.g., `http://localhost:3000`)
- **Resource Block** (pink): API endpoints and path segments (e.g., `users`, `posts`)
- **Method Block** (color-coded): HTTP methods (GET, POST, PUT, DELETE, PATCH)

### Smart Workflow
- **Arrow Connections**: Connect blocks to build your API path visually
- **Live URL Preview**: See your constructed URL in real-time
- **Request Configuration**: Configure headers and request body with ease
- **Response Viewer**: View response data with tabs for body, headers, and raw data
- **Parameter Support**: Use `{variableName}` in resource blocks for dynamic parameters

### Persistence & Convenience
- **🔄 Auto-Save**: All your work is automatically saved to browser storage (IndexedDB)
- **📦 Default Starter State**: New projects start with helpful example endpoints
- **🗑️ Erase All**: Reset to default state with one click
- **📜 Request History**: Track your recent API calls with expandable history panel

### Import & Export
- **📥 OpenAPI Import**: Import API schemas from OpenAPI/Swagger files (JSON & YAML supported)
- Automatically creates visual blocks and connections from your API specification
- Extracts request body fields from schemas

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

### Build

```bash
npm run build
```

## How to Use

### Your First Request (Using Default State)

When you first open TLDFetch, you'll see example endpoints already set up:
- `http://localhost:3000` → `/health` → GET
- `http://localhost:3000` → `/auth/login` → POST (with email/password fields)

1. Click on the GET method block connected to `/health`
2. Click "Send Request" in the right panel
3. View the response in the bottom-right panel

### Creating Custom Blocks

Use the toolbar at the top-left to add blocks:
- **Base URL**: Click to add a base URL block
- **Resource**: Click to add a resource/endpoint block  
- **GET/POST/PUT/DELETE/PATCH**: Click to add a method block

### Connecting Blocks

1. Click and drag from a block's connection point (circular handles)
2. Release on another block to create a connection
3. The path flows: Base URL → Resources → Method

Example flow:
```
[Base URL: https://api.github.com] → [users] → [octocat] → [GET]
```
Result: `https://api.github.com/users/octocat`

### Editing Blocks

- **Double-click** any block to edit its value
- **Base URL**: Enter the full base URL with protocol
- **Resources**: Enter the path segment (or use `{param}` for dynamic values)
- **Methods**: Cannot be edited (fixed values)

### Using Parameters

Create dynamic URLs with parameters:
1. Create a resource block
2. Double-click to edit it
3. Enter a value with curly braces: `{userId}`
4. The block will turn orange, indicating it's a parameter

### Sending Requests

Once you have a valid path (Base URL → Resources → Method):
1. The Active URL display will show your constructed URL
2. A Request Panel appears with configuration options
3. Add headers if needed (default: `Content-Type: application/json`)
4. Add request body for POST/PUT/PATCH (use key-value fields or JSON)
5. Click "Send Request"
6. View the response in the bottom-right panel

### Drag & Drop Response Values

Extract values from API responses and use them in subsequent requests:
1. Send a request (e.g., login to get a token)
2. In the response viewer, **drag** any field from the JSON response
3. **Drop** it onto any request field (headers, body fields, or URL parameters)
4. Perfect for workflows like: login → get token → use token in authenticated requests

**Example workflow:**
- Login via `/auth/login` POST → get `token` from response
- Drag the `token` value from response
- Drop it onto the Authorization header of your next request


### Request History

- All successful requests are saved to your history
- View history in the collapsible panel above the response viewer
- Click any history item to expand and see the full response
- Delete individual items with the ❌ button

### Erase All

Click the red "Erase All" button in the toolbar to:
- Clear all blocks and connections
- Reset to the default starter state
- Start fresh with example endpoints

## Tech Stack

- **React 19** + **TypeScript**: UI framework
- **React Flow**: Canvas and node-based graph system
- **Zustand**: State management
- **IndexedDB**: Client-side persistence
- **Tailwind CSS v4**: Styling
- **Axios**: HTTP client
- **Vite**: Build tool
- **Lucide React**: Icons

## Project Structure

```
src/
├── components/
│   ├── Blocks/
│   │   ├── BaseUrlBlock.tsx       # Blue base URL block
│   │   ├── ResourceBlock.tsx      # Pink resource/parameter block
│   │   ├── MethodBlock.tsx        # Color-coded HTTP method block
│   │   └── RequestNode.tsx        # Request configuration node
│   ├── Canvas/
│   │   └── Canvas.tsx             # Main React Flow canvas
│   ├── Panels/
│   │   ├── ResponseModal.tsx      # Response viewer
│   │   └── ResponseHistory.tsx    # Request history panel
│   ├── Modals/
│   │   └── RequestBodyHistoryModal.tsx  # Body history dropdown
│   └── Toolbar/
│       └── BlockToolbar.tsx       # Top toolbar for adding blocks
├── store/
│   ├── useCanvasStore.ts          # Zustand store for state management
│   └── indexedDB.ts               # IndexedDB persistence utilities
├── types.ts                       # TypeScript type definitions
├── App.tsx                        # Main app component
└── main.tsx                       # Entry point with hydration
```

## Keyboard Shortcuts

- **Delete**: Remove selected blocks or connections
- **Drag**: Move blocks around the canvas
- **Scroll**: Pan the canvas
- **Pinch/Zoom**: Zoom in/out on the canvas

## Examples

### Simple GET Request

1. Add Base URL: `https://jsonplaceholder.typicode.com`
2. Add Resource: `posts`
3. Add GET method
4. Connect: Base URL → posts → GET
5. Click "Send Request"

### POST Request with Body

1. Add Base URL: `https://jsonplaceholder.typicode.com`
2. Add Resource: `posts`
3. Add POST method
4. Connect: Base URL → posts → POST
5. In the Request Panel, add body fields:
   - `title`: `foo`
   - `body`: `bar`
   - `userId`: `1`
6. Click "Send Request"

### Dynamic Parameter Request

1. Add Base URL: `https://jsonplaceholder.typicode.com`
2. Add Resource: `posts`
3. Add Resource: `{postId}` (will turn orange)
4. Add GET method
5. Connect: Base URL → posts → {postId} → GET
6. Enter a value for `postId` when prompted
7. Click "Send Request"

## Features Status

### ✅ Implemented

- [x] Canvas with pan/zoom
- [x] Three block types (BaseURL, Resource, Method)
- [x] Arrow connections
- [x] Path computation and display
- [x] Request execution (all HTTP methods)
- [x] Response display with tabs (Body, Headers, Raw)
- [x] Request history with persistence
- [x] Body history for endpoints
- [x] IndexedDB persistence (auto-save)
- [x] Default starter state
- [x] Erase all functionality
- [x] Parameter support with variable input
- [x] Request/Response panels
- [x] OpenAPI/Swagger import (JSON & YAML)

### 🚧 Future Enhancements

- [ ] Variable extraction from responses
- [ ] Environment switching (Dev/Staging/Prod)
- [ ] Collections/Workspaces
- [ ] Export canvas to JSON
- [ ] Import saved canvases
- [ ] Export as curl/code snippet
- [ ] Response assertions/testing
- [ ] WebSocket support
- [ ] GraphQL support

## Browser Compatibility

Requires a modern browser with:
- IndexedDB support
- ES2020+ JavaScript features
- CSS Grid and Flexbox

Tested on:
- Chrome
- Safari

## License

**CC BY-NC 4.0** (Creative Commons Attribution-NonCommercial 4.0 International)

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License.

You are free to:
- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material

Under the following terms:
- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made
- **NonCommercial** — You may not use the material for commercial purposes

For commercial licensing inquiries, please contact the project maintainer.

Full license: https://creativecommons.org/licenses/by-nc/4.0/

---