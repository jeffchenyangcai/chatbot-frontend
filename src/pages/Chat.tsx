import { PageContainer } from '@ant-design/pro-layout';
import { Button, Card, Input, message, Popover, Space, theme, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useParams, history, useModel } from '@umijs/max'; // 引入 useParams、history 和 useModel 钩子
import ReactMarkdown from 'react-markdown'; // 引入 react-markdown 库
import remarkGfm from 'remark-gfm'; // 引入 remark-gfm 插件
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'; // 引入代码高亮库
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism'; // 引入代码高亮样式
import Clipboard from 'clipboard'; // 引入复制到剪贴板库

const Chat: React.FC = () => {
  const { token } = theme.useToken();
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null); // 选中的消息
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null); // 记录长按定时器
  const [isLongPressed, setIsLongPressed] = useState(false); // 是否为长按
  const [collectTimer, setCollectTimer] = useState<NodeJS.Timeout | null>(null); // 收藏按钮延时消失定时器
  const { id } = useParams(); // 获取 URL 中的动态参数 id
  const { initialState, setInitialState } = useModel('@@initialState'); // 获取 initialState 和 setInitialState

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
        .then((response) => response.json())
        .then((data) => {
          const newConversationId = data.id;
          history.push(`/chat/${newConversationId}`);

          const newMenuItems = [
            ...(initialState?.menuItems || []),
            { path: `/chat/${newConversationId}`, name: `Chat ${newConversationId}` },
          ];
          setInitialState({ ...initialState, menuItems: newMenuItems });

          message.success('会话创建成功');
        })
        .catch((error) => {
          console.error('Error creating new conversation:', error);
          message.error('会话创建失败');
        });
    } else {
      // 发起 fetch 请求获取历史聊天数据
      fetch(`http://127.0.0.1:3000/api/chat/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("前端收到的回答", data);
          const formattedHistory = data.messages.map((message, index) => ({
            text: message.text,
            key: index + 1,
            isReply: message.user === 'Chatbot',
            ansid: message.id,
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

  // 处理长按收藏
  const handleMouseDown = (message: any) => {
    console.log("选中的message", message);
    if (message.isReply === true) {
      const timer = setTimeout(() => {
        setIsLongPressed(true);
        setSelectedMessage(message);
      }, 500); // 设置长按时间为500ms
      setPressTimer(timer);
    }
  };

  const handleMouseUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const handleCollect = () => {
    if (selectedMessage) {
      console.log("选中的消息", selectedMessage);
      message.success('回答已收藏！回答编号:' + selectedMessage.ansid);
      // 发送请求更新 is_collected 字段
      fetch(`http://127.0.0.1:3000/api/messages/${selectedMessage.ansid}/collect`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`, // 如果需要认证
        },
        body: JSON.stringify({ is_collected: 1 }), // 更新 is_collected 为 1
      })
        .then((response) => response.json())
        .then((data) => {
          console.log('更新成功', data);
          message.success(`回答已收藏！回答编号: ${selectedMessage.ansid}`);
        })
        .catch((error) => {
          console.error('更新失败', error);
          message.error('收藏失败，请稍后重试');
        });

      setSelectedMessage(null);

      // 设置收藏按钮延时消失
      if (collectTimer) {
        clearTimeout(collectTimer);
      }
      const timer = setTimeout(() => {
        setIsLongPressed(false); // 2秒后消失按钮
        setSelectedMessage(null); // 2秒后清除选中的消息
      }, 2000); // 2秒后消失
      setCollectTimer(timer);
    }
  };

  useEffect(() => {
    const clipboard = new Clipboard('.copy-button');

    clipboard.on('success', (e) => {
      message.success('代码已复制到剪贴板');
      e.clearSelection();
    });

    clipboard.on('error', (e) => {
      message.error('复制失败，请稍后重试');
    });

    return () => {
      clipboard.destroy();
    };
  }, []);

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
            flexGrow: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '390px',
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
                onMouseDown={() => handleMouseDown(chat)}
                onMouseUp={handleMouseUp}
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
                  {chat.isReply ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <div style={{ position: 'relative' }}>
                              <SyntaxHighlighter
                                style={dracula}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                              <Button
                                type="primary"
                                className="copy-button"
                                data-clipboard-text={String(children).replace(/\n$/, '')}
                                style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  zIndex: 1,
                                }}
                              >
                                复制
                              </Button>
                            </div>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {chat.text}
                    </ReactMarkdown>
                  ) : (
                    <Typography.Text
                      style={{
                        whiteSpace: 'pre-wrap', // 允许文本换行
                        wordBreak: 'break-word', // 允许单词内换行
                      }}
                    >
                      {chat.text}
                    </Typography.Text>
                  )}
                </Card>
                {selectedMessage?.key === chat.key && isLongPressed && (
                  <Popover
                    content={
                      <Button type="primary" onClick={handleCollect}>
                        收藏此消息
                      </Button>
                    }
                    trigger="click"
                    visible={isLongPressed}
                    onVisibleChange={(visible) => {
                      if (!visible) setSelectedMessage(null);
                    }}
                    placement="top"
                  >
                    <div></div>
                  </Popover>
                )}
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
