import { Button, Card, Input, Space, theme, Typography, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useParams, history, useModel } from '@umijs/max'; // 引入 useParams、history 和 useModel 钩子
import { PageContainer } from '@ant-design/pro-layout'; // 导入 PageContainer

const Chat: React.FC = () => {
  const { token } = theme.useToken();
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const { id } = useParams(); // 获取 URL 中的动态参数 id
  const { initialState, setInitialState } = useModel('@@initialState'); // 获取 initialState 和 setInitialState

  const fetchConversationIds = async () => {
    try {
      const response = await fetch('http://127.0.0.1:3000/api/conversations', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      console.log('Conversation IDs fetched:', data.conversation_ids);
      return data.conversation_ids;
    } catch (error) {
      console.error('Error fetching conversation IDs:', error);
      return [];
    }
  };

  useEffect(() => {
    if (id === 'new') {
      // 如果是新增会话，发送 POST 请求创建新会话
      fetch('http://127.0.0.1:3000/api/chat/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
        .then(response => response.json())
        .then(data => {
          const newConversationId = data.id;
          history.push(`/chat/${newConversationId}`);

          // 更新菜单项
          const newMenuItems = [
            ...(initialState?.menuItems || []),
            { path: `/chat/${newConversationId}`, name: `Chat ${newConversationId}` },
          ];
          setInitialState({ ...initialState, menuItems: newMenuItems });

          message.success('会话创建成功'); // 新增会话成功提示
        })
        .catch(error => {
          console.error('Error creating new conversation:', error);
          message.error('会话创建失败'); // 新增会话失败提示
        });
    } else {
      // 发起 fetch 请求获取历史聊天数据
      fetch(`http://127.0.0.1:3000/api/chat/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
        .then(response => response.json())
        .then(data => {
          // 将获取到的数据格式化成与当前 chatHistory 状态结构一致的格式
          const formattedHistory = data.messages.map((message, index) => ({
            text: message.text,
            key: index + 1,
            isReply: message.user === 'Chatbot', // 假设 Chatbot 是机器人的用户名
          }));

          // 更新 chatHistory 状态
          setChatHistory(formattedHistory);
        })
        .catch(error => {
          console.error('Error fetching chat history:', error);
        });
    }
  }, [id]); // 依赖 id 变化重新获取聊天记录

  const handleSend = () => {
    if (inputText.trim()) {
      const newChatHistory = [
        ...chatHistory,
        { text: inputText, key: chatHistory.length + 1, isReply: false },
      ];

      // 更新 chatHistory 状态
      setChatHistory(newChatHistory);

      // 发送消息到后端
      fetch(`http://127.0.0.1:3000/api/chat/${id}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          messages: [
            {
              user: 'User',
              text: inputText,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              user_id: null,
            },
          ],
        }),
      })
        .then(response => response.json())
        .then(data => {
          console.log('Message sent successfully:', data);

          // 处理后端返回的 Chatbot 回复消息
          const chatbotReply = data.messages[0];
          const updatedChatHistory = [
            ...newChatHistory,
            {
              text: chatbotReply.text,
              key: newChatHistory.length + 1,
              isReply: true,
            },
          ];

          // 更新 chatHistory 状态
          setChatHistory(updatedChatHistory);
        })
        .catch(error => {
          console.error('Error sending message:', error);
        });

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
                  bodyStyle={{
                    padding: '10px', // 覆盖默认的 padding
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
