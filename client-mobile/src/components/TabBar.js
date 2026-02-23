/**
 * 底部 Tab 导航栏
 * 首页 | 酒店列表 | 订单 | 我的
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TabBar as AdmTabBar } from 'antd-mobile';
import {
  AppOutline,
  UnorderedListOutline,
  TravelOutline,
  UserOutline,
  MessageOutline
} from 'antd-mobile-icons';
import './TabBar.css';

const tabs = [
  { key: '/', title: '首页', icon: <AppOutline /> },
  { key: '/hotels', title: '酒店', icon: <TravelOutline /> },
  { key: '/chat', title: 'AI顾问', icon: <MessageOutline /> },
  { key: '/orders', title: '订单', icon: <UnorderedListOutline /> },
  { key: '/profile', title: '我的', icon: <UserOutline /> }
];

function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const getActiveKey = () => {
    if (pathname.startsWith('/orders')) return '/orders';
    if (pathname.startsWith('/profile')) return '/profile';
    if (pathname === '/hotels' || pathname.startsWith('/hotels/')) return '/hotels';
    if (pathname === '/chat') return '/chat';
    return '/';
  };

  return (
    <AdmTabBar
      className="easystay-tabbar"
      activeKey={getActiveKey()}
      onChange={(key) => navigate(key)}
    >
      {tabs.map((item) => (
        <AdmTabBar.Item key={item.key} icon={item.icon} title={item.title} />
      ))}
    </AdmTabBar>
  );
}

export default TabBar;
