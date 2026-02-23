import React, { useState } from 'react';
import { Popup, Input, Button, Toast } from 'antd-mobile';
import { useClientAuth } from '../contexts/ClientAuthContext';
import './LoginSheet.css';

function LoginSheet({ visible, onClose }) {
  const { login } = useClientAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const handleSendCode = () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Toast.show({ content: '请输入正确的手机号', position: 'top' });
      return;
    }
    setCodeSent(true);
    Toast.show({ content: '验证码已发送（演示验证码：8888）', position: 'top', duration: 3000 });
  };

  const handleLogin = async () => {
    if (!phone || !code) {
      Toast.show({ content: '请输入手机号和验证码', position: 'top' });
      return;
    }
    setLoading(true);
    try {
      await login(phone, code);
      Toast.show({ content: '登录成功', icon: 'success' });
      onClose?.();
      setPhone('');
      setCode('');
      setCodeSent(false);
    } catch (err) {
      Toast.show({ content: err.message || '登录失败', position: 'top' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      position="bottom"
      bodyClassName="login-sheet-body"
      destroyOnClose
    >
      <div className="login-sheet">
        <div className="login-sheet-header">
          <div className="login-sheet-title">登录易宿</div>
          <div className="login-sheet-subtitle">登录后可保存对话记录</div>
        </div>

        <div className="login-sheet-form">
          <div className="login-field">
            <Input
              className="login-input"
              placeholder="请输入手机号"
              value={phone}
              onChange={setPhone}
              type="tel"
              maxLength={11}
              clearable
            />
          </div>

          <div className="login-field login-code-field">
            <Input
              className="login-input login-code-input"
              placeholder="验证码"
              value={code}
              onChange={setCode}
              type="number"
              maxLength={4}
            />
            <Button
              className="login-code-btn"
              size="small"
              disabled={codeSent || phone.length !== 11}
              onClick={handleSendCode}
            >
              {codeSent ? '已发送' : '获取验证码'}
            </Button>
          </div>

          <Button
            block
            color="primary"
            className="login-submit-btn"
            loading={loading}
            onClick={handleLogin}
            disabled={!phone || !code}
          >
            登录
          </Button>

          <div className="login-hint">演示环境验证码固定为 8888</div>
        </div>
      </div>
    </Popup>
  );
}

export default LoginSheet;
