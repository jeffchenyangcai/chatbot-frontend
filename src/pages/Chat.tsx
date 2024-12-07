import { Button, Card, Input, Space, theme, Typography, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useParams, history, useModel } from '@umijs/max';
import { PageContainer } from '@ant-design/pro-layout';
import { StarOutlined, StarFilled, PaperClipOutlined } from '@ant-design/icons';

const Chat: React.FC = () => {
  const { token } = theme.useToken();
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const { id } = useParams();
  const { initialState, setInitialState } = useModel('@@initialState');

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

          const newMenuItems = [
            ...(initialState?.menuItems || []),
            { path: `/chat/${newConversationId}`, name: `Chat ${newConversationId}` },
          ];
          setInitialState({ ...initialState, menuItems: newMenuItems });

          message.success('会话创建成功');
        })
        .catch(error => {
          console.error('Error creating new conversation:', error);
          message.error('会话创建失败');
        });
    } else {
      fetch(`http://127.0.0.1:3000/api/chat/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
        .then(response => response.json())
        .then(data => {
          const formattedHistory = data.messages.map((message, index) => ({
            text: message.text,
            key: index + 1,
            isReply: message.user === 'Chatbot',
            is_collected: message.is_collected,
            answerId: message.id,
          }));

          setChatHistory(formattedHistory);
        })
        .catch(error => {
          console.error('Error fetching chat history:', error);
        });
    }
  }, [id]);

  const handleSend = () => {
    if (inputText.trim()) {
      const newChatHistory = [
        ...chatHistory,
        { text: inputText, key: chatHistory.length + 1, isReply: false, is_collected: false },
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
        .then(response => response.json())
        .then(data => {
          console.log('Message sent successfully:', data);

          const chatbotReply = data.messages[0];
          const updatedChatHistory = [
            ...newChatHistory,
            {
              text: chatbotReply.text,
              key: newChatHistory.length + 1,
              isReply: true,
              is_collected: false,
              answerId: chatbotReply.id,
            },
          ];

          setChatHistory(updatedChatHistory);
        })
        .catch(error => {
          console.error('Error sending message:', error);
        });

      setInputText('');
    }
  };

  const handleCollect = (selectedChat) => {
    const updatedChatHistory = chatHistory.map(chat =>
      chat.key === selectedChat.key
        ? { ...chat, is_collected: selectedChat.is_collected === 1 ? 0 : 1 }
        : chat
    );

    console.log("selectedChat：", selectedChat);
    console.log("chatHistory：", chatHistory);

    setChatHistory(updatedChatHistory);

    message.success(
      `Message ${selectedChat.answerId} ${updatedChatHistory.find(chat => chat.key === selectedChat.key)?.is_collected === 1 ? 'added to' : 'removed from'} favorites.`
    );

    fetch(`http://127.0.0.1:3000/api/messages/${selectedChat.answerId}/collect`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ is_collected: selectedChat.is_collected === 1 ? 0 : 1 }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('更新成功', data);
        message.success(`回答已${selectedChat.is_collected === 1 ? '取消' : ''}收藏！回答编号: ${selectedChat.answerId}`);
      })
      .catch((error) => {
        console.error('更新失败', error);
        message.error('收藏失败，请稍后重试');
      });
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        message.success('文本已复制到剪贴板');
      })
      .catch(() => {
        message.error('复制失败');
      });
  };

  // 监听回车键发送消息
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();  // 防止换行
      handleSend();
    }
  };



  return (
    <PageContainer>
      <Card
        style={{
          borderRadius: 8,
          minHeight: '40vh',  // 确保整个页面填满
          display: 'flex',
          flexDirection: 'column',  // 使用 flex 布局
          paddingBottom: '80px',  // 给底部留出空间，避免输入框被遮挡
        }}
      >
        <div
          className="chat-page1"
          style={{
            fontSize: '20px',
            color: token.colorTextHeading,
            marginBottom: '16px',
          }}
        >
          Title
        </div>

        <div
          className="chat-page2"
          style={{
            flexGrow: 1, // 让对话记录区域占据剩余空间
            overflowY: 'auto', // 使用页面滚动条处理滚动
            padding: '16px', // 添加一些内边距
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {chatHistory.map((chat) => (
            <div
              className="chat-bubble"
              key={chat.key}
              style={{
                alignSelf: chat.isReply ? 'flex-start' : 'flex-end',
                marginBottom: '20px',
              }}
            >
              <Card
                style={{
                  backgroundColor: chat.isReply ? 'rgba(0,0,0,0.06)' : '#95ec69',
                  border: 'none',
                  width: 'auto',
                  height: 'auto',
                  maxWidth: `${window.innerWidth * 0.5}px`, // 设置最大宽度为页面的一半
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

              {chat.isReply && (
                <Space size="small" style={{ marginTop: '8px', gap: '1px' }}>
                  <Button
                    type="link"
                    icon={chat.is_collected ? <StarFilled /> : <StarOutlined />}
                    onClick={() => handleCollect(chat)}
                  />
                  <Button
                    type="link"
                    icon={<PaperClipOutlined />}
                    onClick={() => handleCopyToClipboard(chat.text)}
                  />
                </Space>
              )}
            </div>
          ))}
        </div>
      </Card>
      {/* 固定输入框 */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          padding: '16px',
          zIndex: 10,
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',  // 水平居中
            padding: '0 20px',  // 左右边距（可根据需要调整）
            width: '100%',  // 父容器宽度占满
          }}
        >
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="请输入问题..."
              style={{
                borderRadius: '16px',
                flexGrow: 1,  // 根据需求调整输入框宽度
                marginLeft: '208px', // 按钮和输入框之间的间距
              }}
              onKeyDown={handleKeyDown} // 监听回车键
            />
            <Button
              type="primary"
              onClick={handleSend}
              style={{
                borderRadius: '16px',
                marginLeft: '18px', // 按钮和输入框之间的间距
                marginRight: '68px', // 按钮和输入框之间的间距
              }}
            >
              发送
            </Button>
          </Space.Compact>
        </div>

      </div>
    </PageContainer>
  );
};

export default Chat;
