import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import AppErrorBoundary from './components/AppErrorBoundary';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#4f46e5',
          borderRadius: 10,
          colorBgLayout: '#f5f7fb',
          colorBgContainer: '#ffffff',
          colorText: '#1f2937',
        },
        components: {
          Layout: { headerBg: '#ffffff', bodyBg: '#f5f7fb', siderBg: '#0f172a' },
          Menu: { itemBorderRadius: 10, itemSelectedBg: '#312e81', itemSelectedColor: '#ffffff' },
          Button: { borderRadius: 10, controlHeight: 36 },
          Card: { borderRadiusLG: 14 },
        },
      }}
    >
      <AppErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppErrorBoundary>
    </ConfigProvider>
  </React.StrictMode>
);
