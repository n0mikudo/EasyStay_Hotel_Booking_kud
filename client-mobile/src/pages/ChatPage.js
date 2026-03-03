import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Input, Button, DotLoading, Toast, Switch } from 'antd-mobile';
import { SendOutline, AddOutline, UnorderedListOutline } from 'antd-mobile-icons';
import { useClientAuth } from '../contexts/ClientAuthContext';
import { chatSessionService, getApiBaseUrl } from '../services/api';
import LoginSheet from '../components/LoginSheet';
import ChatHistoryDrawer from '../components/ChatHistoryDrawer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './ChatPage.css';

const QUICK_QUESTIONS = [
  '北京有什么好酒店推荐？',
  '三亚500元以下海景酒店',
  '上海商务出差住哪里好？',
  '带孩子去厦门住哪个区方便？',
  '有没有带温泉的度假酒店？'
];

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: '您好！我是小宿，您的 AI 酒店顾问。\n\n我可以帮您：\n• 按城市、价格、星级搜索酒店\n• 推荐适合您需求的酒店\n• 提供旅游城市住宿建议\n• 解答预订相关问题\n\n请告诉我您的需求，比如"帮我找北京300元以内的酒店"~'
};

const WAIT_MESSAGES = [
  { delay: 0, text: '小宿正在为您查询...' },
  { delay: 5000, text: '正在整理信息，请稍候~' },
  { delay: 12000, text: '深度分析需要一点时间，马上就好...' },
];

