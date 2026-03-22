import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { queryClient } from './lib/queryClient'
import './index.css'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', background: '#0f172a', color: '#f8fafc', minHeight: '100vh' }}>
          <h2 style={{ color: '#f43f5e', marginBottom: 16 }}>⚠ Runtime Error</h2>
          <pre style={{ color: '#fbbf24', whiteSpace: 'pre-wrap', marginBottom: 16 }}>{err.message}</pre>
          <pre style={{ color: '#94a3b8', fontSize: 12, whiteSpace: 'pre-wrap' }}>{err.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#1e293b',
              },
            },
            error: {
              iconTheme: {
                primary: '#f43f5e',
                secondary: '#1e293b',
              },
            },
          }}
        />
      </QueryClientProvider>
    </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
