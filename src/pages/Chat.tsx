import React, { useEffect, useState } from 'react';
import { Button, Card, Input, Space, theme, Typography, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'; // 引入删除和加号图标
import { useParams, history, useModel } from '@umijs/max';
import { PageContainer } from '@ant-design/pro-layout';

const Chat: React.FC = () => {
  const { token } = theme.useToken();
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const { id } = useParams();
  const { initialState, setInitialState } = useModel('@@initialState');

  // 创建新会话
  const createNewConversation = async () => {
    try {
      const response = await fetch('http://127.0.0.1:3000/api/chat/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      return data.id; // 返回新会话 ID
    } catch (error) {
      console.error('Error creating new conversation:', error);
      message.error('会话创建失败');
    }
  };

  // 获取所有会话ID
  const fetchConversationIds = async () => {
    try {
      const response = await fetch('http://127.0.0.1:3000/api/conversations', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      return data.conversation_ids;
    } catch (error) {
      console.error('Error fetching conversation IDs:', error);
      return [];
    }
  };

  // 添加新会话并延时更新菜单
  const handleAddConversation = async () => {
    const newConversationId = await createNewConversation();
    if (newConversationId) {
      // 延时更新菜单项
      setTimeout(async () => {
        const updatedConversationIds = await fetchConversationIds();
        const newMenuItems = [
          ...(initialState?.menuItems || []),
          { path: `/chat/${newConversationId}`, name: `Chat ${newConversationId}` },
        ];
        setInitialState((prevState) => ({
          ...prevState,
          menuItems: newMenuItems,
        }));

        message.success('会话创建成功');
        history.push(`/chat/${newConversationId}`);
      }, 300); // 延时 300 毫秒
    }
  };

  // 删除会话
  const handleDeleteConversation = async (conversationId: number) => {
    try {
      await fetch(`http://127.0.0.1:3000/api/chat/${conversationId}`, {
        method: 'DELETE',
      });
      message.success('会话删除成功');

      // 延时更新菜单项
      setTimeout(async () => {
        const updatedConversationIds = await fetchConversationIds();
        const newMenuItems = updatedConversationIds.map((id) => ({
          path: `/chat/${id}`,
          name: `Chat ${id}`,
        }));
        newMenuItems.push({ path: '/chat/new', name: 'New Chat', icon: <PlusOutlined /> });

        setInitialState((prevState) => ({
          ...prevState,
          menuItems: newMenuItems,
        }));
      }, 1000);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      message.error('会话删除失败');
    }
  };

  useEffect(() => {
    if (id === 'new') {
      handleAddConversation();
    } else {
      // 获取聊天记录
      fetch(`http://127.0.0.1:3000/api/chat/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          const formattedHistory = data.messages.map((message, index) => ({
            text: message.text,
            key: index + 1,
            isReply: message.user === 'Chatbot',
          }));
          setChatHistory(formattedHistory);
        })
        .catch((error) => {
          console.error('Error fetching chat history:', error);
        });
    }
  }, [id]);

  const handleSend = () => {
    if (inputText.trim()) {
      const newChatHistory = [
        ...chatHistory,
        { text: inputText, key: chatHistory.length + 1, isReply: false },
      ];

      setChatHistory(newChatHistory);

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
        .then((response) => response.json())
        .then((data) => {
          const chatbotReply = data.messages[0];
          const updatedChatHistory = [
            ...newChatHistory,
            {
              text: chatbotReply.text,
              key: newChatHistory.length + 1,
              isReply: true,
            },
          ];
          setChatHistory(updatedChatHistory);
        })
        .catch((error) => {
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
          justifyContent: 'space-between',
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
            flexGrow: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '300px',
          }}
        >
          {chatHistory.map((chat) => {
            return (
              <div
                className="chat-bubble"
                key={chat.key}
                style={{
                  alignSelf: chat.isReply ? 'flex-start' : 'flex-end',
                  marginBottom: '10px',
                }}
              >
                <Card
                  style={{
                    backgroundColor: chat.isReply ? 'rgba(0,0,0,0.06)' : '#95ec69',
                    border: 'none',
                    width: 'auto',
                    height: 'auto',
                  }}
                  bodyStyle={{
                    padding: '10px',
                  }}
                >
                  <Typography.Text
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
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
        {/* <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddConversation} // 点击加号按钮时调用 handleAddConversation
        >
          新增会话
        </Button> */}
      </Card>
    </PageContainer>
  );
};

export default Chat;
