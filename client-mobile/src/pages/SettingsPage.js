/**
 * 设置页面
 * 通知、缓存、关于、深色模式（含跟随系统）
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, List, Switch, Toast, Dialog } from 'antd-mobile';
import {
  GlobalOutline,
  UnorderedListOutline,
  FileOutline,
  InformationCircleOutline,
  DeleteOutline
} from 'antd-mobile-icons';
import './SettingsPage.css';

const THEME_KEY = 'easystay_theme';

function SettingsPage() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'light';
    } catch {
      return 'light';
    }
  });
  const [notifyEnabled, setNotifyEnabled] = useState(true);

  const applyTheme = (val) => {
    const dark = val === 'dark' || (val === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  };

  useEffect(() => {
    applyTheme(theme);
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (theme === 'auto' && mq) {
      const fn = () => applyTheme('auto');
      mq.addEventListener('change', fn);
      return () => mq.removeEventListener('change', fn);
    }
  }, [theme]);

  const handleThemeChange = (val) => {
    setTheme(val);
    localStorage.setItem(THEME_KEY, val);
    applyTheme(val);
    Toast.show({
      content: val === 'auto' ? '已跟随系统' : val === 'dark' ? '已切换深色模式' : '已切换浅色模式',
      duration: 1500
    });
  };

  const handleClearCache = () => {
    Dialog.confirm({
      content: '清除缓存将清理本地存储的搜索历史等数据，是否继续？',
      onConfirm: () => {
        try {
          const keysToKeep = [THEME_KEY];
          const keys = Object.keys(localStorage);
          keys.forEach(k => {
            if (!keysToKeep.includes(k) && (k.startsWith('easystay_') || k.startsWith('search_'))) {
              localStorage.removeItem(k);
            }
          });
          Toast.show({ content: '缓存已清除', icon: 'success' });
        } catch {
          Toast.show({ content: '清除失败' });
        }
      }
    });
  };

  return (
    <div className="settings-page">
      <NavBar className="settings-nav" onBack={() => navigate(-1)}>
        设置
      </NavBar>

      <div className="settings-content">
        <List header="外观与体验" className="settings-list">
          <List.Item
            prefix={<GlobalOutline />}
            extra={
              <select
                value={theme}
                onChange={(e) => handleThemeChange(e.target.value)}
                className="settings-theme-select"
              >
                <option value="light">浅色</option>
                <option value="dark">深色</option>
                <option value="auto">跟随系统</option>
              </select>
            }
          >
            深色模式
          </List.Item>
        </List>

        <List header="通知" className="settings-list">
          <List.Item
            prefix={<UnorderedListOutline />}
            suffix={
              <Switch
                checked={notifyEnabled}
                onChange={setNotifyEnabled}
                color="var(--color-primary)"
              />
            }
          >
            订单状态提醒
          </List.Item>
        </List>

        <List header="存储" className="settings-list">
          <List.Item
            prefix={<DeleteOutline />}
            onClick={handleClearCache}
            arrow
          >
            清除缓存
          </List.Item>
        </List>

        <List header="关于" className="settings-list">
          <List.Item
            prefix={<InformationCircleOutline />}
            onClick={() => Toast.show({ content: '易宿酒店 v1.0\n专业的酒店预订平台' })}
            arrow
          >
            关于易宿
          </List.Item>
          <List.Item
            prefix={<FileOutline />}
            onClick={() => Toast.show({ content: '隐私政策页面开发中' })}
            arrow
          >
            隐私政策
          </List.Item>
        </List>

        <div className="settings-footer">
          <div className="version-badge">易宿酒店 v1.0</div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
