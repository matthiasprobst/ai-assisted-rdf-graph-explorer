# AI-Assisted RDF Graph Explorer - Agent Guidelines

This document provides comprehensive guidelines for agentic coding agents working on the RDF Graph Explorer codebase.

## Project Overview

This is a React + TypeScript application for visualizing and exploring RDF (Resource Description Framework) data graphs. The application uses:
- **React 19.2.3** with TypeScript
- **Vite** for development and building
- **Tailwind CSS** for styling (via CDN)
- **D3.js** for graph visualization (via ESM import)
- **N3** for RDF/Turtle parsing
- **Google Gemini AI** for chat assistance

## Build and Development Commands

### Core Commands
```bash
npm install           # Install dependencies
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm run preview      # Preview production build
```

### Environment Setup
- Copy `.env.local` and set `GEMINI_API_KEY` to your Gemini API key
- The development server runs on port 3000 with host `0.0.0.0`

## Code Style Guidelines

### TypeScript Configuration
- Target: ES2022 with bundler module resolution
- Strict type checking enabled
- React JSX transform (`react-jsx`)
- Path alias: `@/*` maps to project root

### Import Style
```typescript
// External imports first, grouped by type
import React, { useState, useCallback } from 'react';
import { marked } from 'marked';
import { GoogleGenAI } from "@google/genai";

// Internal imports with @ alias
import { GraphData, RDFNode } from '@/types';
import GraphVisualizer from '@/components/GraphVisualizer';
import { parseTurtle } from '@/services/rdfParser';
```

### Component Structure
- Use functional components with React.FC type annotation
- Props interfaces defined above component when used
- Destructure props in function signature
- Use explicit return types for complex functions

```typescript
interface Props {
  data: GraphData;
  onNodeSelect: (node: RDFNode | null) => void;
  selectedNodeId?: string | null;
}

const Component: React.FC<Props> = ({ data, onNodeSelect, selectedNodeId }) => {
  // Component logic
};
```

### State Management
- Prefer `useState` for local state
- Use `useCallback` for event handlers to prevent unnecessary re-renders
- Use `useRef` for DOM elements and mutable values that don't trigger re-renders
- Group related state declarations together

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [selectedNode, setSelectedNode] = useState<RDFNode | null>(null);
```

### Error Handling
- Always handle async errors with try-catch blocks
- Set error state with descriptive messages
- Use type assertions (`err: any`) only when necessary
- Provide fallback UI for error states

```typescript
try {
  const data = await parseTurtle(input);
  if (data.nodes.length === 0) throw new Error("No valid RDF nodes found.");
  setFullGraphData(data);
} catch (err: any) {
  setError(err.message || 'Parsing failed');
} finally {
  setLoading(false);
}
```

### Naming Conventions
- **Components**: PascalCase with descriptive names (`GraphVisualizer`, `RDFParser`)
- **Variables**: camelCase, descriptive names (`selectedNode`, `fullGraphData`)
- **Constants**: UPPER_SNAKE_CASE for true constants (`INITIAL_TURTLE`, `DEFAULT_PROMPT`)
- **Functions**: camelCase with verb-first naming (`handleParse`, `parseTurtle`)
- **Types/Interfaces**: PascalCase with clear purpose (`GraphData`, `RDFNode`)

### Tailwind CSS Guidelines
- Use utility classes for all styling
- Preface with responsive prefixes when needed
- Use semantic color palette: slate for neutrals, indigo for primary, blue for secondary
- Maintain consistent sizing and spacing patterns
- Custom utility classes can be defined in index.html

```typescript
// Good examples
className="w-full h-full bg-slate-50 flex flex-col overflow-hidden"
className="px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-tight"
```

### D3.js Integration
- Use D3 via ESM import: `import * as d3 from 'https://esm.sh/d3@7.8.5'`
- Use refs for SVG container elements
- Handle simulation lifecycle carefully to avoid memory leaks
- Filter invalid links before rendering
- Use proper TypeScript typing for D3 objects

### API Integration
- Use environment variables for API keys via Vite's define config
- Handle loading and error states for all API calls
- Cache responses when appropriate
- Use proper error boundaries

## File Organization

```
src/
├── components/        # React components
│   └── GraphVisualizer.tsx
├── services/         # Business logic and API services
│   ├── rdfParser.ts
│   └── geminiService.ts (deprecated)
├── types.ts          # TypeScript type definitions
├── App.tsx          # Main application component
└── index.tsx        # Application entry point
```

## Testing Guidelines

**Note**: This project currently has no test framework configured. When adding tests:
- Choose appropriate framework (Vitest recommended for Vite projects)
- Configure test environment for React components
- Mock external dependencies (D3, N3, Gemini API)
- Test component behavior, not implementation details

## Performance Considerations

- Use React.memo for components that re-render frequently
- Implement virtualization for large lists
- Optimize D3 simulations with appropriate force configurations
- Use CSS transforms for animations over position changes
- Debounce expensive operations

## Security Guidelines

- Never commit API keys or secrets
- Sanitize user inputs before processing
- Use proper content security policies
- Validate RDF data before parsing
- Implement proper error boundaries

## Common Patterns

### Async Data Loading
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleAction = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const result = await someAsyncOperation();
    // Handle success
  } catch (err: any) {
    setError(err.message || 'Operation failed');
  } finally {
    setLoading(false);
  }
}, [dependencies]);
```

### Component Cleanup
```typescript
useEffect(() => {
  // Setup logic
  
  return () => {
    // Cleanup logic (remove listeners, cancel requests)
  };
}, [dependencies]);
```

### Conditional Rendering
```typescript
return (
  <div className="container">
    {loading && <LoadingSpinner />}
    {error && <ErrorMessage message={error} />}
    {!loading && !error && data && <DataComponent data={data} />}
    {!loading && !error && !data && <EmptyState />}
  </div>
);
```

## Development Notes

- The project uses ESM imports for D3 and N3 libraries via CDN
- Tailwind CSS is loaded via CDN with typography plugin
- Custom styling is defined in index.html head section
- The app uses strict React mode for development
- Environment variables are injected via Vite's define config

## Before Submitting Changes

1. Run `npm run build` to ensure no TypeScript errors
2. Test the application manually in development mode
3. Check that all async operations have proper error handling
4. Ensure responsive design works across different screen sizes
5. Verify accessibility considerations (ARIA labels, keyboard navigation)