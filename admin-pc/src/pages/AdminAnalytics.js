/**
 * 管理员数据分析报表页面
 *
 * 功能：
 * 1. 展示酒店数据统计
 * 2. ECharts 数据可视化（饼图、柱状图、折线图）
 * 3. 审核趋势分析
 *
 * @component
 */

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Button, message } from 'antd';
import { BarChartOutlined, PieChartOutlined, LineChartOutlined, DownloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { statsService, hotelService } from '../services/api';

function AdminAnalytics() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    avgPrice: 0,
    cities: 0
  });
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [statsRes, hotelsRes] = await Promise.all([
        statsService.getStats(),
        hotelService.getHotels()
      ]);
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (hotelsRes.data.success) {
        setHotels(hotelsRes.data.data || []);
      }
    } catch (error) {
      message.error('加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const pieOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    color: ['#1890ff', '#52c41a', '#fa8c16', '#f5222d'],
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8 },
      label: { show: true, formatter: '{b}: {c}家' },
      data: [
        { value: stats.pending, name: '待审核' },
        { value: stats.approved, name: '已通过' },
        { value: stats.rejected, name: '已拒绝' },
        { value: (stats.total || 0) - stats.pending - stats.approved - stats.rejected, name: '已下线' }
      ].filter(d => d.value > 0)
    }]
  };

  const priceRanges = [
    { min: 0, max: 200, name: '¥200以下', count: 0 },
    { min: 200, max: 500, name: '¥200-500', count: 0 },
    { min: 500, max: 1000, name: '¥500-1000', count: 0 },
    { min: 1000, max: Infinity, name: '¥1000+', count: 0 }
  ];
  hotels.forEach(h => {
    const p = h.price || 0;
    const r = priceRanges.find(x => p >= x.min && p < x.max);
    if (r) r.count++;
  });

  const barOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: priceRanges.map(r => r.name) },
    yAxis: { type: 'value', name: '酒店数' },
    series: [{
      type: 'bar',
      data: priceRanges.map(r => r.count),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#6366F1' },
            { offset: 1, color: '#8B5CF6' }
          ]
        }
      }
    }]
  };

  const cityCount = {};
  hotels.forEach(h => {
    const c = h.city || '未知';
    cityCount[c] = (cityCount[c] || 0) + 1;
  });
  const cityData = Object.entries(cityCount).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const lineOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: cityData.map(([c]) => c) },
    yAxis: { type: 'value', name: '酒店数' },
    series: [{
      type: 'line',
      data: cityData.map(([, n]) => n),
      smooth: true,
      areaStyle: { opacity: 0.3 },
      lineStyle: { width: 2 },
      itemStyle: { color: '#6366F1' }
    }]
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      // 获取统计数据
      const response = await statsService.getStats();
      if (response.data.success) {
        const stats = response.data.data;
        
        // 生成CSV内容
        const csvContent = `数据类型,数值\n` +
          `酒店总数,${stats.total}\n` +
          `待审核,${stats.pending}\n` +
          `已通过,${stats.approved}\n` +
          `已拒绝,${stats.rejected}\n` +
          `平均价格,${stats.avgPrice}\n` +
          `覆盖城市,${stats.cities}\n`;
        
        // 创建Blob对象
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // 创建下载链接
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `酒店统计报表_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        message.success('报表下载成功');
      }
    } catch (error) {
      message.error('报表下载失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analytics">
      <div className="page-header">
        <h1 className="page-title">数据分析报表</h1>
        <p className="page-subtitle">平台运营数据统计与分析</p>
      </div>

      {/* 核心指标卡片 */}
      <Row gutter={[24, 24]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} className="stat-card fade-in">
            <Statistic
              title="酒店总数"
              value={stats.total}
              prefix={<BarChartOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
              suffix={<span style={{ fontSize: '12px', color: '#8c8c8c' }}>家</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} className="stat-card fade-in">
            <Statistic
              title="待审核"
              value={stats.pending}
              prefix={<BarChartOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
              suffix={<span style={{ fontSize: '12px', color: '#8c8c8c' }}>家</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} className="stat-card fade-in">
            <Statistic
              title="已通过"
              value={stats.approved}
              prefix={<BarChartOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
              suffix={<span style={{ fontSize: '12px', color: '#8c8c8c' }}>家</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} className="stat-card fade-in">
            <Statistic
              title="已拒绝"
              value={stats.rejected}
              prefix={<BarChartOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
              suffix={<span style={{ fontSize: '12px', color: '#8c8c8c' }}>家</span>}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据概览 - ECharts */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="酒店状态分布" className="content-card fade-in">
            <ReactECharts option={pieOption} style={{ height: 280 }} notMerge />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="价格区间分布" className="content-card fade-in">
            <ReactECharts option={barOption} style={{ height: 280 }} notMerge />
            <div style={{ marginTop: 12, fontSize: 13, color: '#8c8c8c' }}>
              平均价格：¥{stats.avgPrice} · 覆盖城市：{stats.cities} 个
            </div>
          </Card>
        </Col>
      </Row>

      {/* 城市分布 */}
      <Card title="城市分布 TOP8" className="content-card fade-in">
        <ReactECharts option={lineOption} style={{ height: 280 }} notMerge />
      </Card>

      {/* 操作按钮 */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
        >
          下载报表
        </Button>
      </div>
    </div>
  );
}

export default AdminAnalytics;