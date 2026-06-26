Unexpected Application Error!
s.isAdmin is not a function
TypeError: s.isAdmin is not a function
    at http://localhost:5173/src/ProtectedRoute.jsx:9:40
    at http://localhost:5173/node_modules/.vite/deps/zustand.js?v=4ffeba45:36:96
    at mountSyncExternalStore (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=2cf85ec9:4515:20)
    at Object.useSyncExternalStore (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=2cf85ec9:13071:12)
    at exports.useSyncExternalStore (http://localhost:5173/node_modules/.vite/deps/react.js?v=fd275779:751:31)
    at useStore (http://localhost:5173/node_modules/.vite/deps/zustand.js?v=4ffeba45:36:29)
    at useBoundStore (http://localhost:5173/node_modules/.vite/deps/zustand.js?v=4ffeba45:42:38)
    at ProtectedRoute (http://localhost:5173/src/ProtectedRoute.jsx:9:18)
    at Object.react_stack_bottom_frame (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=2cf85ec9:12866:12)
    at renderWithHooks (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=2cf85ec9:4213:19)
💿 Hey developer 👋

You can provide a way better UX than this when your app throws errors by providing your own ErrorBoundary or errorElement prop on your route.