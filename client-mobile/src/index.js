import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

// 初始化深色模式
try {
  const theme = localStorage.getItem('easystay_theme');
  const dark = theme === 'dark' || (theme === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
} catch {
  document.documentElement.setAttribute('data-theme', 'light');
}

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('React ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
          <h2 style={{ color: '#333', marginBottom: 12 }}>页面出了点问题</h2>
          <p style={{ color: '#666', marginBottom: 20 }}>请尝试刷新页面</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 28px', fontSize: 16, border: 'none', borderRadius: 8,
              background: '#1677ff', color: '#fff', cursor: 'pointer'
            }}
          >
            刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename="/mobile">
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