function ChatPage() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useClientAuth();

  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [deepMode, setDeepMode] = useState(false);

  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const waitTimersRef = useRef([]);
  const firstTokenRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load sessions when user logs in
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadSessions();
      loadLastSession();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user?.id]);

  const loadSessions = async () => {
    if (!user?.id) return;
    try {
      const res = await chatSessionService.getSessions(user.id);
      if (res.data?.success) {
        setSessions(res.data.data || []);
      }
    } catch (e) {
      console.error('加载会话列表失败:', e);
    }
  };

  const loadLastSession = async () => {
    if (!user?.id) return;
    try {
      const res = await chatSessionService.getSessions(user.id);
      const list = res.data?.data || [];
      if (list.length > 0) {
        await loadSession(list[0].id);
      }
    } catch (e) {}
  };

  const loadSession = async (sid) => {
    try {
      const res = await chatSessionService.getSession(sid);
      if (res.data?.success) {
        const sess = res.data.data;
        setSessionId(sess.id);
        setDeepMode(sess.mode === 'deep');
        if (sess.messages && sess.messages.length > 0) {
          setMessages([WELCOME_MESSAGE, ...sess.messages.map(m => ({
            role: m.role,
            content: m.content,
            streaming: false,
          }))]);
        } else {
          setMessages([WELCOME_MESSAGE]);
        }
      }
    } catch (e) {
      console.error('加载会话失败:', e);
    }
  };

  const handleNewChat = async () => {
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }
    try {
      const mode = deepMode ? 'deep' : 'fast';
      const res = await chatSessionService.createSession(user.id, mode);
      if (res.data?.success) {
        setSessionId(res.data.data.id);
        setMessages([WELCOME_MESSAGE]);
        await loadSessions();
      }
    } catch (e) {
      Toast.show({ content: '创建对话失败', position: 'top' });
    }
  };

  const handleSelectSession = async (sid) => {
    await loadSession(sid);
    await loadSessions();
  };

  const handleDeleteSession = async (sid) => {
    try {
      await chatSessionService.deleteSession(sid);
      if (sid === sessionId) {
        setSessionId(null);
        setMessages([WELCOME_MESSAGE]);
      }
      await loadSessions();
    } catch (e) {
      Toast.show({ content: '删除失败', position: 'top' });
    }
  };

  const handleRenameSession = async (sid, newTitle) => {
    try {
      await chatSessionService.renameSession(sid, newTitle);
      await loadSessions();
    } catch (e) {
      Toast.show({ content: '重命名失败', position: 'top' });
    }
  };

  const clearWaitTimers = () => {
    waitTimersRef.current.forEach(t => clearTimeout(t));
    waitTimersRef.current = [];
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }

    // Auto-create session if needed
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      try {
        const mode = deepMode ? 'deep' : 'fast';
        const res = await chatSessionService.createSession(user.id, mode);
        if (res.data?.success) {
          currentSessionId = res.data.data.id;
          setSessionId(currentSessionId);
        }
      } catch (e) {}
    }

    const userMsg = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    firstTokenRef.current = false;

    // Show waiting message with progressive hints
    const assistantMsg = { role: 'assistant', content: '', streaming: true, waitText: WAIT_MESSAGES[0].text };
    setMessages(prev => [...prev, assistantMsg]);

    clearWaitTimers();
    const timers = WAIT_MESSAGES.slice(1).map(wm => {
      const applicableInFast = wm.delay <= 8000;
      if (!deepMode && !applicableInFast) return null;
      return setTimeout(() => {
        if (!firstTokenRef.current) {
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.streaming && !last.content) {
              updated[updated.length - 1] = { ...last, waitText: wm.text };
            }
            return updated;
          });
        }
      }, wm.delay);
    }).filter(Boolean);
    waitTimersRef.current = timers;

    try {
      const apiUrl = getApiBaseUrl();
      const mode = deepMode ? 'deep' : 'fast';
      const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          mode,
          session_id: currentSessionId,
          user_id: user?.id,
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `请求失败 (${response.status})`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/event-stream')) {
        const jsonErr = await response.json().catch(() => null);
        throw new Error(jsonErr?.msg || jsonErr?.message || 'AI 服务返回了非预期的响应格式');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';
      let hasError = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
            continue;
          }
          if (!line.startsWith('data:')) continue;
          const dataStr = line.slice(5).trim();
          if (!dataStr || dataStr === '[DONE]') { currentEvent = ''; continue; }

          try {
            const data = JSON.parse(dataStr);

            if (currentEvent === 'error' || data.event === 'error') {
              hasError = true;
              fullContent = typeof data.data === 'string' ? data.data : 'AI 服务暂时不可用';
            }

            if (currentEvent === 'conversation.message.delta'
                && data.type === 'answer' && data.content) {
              if (!firstTokenRef.current) {
                firstTokenRef.current = true;
                clearWaitTimers();
              }
              fullContent += data.content;
              const nextContent = fullContent;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: nextContent, streaming: true };
                return updated;
              });
            }

            if (currentEvent === 'conversation.message.completed'
                && data.type === 'answer' && data.content) {
              fullContent = data.content;
            }
          } catch (e) {}
          currentEvent = '';
        }
      }

      clearWaitTimers();
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: fullContent || '抱歉，AI 助手暂时无法响应，请稍后重试。',
          streaming: false,
          error: hasError || !fullContent
        };
        return updated;
      });

      loadSessions();
    } catch (err) {
      console.error('Chat error:', err);
      clearWaitTimers();
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: '抱歉，当前咨询人数较多，请稍后再试。\n\n您也可以直接使用首页的搜索功能查找酒店。',
          streaming: false,
          error: true
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => sendMessage(input);
  const handleQuickQuestion = (q) => sendMessage(q);

  const handleHotelClick = (hotelId) => {
    navigate(`/hotels/${hotelId}`);
  };

  const parseHotelTags = (content) => {
    const parts = [];
    const regex = /\[\[hotel:([^\]|]+)\|([^\]]+)\]\]/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index)
        });
      }
      
      parts.push({
        type: 'hotel',
        id: match[1].trim(),
        name: match[2].trim()
      });
      
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content }];
  };

  const renderContent = (content, waitText) => {
    if (!content && waitText) {
      return (
        <div className="msg-text msg-wait-text">
          <DotLoading color="primary" />
          <span>{waitText}</span>
        </div>
      );
    }
    if (!content) return <DotLoading color="primary" />;

    const parts = parseHotelTags(content);

    return (
      <div className="msg-text markdown-body">
        {parts.map((part, idx) => {
          if (part.type === 'hotel') {
            return (
              <span
                key={idx}
                className="hotel-link"
                role="button"
                tabIndex={0}
                onClick={() => handleHotelClick(part.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleHotelClick(part.id);
                  }
                }}
              >
                {part.name} →
              </span>
            );
          }
          
          return (
            <ReactMarkdown
              key={idx}
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {children}
                  </a>
                )
              }}
            >
              {part.content}
            </ReactMarkdown>
          );
        })}
      </div>
    );
  };

  const showQuickQuestions = messages.length === 1 ||
    (messages.length === 1 && messages[0] === WELCOME_MESSAGE);

  return (
    <div className="chat-page">
      <NavBar
        className="chat-nav"
        backArrow={false}
        left={
          <div className="nav-left-btn" onClick={() => {
            if (!isLoggedIn) { setShowLogin(true); return; }
            setShowDrawer(true);
          }}>
            <UnorderedListOutline />
          </div>
        }
        right={
          <div className="nav-right-btn" onClick={handleNewChat}>
            <AddOutline />
          </div>
        }
      >
        AI 酒店顾问
      </NavBar>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble-row ${msg.role}`}>
            {msg.role === 'assistant' && (
              <div className="avatar avatar-ai">宿</div>
            )}
            <div className={`chat-bubble ${msg.role} ${msg.error ? 'error' : ''}`}>
              {renderContent(msg.content, msg.waitText)}
            </div>
          </div>
        ))}

        {showQuickQuestions && (
          <div className="quick-questions">
            <div className="quick-label">试试这些问题：</div>
            <div className="quick-list">
              {QUICK_QUESTIONS.map((q, i) => (
                <div key={i} className="quick-item" onClick={() => handleQuickQuestion(q)}>
                  {q}
                </div>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-bar">
        <div className="mode-switch-wrapper">
          <Switch
            checked={deepMode}
            onChange={setDeepMode}
            style={{
              '--checked-color': '#6D28D9',
              '--width': '32px',
              '--height': '20px',
            }}
          />
          <span className={`mode-label ${deepMode ? 'active' : ''}`}>
            {deepMode ? '深度' : '极速'}
          </span>
        </div>
        <Input
          ref={inputRef}
          className="chat-input"
          placeholder="输入您的问题..."
          value={input}
          onChange={setInput}
          onEnterPress={handleSend}
          disabled={loading}
        />
        <Button
          className="send-btn"
          color="primary"
          size="small"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          loading={loading}
        >
          <SendOutline />
        </Button>
      </div>

      <ChatHistoryDrawer
        visible={showDrawer}
        onClose={() => setShowDrawer(false)}
        sessions={sessions}
        activeSessionId={sessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
      />

      <LoginSheet
        visible={showLogin}
        onClose={() => {
          setShowLogin(false);
          loadSessions();
        }}
      />
    </div>
  );
}

export default ChatPage;
