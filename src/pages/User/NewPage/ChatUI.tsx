import React, { useState, useRef, useEffect } from 'react';
import { Layout, Input, Button, Switch, Card } from 'antd';
import { SendOutlined } from '@ant-design/icons';

const ChatUI: React.FC = () => {
  const [chatHistory, setChatHistory] = useState<{ sender: string; message: string }[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isRagOnly, setIsRagOnly] = useState<boolean>(true);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  const sendMessage = () => {
    if (inputMessage.trim()) {
      setChatHistory([...chatHistory, { sender: 'User', message: inputMessage }]);
      setInputMessage('');

      setTimeout(() => {
        const ragAnswer = '这是根据 RAG 知识库的回答。';
        const contextAnswer = '这是根据上下文的回答。';
        const aiResponse = isRagOnly
          ? [{ sender: 'GPT', message: ragAnswer }]
          : [
              { sender: 'GPT', message: ragAnswer },
              { sender: 'GPT', message: contextAnswer },
            ];
        setChatHistory((prev) => [...prev, ...aiResponse]);
      }, 1000);
    }
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <Layout>
      <div style={{ marginBottom: '16px', textAlign: 'right' }}>
        <Switch
          checked={isRagOnly}
          onChange={setIsRagOnly}
          checkedChildren="RAG 模式"
          unCheckedChildren="混合模式"
        />
      </div>
      <div
        ref={chatBoxRef}
        style={{
          flex: 1,
          backgroundColor: '#ffffff',
          border: '1px solid #d9d9d9',
          borderRadius: '8px',
          padding: '16px',
          overflowY: 'auto',
          height: '400px',
        }}
      >
        {chatHistory.map((chat, index) => (
          <div
            key={index}
            style={{
              alignSelf: chat.sender === 'User' ? 'flex-end' : 'flex-start',
              marginBottom: '12px',
              maxWidth: '70%',
            }}
          >
            <Card
              style={{
                backgroundColor: chat.sender === 'User' ? '#e6f7ff' : '#f6ffed',
                borderRadius: '12px',
                border: 'none',
              }}
            >
              <strong>{chat.sender === 'User' ? '你' : 'GPT'}</strong>
              <p>{chat.message}</p>
            </Card>
          </div>
        ))}
      </div>
      <Input
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onPressEnter={sendMessage}
        placeholder="请输入消息..."
        addonAfter={
          <Button type="primary" icon={<SendOutlined />} onClick={sendMessage}>
            发送
          </Button>
        }
      />
    </Layout>
  );
};

export default ChatUI;
