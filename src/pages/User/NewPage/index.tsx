import React, { useState, useRef, useEffect } from 'react';
import { Layout, Menu, Dropdown, Button, Upload, Input, Switch, Card, List, message } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  UploadOutlined,
  SendOutlined,
} from '@ant-design/icons';

const { Sider, Content } = Layout;

const NewPage: React.FC = () => {
  // **知识库管理状态**
  const [knowledgeBases, setKnowledgeBases] = useState<string[]>(['默认知识库']);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<string>('默认知识库');

  // **文件上传状态**
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url?: string }[]>([]);

  // **GPT 聊天状态**
  const [chatHistory, setChatHistory] = useState<{ sender: string; message: string }[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isRagOnly, setIsRagOnly] = useState<boolean>(true); // 开关状态：RAG 模式
  const chatBoxRef = useRef<HTMLDivElement>(null); // 聊天框滚动

  // **知识库管理函数**
  const addKnowledgeBase = () => {
    const newKnowledgeBase = `知识库 ${knowledgeBases.length + 1}`;
    setKnowledgeBases([...knowledgeBases, newKnowledgeBase]);
    setSelectedKnowledgeBase(newKnowledgeBase);
  };

  const deleteKnowledgeBase = (name: string) => {
    if (knowledgeBases.length === 1) {
      message.error('至少保留一个知识库');
      return;
    }
    setKnowledgeBases(knowledgeBases.filter((kb) => kb !== name));
    if (selectedKnowledgeBase === name) {
      setSelectedKnowledgeBase(knowledgeBases[0]);
    }
  };

  const renameKnowledgeBase = (oldName: string) => {
    const newName = prompt('请输入新的知识库名称：', oldName);
    if (newName && newName !== oldName) {
      setKnowledgeBases(knowledgeBases.map((kb) => (kb === oldName ? newName : kb)));
      if (selectedKnowledgeBase === oldName) {
        setSelectedKnowledgeBase(newName);
      }
    }
  };

  const knowledgeBaseMenu = (name: string) => (
    <Menu>
      <Menu.Item
        key="rename"
        icon={<EditOutlined />}
        onClick={() => renameKnowledgeBase(name)}
      >
        重命名
      </Menu.Item>
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={() => deleteKnowledgeBase(name)}
      >
        删除
      </Menu.Item>
    </Menu>
  );

  // **文件上传函数**
  const handleUpload = (info: any) => {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} 上传成功`);
      setUploadedFiles((prev) => [
        ...prev,
        { name: info.file.name, url: info.file.response?.url || '文件路径未知' },
      ]);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 上传失败`);
    }
  };

  // **GPT 聊天函数**
  const sendMessage = () => {
    if (inputMessage.trim()) {
      setChatHistory([
        ...chatHistory,
        { sender: 'User', message: inputMessage },
      ]);
      setInputMessage('');

      setTimeout(() => {
        const ragAnswer = `这是基于知识库 "${selectedKnowledgeBase}" 的回答内容。`;
        const contextAnswer = '这是根据上下文的回答内容。';
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

  // **布局结构**
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 左侧：知识库管理 */}
      <Sider width={256} theme="light">
        <Menu
          mode="inline"
          selectedKeys={[selectedKnowledgeBase]}
          onClick={(e) => setSelectedKnowledgeBase(e.key)}
        >
          {knowledgeBases.map((kb) => (
            <Menu.Item key={kb}>
              <Dropdown overlay={knowledgeBaseMenu(kb)} trigger={['contextMenu']}>
                <span>{kb}</span>
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

      {/* 右侧：文件上传 & GPT 聊天 */}
      <Content style={{ padding: '24px', backgroundColor: '#f5f5f5' }}>
        {/* 文件上传 */}
        <Card title="文件上传" style={{ marginBottom: '16px' }}>
          <Upload
            name="file"
            action="/api/upload" // 替换为实际的上传接口
            onChange={handleUpload}
          >
            <Button icon={<UploadOutlined />}>上传文件</Button>
          </Upload>
          <List
            style={{ marginTop: '16px' }}
            dataSource={uploadedFiles}
            renderItem={(file) => (
              <List.Item>
                <Card title={file.name}>
                  <p>文件路径：{file.url}</p>
                </Card>
              </List.Item>
            )}
          />
        </Card>

        {/* GPT 聊天框 */}
        <Card
          title={`当前知识库：${selectedKnowledgeBase}`}
          style={{ marginBottom: '16px' }}
        >
          <div
            ref={chatBoxRef}
            style={{
              height: '400px',
              overflowY: 'auto',
              padding: '16px',
              border: '1px solid #d9d9d9',
              borderRadius: '8px',
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
                <Card
                  style={{
                    maxWidth: '70%',
                    backgroundColor: chat.sender === 'User' ? '#e6f7ff' : '#f6ffed',
                    borderRadius: '12px',
                  }}
                >
                  <strong>{chat.sender === 'User' ? '你' : 'GPT'}</strong>
                  <p style={{ marginBottom: 0 }}>{chat.message}</p>
                </Card>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', marginTop: '16px' }}>
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onPressEnter={sendMessage}
              placeholder="请输入消息..."
              style={{ flex: 1 }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={sendMessage}
              style={{ marginLeft: '8px' }}
            >
              发送
            </Button>
          </div>
        </Card>

        {/* 模式切换开关 */}
        <div style={{ textAlign: 'right' }}>
          <Switch
            checked={isRagOnly}
            onChange={setIsRagOnly}
            checkedChildren="RAG 模式"
            unCheckedChildren="混合模式"
          />
        </div>
      </Content>
    </Layout>
  );
};

export default NewPage;
