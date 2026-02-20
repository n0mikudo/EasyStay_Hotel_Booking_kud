/**
 * 注册入口选择页
 * 用户选择「商户注册」或「管理员注册」，分别跳转到对应表单
 */
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Button } from 'antd';
import { ShopOutlined, SafetyCertificateOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import './RegisterChoicePage.css';

function RegisterChoicePage() {
  const navigate = useNavigate();

  return (
    <div className="register-choice-page">
      <div className="register-choice-container">
        <Card className="register-choice-card">
          <div className="register-choice-header">
            <h1>易宿酒店预订平台</h1>
            <p>选择注册类型</p>
          </div>

          <div className="register-choice-buttons">
            <Button
              type="primary"
              size="large"
              icon={<ShopOutlined />}
              className="choice-btn merchant-btn"
              onClick={() => navigate('/register/merchant')}
            >
              商户注册
            </Button>
            <p className="choice-desc">酒店商家，可录入和管理酒店信息</p>

            <Button
              size="large"
              icon={<SafetyCertificateOutlined />}
              className="choice-btn admin-btn"
              onClick={() => navigate('/register/admin')}
            >
              管理员注册
            </Button>
            <p className="choice-desc">平台管理员，需有效邀请码方可注册</p>
          </div>

          <div className="register-choice-footer">
            <Link to="/login" className="back-link">
              <ArrowLeftOutlined /> 返回登录
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default RegisterChoicePage;
