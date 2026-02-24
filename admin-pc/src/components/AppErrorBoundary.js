import React from 'react';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Admin ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <h2 style={{ marginBottom: 12 }}>页面出现异常</h2>
            <p style={{ color: '#666', marginBottom: 20 }}>请刷新页面后重试，或重新登录。</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px',
                border: 0,
                borderRadius: 8,
                cursor: 'pointer',
                background: '#4f46e5',
                color: '#fff'
              }}
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default AppErrorBoundary;
