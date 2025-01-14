import React, { useState, useRef, useEffect } from 'react';
import { Layout, Menu, Dropdown, Button, Upload, Input, Switch, Card, message } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, UploadOutlined, SendOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Sider, Content } = Layout;

const NewPage: React.FC = () => {
  const [knowledgeBases, setKnowledgeBases] = useState<{ id: number; name: string }[]>([]);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<number | null>(null);
  const [chatHistory, setChatHistory] = useState<{ sender: string; message: string; type?: string }[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isRagOnly, setIsRagOnly] = useState<boolean>(true);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // **加载知识库列表**
  useEffect(() => {
    const fetchKnowledgeBases = async () => {
      try {
        const response = await axios.get('/api/knowledge_bases', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, // 携带认证令牌
        });
        if (response.data.success) {
          setKnowledgeBases(response.data.knowledgeBases);
          if (response.data.knowledgeBases.length > 0) {
            setSelectedKnowledgeBase(response.data.knowledgeBases[0].id);
          }
        } else {
          message.error('加载知识库失败');
        }
      } catch (error) {
        console.error('加载知识库错误:', error);
        message.error('无法加载知识库，请检查后端服务');
      }
    };

    fetchKnowledgeBases();
  }, []);

  // **新增知识库**
  const addKnowledgeBase = async () => {
    const newKnowledgeBaseName = `知识库 ${knowledgeBases.length + 1}`;

    try {
      const response = await axios.post(
        '/api/knowledge_bases',
        { name: newKnowledgeBaseName },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, // 携带认证令牌
        }
      );

      if (response.data.success) {
        const newKnowledgeBase = { id: response.data.id, name: response.data.name };
        setKnowledgeBases([...knowledgeBases, newKnowledgeBase]);
        setSelectedKnowledgeBase(newKnowledgeBase.id);
        message.success('知识库创建成功');
      } else {
        message.error(response.data.message || '知识库创建失败');
      }
    } catch (error) {
      console.error('知识库创建错误:', error);
      message.error('知识库创建失败，请检查后端服务');
    }
  };

  // **删除知识库**
  const deleteKnowledgeBase = async (knowledgeBaseId: number) => {
    try {
      const response = await axios.delete(`/api/knowledge_bases/${knowledgeBaseId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, // 携带认证令牌
      });

      if (response.data.success) {
        setKnowledgeBases(knowledgeBases.filter((kb) => kb.id !== knowledgeBaseId));
        message.success('知识库删除成功');
        if (selectedKnowledgeBase === knowledgeBaseId) {
          setSelectedKnowledgeBase(knowledgeBases.length > 1 ? knowledgeBases[0].id : null);
        }
      } else {
        message.error(response.data.message || '知识库删除失败');
      }
    } catch (error) {
      console.error('知识库删除错误:', error);
      message.error('知识库删除失败，请检查后端服务');
    }
  };

  // **文件上传函数**
  const handleUpload = async (fileList) => {
    if (!selectedKnowledgeBase) {
      message.warning('请选择一个知识库');
      return;
    }
  
    const formData = new FormData();
    fileList.forEach((file) => {
      if (!(file instanceof File)) {
        message.error('无效的文件格式');
        return;
      }
      if (!file.name.endsWith('.txt')) {
        message.error('仅支持上传 .txt 文件');
        return;
      }
      formData.append('files[]', file); // 使用 'files[]' 保证数组格式
    });
  
    formData.append('knowledge_base_id', selectedKnowledgeBase.toString());
  
    try {
      const response = await axios.post('/api/knowledge_bases/upload_and_process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
  
      if (response.data.success) {
        message.success('文件上传并处理成功');
      } else {
        message.error(response.data.message || '文件上传失败');
      }
    } catch (error) {
      console.error('文件上传错误:', error);
      message.error('文件上传失败，请检查后端服务');
    }
  };
  

  // **发送问题**
  const sendMessage = async () => {
    if (inputMessage.trim() === '') {
      message.warning('请输入有效的问题！');
      return;
    }
  
    if (!selectedKnowledgeBase) {
      message.warning('请选择一个知识库');
      return;
    }
  
    // 添加用户消息到聊天记录
    setChatHistory([...chatHistory, { sender: 'User', message: inputMessage }]);
    setInputMessage('');
  
    try {
      const requestData = {
        knowledge_base_id: selectedKnowledgeBase,
        question: inputMessage,
        mode: isRagOnly ? 'rag' : 'context',
      };
  
      const response = await axios.post('/api/rag_query', requestData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
  
      if (response.data.success) {
        const { ragAnswer, contextAnswer } = response.data;
  
        setChatHistory((prev) => {
          const newHistory = [...prev];
          if (isRagOnly && ragAnswer && contextAnswer) {
            // RAG 模式下展示两种回答
            newHistory.push(
              { sender: 'GPT (RAG)', message: ragAnswer, type: 'rag' },
              { sender: 'GPT (上下文)', message: contextAnswer, type: 'context' }
            );
          } else if (contextAnswer) {
            // 上下文模式仅展示 contextAnswer
            newHistory.push({ sender: 'GPT', message: contextAnswer, type: 'context' });
          }
          return newHistory;
        });
      } else {
        message.error(response.data.message || '查询失败，请稍后再试！');
      }
    } catch (error) {
      console.error('请求失败:', error);
      message.error('查询失败，请稍后再试！');
    }
  };
  
  
const handleKnowledgeBaseChange = async (knowledgeBaseId: number) => {
  setSelectedKnowledgeBase(knowledgeBaseId); // 更新选中的知识库 ID

  try {
    // 调用后端接口获取历史对话
    const response = await axios.get(`/api/knowledge_bases/${knowledgeBaseId}/history`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });

    if (response.data.success) {
      // 处理后端返回的历史记录，更新聊天记录
      const messages = response.data.messages.map((msg: any) => ({
        sender: msg.sender,
        message: msg.message,
        created_at: msg.created_at, // 可选字段
      }));
      setChatHistory(messages);
    } else {
      // 如果接口返回错误，清空当前聊天记录
      message.error(response.data.message || '加载历史对话失败');
      setChatHistory([]);
    }
  } catch (error) {
    console.error('加载历史对话失败:', error);
    message.error('加载历史对话失败，请检查后端服务');
    setChatHistory([]); // 加载失败时清空聊天记录
  }
};



  // **更新滚动条**
  useEffect(() => {
    const fetchKnowledgeBases = async () => {
      try {
        const response = await axios.get('/api/knowledge_bases', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (response.data.success) {
          setKnowledgeBases(response.data.knowledgeBases);
          if (response.data.knowledgeBases.length > 0) {
            const firstKnowledgeBaseId = response.data.knowledgeBases[0].id;
            setSelectedKnowledgeBase(firstKnowledgeBaseId);
            await handleKnowledgeBaseChange(firstKnowledgeBaseId); // 加载第一个知识库的历史对话
          }
        } else {
          message.error('加载知识库失败');
        }
      } catch (error) {
        console.error('加载知识库错误:', error);
        message.error('无法加载知识库，请检查后端服务');
      }
    };
  
    fetchKnowledgeBases();
  }, []);
  

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={256} theme="light">
      <Menu
          mode="inline"
          selectedKeys={selectedKnowledgeBase ? [selectedKnowledgeBase.toString()] : []}
          onClick={(e) => handleKnowledgeBaseChange(Number(e.key))}
        >
          {knowledgeBases.map((kb) => (
            <Menu.Item key={kb.id.toString()}>
              <Dropdown
                overlay={
                  <Menu>
                    <Menu.Item
                      key="delete"
                      icon={<DeleteOutlined />}
                      onClick={() => deleteKnowledgeBase(kb.id)}
                    >
                      删除
                    </Menu.Item>
                  </Menu>
                }
                trigger={['contextMenu']}
              >
                <span>{kb.name}</span>
              </Dropdown>
            </Menu.Item>
          ))}
        </Menu>

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addKnowledgeBase}
          style={{ margin: '16px' }}
        >
          新增知识库
        </Button>
      </Sider>

      <Content style={{ padding: '24px', backgroundColor: '#f5f5f5' }}>
        <Card title="文件上传" style={{ marginBottom: '16px' }}>
          <Upload
            name="files"
            directory
            multiple
            beforeUpload={() => false}
            onChange={(info) => handleUpload(info.fileList.map(file => file.originFileObj))}

          >
            <Button icon={<UploadOutlined />}>上传文件夹</Button>
          </Upload>
        </Card>

        <Card title={`当前知识库：${selectedKnowledgeBase || '未选择'}`} style={{ marginBottom: '16px' }}>
          <div
            ref={chatBoxRef}
            style={{
              height: '600px',
              overflowY: 'auto',
              padding: '16px',
              border: '1px solid #d9d9d9',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
            }}
          >
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: chat.sender === 'User' ? 'flex-end' : 'flex-start',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    maxWidth: '60%',
                    padding: '10px',
                    borderRadius: '16px',
                    backgroundColor: chat.type === 'rag' ? '#e6f7ff' : '#f5f5f5',
                    color: '#333',
                  }}
                >
                  <strong>{chat.sender}:</strong> {chat.message}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', marginTop: '16px' }}>
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="请输入问题..."
              style={{ flex: 1, marginRight: '8px' }}
            />
            <Button type="primary" icon={<SendOutlined />} onClick={sendMessage}>
              发送
            </Button>
          </div>
          <div style={{ marginTop: '16px' }}>
            <Switch
              checked={isRagOnly}
              onChange={(checked) => setIsRagOnly(checked)}
              checkedChildren="RAG 模式"
              unCheckedChildren="上下文模式"
            />
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default NewPage;
