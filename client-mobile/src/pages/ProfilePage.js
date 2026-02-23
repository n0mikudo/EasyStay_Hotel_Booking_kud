/**
 * 个人中心页面
 * 深色模式切换、关于、设置入口
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, List, Switch, Toast } from 'antd-mobile';
import {
  UserOutline,
  UnorderedListOutline,
  HeartOutline,
  SetOutline,
  GlobalOutline
} from 'antd-mobile-icons';
import { useClientAuth } from '../contexts/ClientAuthContext';
import LoginSheet from '../components/LoginSheet';
import './ProfilePage.css';

const THEME_KEY = 'easystay_theme';

function getEffectiveDark() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === 'dark') return true;
    if (t === 'light') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
  } catch {
    return false;
  }
}

function ProfilePage() {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useClientAuth();
  const [darkMode, setDarkMode] = useState(getEffectiveDark);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem(THEME_KEY);
    const dark = (t === 'dark' || (t === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches)) ?? false;
    setDarkMode(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const fn = () => {
      const t = localStorage.getItem(THEME_KEY);
      if (t === 'auto') {
        const d = mq.matches;
        setDarkMode(d);
        document.documentElement.setAttribute('data-theme', d ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  const handleThemeToggle = (checked) => {
    setDarkMode(checked);
    localStorage.setItem(THEME_KEY, checked ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', checked ? 'dark' : 'light');
    Toast.show({
      content: checked ? '已切换深色模式' : '已切换浅色模式',
      duration: 1500
    });
  };

  return (
    <div className="profile-page">
      <NavBar className="profile-nav" back={null}>
        <span className="nav-title">我的</span>
      </NavBar>

      <div className="profile-header" onClick={() => !isLoggedIn && setShowLogin(true)}>
        <div className="profile-avatar">
          {isLoggedIn ? (
            <span className="profile-avatar-text">{user?.nickname?.charAt(0) || '用'}</span>
          ) : (
            <UserOutline />
          )}
        </div>
        <div className="profile-name">{isLoggedIn ? user?.nickname : '点击登录'}</div>
        <div className="profile-desc">
          {isLoggedIn
            ? `${user?.phone?.slice(0, 3)}****${user?.phone?.slice(7)}`
            : '登录后可保存对话记录'}
        </div>
      </div>

      <div className="profile-menu">
        <List>
          <List.Item
            prefix={<UnorderedListOutline />}
            onClick={() => navigate('/orders')}
            arrow
          >
            我的订单
          </List.Item>
          <List.Item
            prefix={<HeartOutline />}
            onClick={() => navigate('/favorites')}
            arrow
          >
            我的收藏
          </List.Item>
          <List.Item
            prefix={<GlobalOutline />}
            suffix={<Switch checked={darkMode} color="var(--color-primary)" />}
            onClick={() => handleThemeToggle(!darkMode)}
          >
            深色模式
          </List.Item>
          <List.Item
            prefix={<SetOutline />}
            onClick={() => navigate('/profile/settings')}
            arrow
          >
            设置
          </List.Item>
          {isLoggedIn && (
            <List.Item
              onClick={() => {
                logout();
                Toast.show({ content: '已退出登录', duration: 1500 });
              }}
              arrow={false}
              style={{ textAlign: 'center' }}
            >
              <span style={{ color: 'var(--color-error)' }}>退出登录</span>
            </List.Item>
          )}
        </List>
      </div>

      <div className="profile-footer">
        <div className="version">易宿酒店 v1.0</div>
      </div>

      <LoginSheet visible={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}

export default ProfilePage;
