import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Input, Space, theme, Typography } from 'antd';
import React, { useState } from 'react';

const Chat: React.FC = () => {
  const { token } = theme.useToken();
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { text: '你好，请问有什么问题？', key: 1, isReply: true },
  ]);

  const handleSend = () => {
    if (inputText.trim()) {
      const newChatHistory = [
        ...chatHistory,
        { text: inputText, key: chatHistory.length + 1, isReply: false },
      ];

      // 如果是第一次发送消息，添加机器人的初始回复
      if (chatHistory.length === 1) {
        newChatHistory.push({
          text: '这是固定回复',
          key: chatHistory.length + 2,
          isReply: true,
        });
      }

      setChatHistory(newChatHistory);
      setInputText('');
    }
  };

  return (
    <PageContainer>
      <Card
        style={{
          borderRadius: 8,
          minHeight: '480px',
        }}
        bodyStyle={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between', // 确保内容分布在顶部、中间和底部
        }}
      >
        <div
          style={{
            fontSize: '20px',
            color: token.colorTextHeading,
          }}
        >
          Title
        </div>
        <div
          style={{
            flexGrow: 1, // 让对话记录区域占据剩余空间
            overflowY: 'auto', // 添加滚动条以处理溢出内容
            padding: '16px', // 添加一些内边距
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '300px', // 设置最大高度以确保内容溢出时显示滚动条
          }}
        >
          {/* 对话记录内容 */}
          {chatHistory.map((chat) => {
            return (
              <div
                className="chat-bubble"
                key={chat.key}
                style={{
                  alignSelf: chat.isReply ? 'flex-start' : 'flex-end', // 根据消息类型决定对齐方式
                  marginBottom: '10px', // 添加一些底部间距
                }}
              >
                <Card
                  style={{
                    backgroundColor: chat.isReply ? 'rgba(0,0,0,0.06)' : '#95ec69',
                    border: 'none',
                    width: 'auto', // 让宽度自适应内容
                    height: 'auto', // 让高度自适应内容
                  }}
                  styles={{
                      body: {
                        padding: '10px', // 覆盖默认的 padding
                        // borderRadius: '10px', // 覆盖默认的 borderRadius
                      }
                  }}
                >
                  <Typography.Text
                    style={{
                      whiteSpace: 'pre-wrap', // 允许文本换行
                      wordBreak: 'break-word', // 允许单词内换行
                    }}
                  >
                    {chat.text}
                  </Typography.Text>
                </Card>
              </div>
            );
          })}
        </div>
        <Space
          direction="vertical"
          size="middle"
          style={{
            width: '94%',
            position: 'absolute',
            bottom: 0,
            marginBottom: '22px',
          }}
        >
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onPressEnter={handleSend}
            />
            <Button type="primary" onClick={handleSend}>
              发送
            </Button>
          </Space.Compact>
        </Space>
      </Card>
    </PageContainer>
  );
};

export default Chat;
