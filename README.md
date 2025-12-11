# TLDFetch - Visual API Client

A canvas-based API testing tool where you create visual flows using blocks and arrows to construct and execute API requests. Think tldraw meets Postman, but more intuitive and visual.

## Features

- **Visual Block System**: Create API requests by dragging and connecting blocks
- **Three Block Types**:
  - **Base URL Block** (blue): Your API's base URL (e.g., `https://api.example.com`)
  - **Resource Block** (pink): API endpoints and path segments (e.g., `users`, `posts`)
  - **Method Block** (color-coded): HTTP methods (GET, POST, PUT, DELETE, PATCH)
- **Arrow Connections**: Connect blocks to build your API path
- **Live URL Preview**: See your constructed URL in real-time (bottom-left)
- **Request Panel**: Configure headers and request body (right panel)
- **Response Viewer**: View response data with tabs for body, headers, and raw data (bottom-right)
- **Parameter Support**: Use `{variableName}` in resource blocks for dynamic parameters

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

### 1. Create Blocks

Use the toolbar on the left to add blocks to the canvas:
- Click "Base URL" to add a base URL block
- Click "Resource" to add a resource/endpoint block
- Click a method (GET, POST, etc.) to add a method block

### 2. Connect Blocks with Arrows

- Click and drag from a block's connection point (the circular handles)
- Release on another block to create a connection
- The path flows from Base URL → Resources → Method

Example flow:
```
[Base URL: https://api.github.com] → [Resource: users] → [Resource: octocat] → [GET]
```

This creates the URL: `https://api.github.com/users/octocat`

### 3. Edit Block Values

- Double-click any block to edit its value
- For Base URL: Enter the full base URL with protocol
- For Resources: Enter the path segment (or use `{param}` for dynamic values)
- Methods are fixed and cannot be edited

### 4. Using Parameters

To create dynamic URLs with parameters:
1. Create a resource block
2. Double-click to edit it
3. Enter a value with curly braces: `{userId}`
4. The block will change color to orange, indicating it's a parameter

### 5. Send Requests

Once you have a valid path (Base URL → Resources → Method):
1. The Active URL display (bottom-left) will show your constructed URL
2. A Request Panel will appear on the right
3. Configure headers if needed (default: `Content-Type: application/json`)
4. Add a request body for POST/PUT/PATCH requests
5. Click "Send Request"
6. View the response in the bottom-right panel

### 6. View Responses

The Response Modal shows:
- Status code (color-coded: green=success, red=error)
- Response time in milliseconds
- Response size
- Three tabs:
  - **Body**: Formatted JSON
  - **Headers**: Response headers as key-value pairs
  - **Raw**: Raw response text

## Tech Stack

- **React** + **TypeScript**: UI framework
- **React Flow**: Canvas and node-based graph system
- **Zustand**: State management
- **Tailwind CSS**: Styling
- **Axios**: HTTP client
- **Vite**: Build tool

## Project Structure

```
src/
├── components/
│   ├── Blocks/
│   │   ├── BaseUrlBlock.tsx    # Blue base URL block
│   │   ├── ResourceBlock.tsx   # Pink resource/parameter block
│   │   └── MethodBlock.tsx     # Color-coded HTTP method block
│   ├── Canvas/
│   │   └── Canvas.tsx          # Main React Flow canvas
│   ├── Panels/
│   │   ├── ActiveUrlDisplay.tsx    # Bottom-left URL display
│   │   ├── RequestPanel.tsx        # Right-side request config
│   │   └── ResponseModal.tsx       # Bottom-right response viewer
│   └── Toolbar/
│       └── BlockToolbar.tsx    # Left toolbar for adding blocks
├── store/
│   └── useCanvasStore.ts       # Zustand store for state management
├── types.ts                    # TypeScript type definitions
└── App.tsx                     # Main app component
```

## Keyboard Shortcuts

- **Delete**: Remove selected blocks or connections
- **Drag**: Move blocks around the canvas
- **Scroll**: Pan the canvas
- **Pinch/Zoom**: Zoom in/out on the canvas

## Examples

### Simple GET Request

1. Add Base URL block: `https://jsonplaceholder.typicode.com`
2. Add Resource block: `posts`
3. Add GET block
4. Connect: Base URL → posts → GET
5. Click "Send Request"

### POST Request with Body

1. Add Base URL block: `https://jsonplaceholder.typicode.com`
2. Add Resource block: `posts`
3. Add POST block
4. Connect: Base URL → posts → POST
5. In the Request Panel, add body:
```json
{
  "title": "foo",
  "body": "bar",
  "userId": 1
}
```
6. Click "Send Request"

### Dynamic Parameter Request

1. Add Base URL block: `https://jsonplaceholder.typicode.com`
2. Add Resource block: `posts`
3. Add Resource block: `{postId}` (will turn orange)
4. Add GET block
5. Connect: Base URL → posts → {postId} → GET
6. Click "Send Request"

## Roadmap

See the TODO.md file for the complete roadmap and planned features.

### MVP Status (Complete!)

- [x] Canvas with pan/zoom
- [x] Three block types (BaseURL, Resource, Method)
- [x] Arrow connections
- [x] Path computation and display
- [x] Request execution (all HTTP methods)
- [x] Response display with tabs

### Future Enhancements

- [ ] Variable extraction from responses
- [ ] Environment switching (Dev/Staging/Prod)
- [ ] Collections/Workspaces
- [ ] Request history
- [ ] Save/Load canvas to JSON
- [ ] Export as curl/code snippet
- [ ] Response assertions/testing
- [ ] Auth block (JWT, Bearer tokens)

## License

MIT
