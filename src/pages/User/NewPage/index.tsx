import React, { useState, useRef, useEffect } from 'react';
import { Layout, Menu, Dropdown, Button, Upload, Input, Switch, Card, List, message } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, UploadOutlined, SendOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Sider, Content } = Layout;
const fakeData = [
  { 
    id: 20, 
    query: "Director接收南向告警的snmp端口号是多少", 
    answer1: "南向告警的SNMP端口号是40001和40002。其中，40001用于UDP/SNMP（不安全）协议，40002用于UDP协议。这两个端口用于Provider告警上报，分别对应SNMP v2和SNMP v3版本。",
    answer2: "SNMP（Simple Network Management Protocol）通常使用UDP协议，默认的端口号是161。因此，Director接收南向告警的SNMP端口号通常是161。"
  },
  { 
    id: 21, 
    query: "RCP怎样实现语音会话隔离？", 
    answer1: "RCP实现语音会话隔离的主要方法如下：\n1. 配置专用APN：通过在RCP中配置IMS域APN和紧急APN，将这些APN上的会话视为语音会话。这样，语音会话就可以与数据会话区分开来。\n2. 策略控制：RCP对语音会话不访问SPR和OCS/CHF，不进行用户签约检查，也不根据用户签约、累计用量、OCS/CHF策略计数器状态的策略对语音会话生效。\n3. 独立授权时长配置：为语音会话配置独立的会话授权时长，确保语音会话的可靠性。语音会话的授权时长配置可以包括默认值和特定场景下的配置。\n4. 不同处理流程：在处理AAR/STR请求时，RCP对语音会话采用“等承载确认后响应”的方式，即先与SMF/PGW交互，再回复AAA/STA，以减少对语音会话的干扰。\n5. 资源预留：RCP之间需要同步用户路由数据和用户会话数据，确保语音会话的稳定性和可靠性。\n6. 会话审计：RCP通过“同用户同DNN多会话审计配置”检测同用户同DNN最久未交互的N7/Gx会话是否挂死，挂死则清理，以避免资源浪费和潜在的问题。\n7. 时段策略：语音会话不需要使用时段策略，而是通过配置授权时长来实现会话周期性保活。",
    answer2: "RCP（Resource Control Protocol）通过在网络中部署专门的语音会话隔离设备或使用虚拟局域网（VLAN）技术来实现语音会话隔离。具体实现方式可能包括：使用VLAN将语音流量与其他流量（如数据流量）分开。部署专门的语音网关或会话边界控制器（SBC）来管理和隔离语音会话。配置QoS（Quality of Service）策略，确保语音流量的优先级高于其他流量。"
  },
  { 
    id: 22, 
    query: "N7/Gx会话授权时长在哪配置？", 
    answer1: "N7/Gx会话授权时长在RCP策略管理GUI配置中的N7/Gx会话控制策略的规则动作参数集中设置“授权时长”参数值。如果未设置（值为0视为未设置），则RCP依据会话授权时长默认配置确定会话授权时长。可以通过以下命令修改会话授权时长默认配置：\n- 修改N7 IMS会话授权时长：`SET SESSAUTHPRDDEF:N7IMSAUTHPRD=120;`\n- 修改N7 Data会话授权时长：`SET SESSAUTHPRDDEF:N7DATAAUTHPRD=120;`\n- 修改Gx IMS会话授权时长：`SET SESSAUTHPRDDEF:GXIMSAUTHPRD=120;`\n- 修改Gx Data会话授权时长：`SET SESSAUTHPRDDEF:GXDATAAUTHPRD=120;`\n此外，还可以设置会话授权时长最大随机偏移，通过以下命令：\n- 设置会话授权时长最大随机偏移：`SET SESSAUTHPRDDEF:AUTHPERDMAXOFFSET=10;`",
    answer2: "N7/Gx会话授权时长通常在PCEF（Policy and Charging Enforcement Function）或PCRF（Policy and Charging Rules Function）中配置。具体配置位置可能因网络架构和设备供应商而异，但通常可以在PCRF的策略管理界面或PCEF的配置文件中进行设置。"
  },
  { 
    id: 23, 
    query: "RCP和SPR之间有哪些接口？", 
    answer1: "RCP和SPR之间的接口主要包括以下几种：\n1. UDR (User-Data-Request)：RCP通过发送UDR消息向SPR请求用户的签约信息。该接口主要用于用户上线时，RCP获取用户签约信息。\n2. UDA (User-Data-Answer)：SPR通过发送UDA消息响应RCP的UDR请求，返回用户的签约信息。\n3. Sp接口：用于RCP和SPR之间的用户签约和用量信息的交互。具体功能包括：\n   - 用户上线时，RCP通过Sp接口从SPR获取用户签约信息。\n   - 用户在线过程中，RCP通过Sp接口向SPR保存用户动态数据（如套餐使用流量等）。\n   - 用户在线过程中，如果SPR签约改变，SPR通过Sp接口将最新用户签约推送给RCP。\n4. Sp'接口：用于RCP和SPR之间的用户动态数据交互。具体功能包括：\n   - 用户上线时，RCP通过Sp'接口从SPR获取用户动态数据。\n   - 用户在线过程中，RCP通过Sp'接口向SPR保存用户动态数据。\n5. PNR (Ping-Request) 和 PNA (Ping-Answer)：SPR通过发送PNR消息检测RCP的状态，RCP通过返回PNA消息响应SPR的状态检测请求。\n6. Sp-UDR：RCP通过发送Sp-UDR消息通知SPR用户下线。\n7. Sp-UDA：SPR通过发送Sp-UDA消息向RCP返回响应信息，包括用户下线确认等。",
    answer2: "RCP（Resource Control Protocol）和SPR（Subscriber Profile Repository）之间的接口通常包括以下几种：\n1. HTTP/HTTPS接口：用于传递用户配置文件和策略信息。\n2. Diameter接口：用于传递用户策略和计费信息。\n3.SNMP接口：用于监控和管理SPR的状态和性能。\n4.CLI/API接口：用于手动配置和管理SPR的策略和用户信息。"
  },
  { 
    id: 24, 
    query: "PCF哪些服务被AMF调用？", 
    answer1: "PCF向AMF调用的服务主要包括以下几种：\n1. Npcf_AMPolicyControl_Create：PCF生成AM策略，并关联ID、策略和订阅的事件列表，然后发送给AMF。\n2. Npcf_AMPolicyControl_Update：当PCF订阅的事件发生时，AMF向PCF发送更新请求，以修改AM策略。\n3. Npcf_SMPolicyControl_Update：在可选的情况下，如果SMF+PGW-C订阅的信息发生变化，它会向PCF发送更新请求，PCF根据当前的用户接入参数和授权策略控制参数，响应更新请求。\n此外，PCF还与AMF交互以下服务：\n- Namf_EventExposure：AMF提供的事件开放服务。\n- Namf_MT：AMF提供的移动终止服务。\n- Namf_Location：AMF提供的位置服务。",
    answer2: "PCF（Policy Control Function）提供的服务中，AMF（Access and Mobility Management Function）通常会调用以下服务：\n1.策略控制服务：用于管理和执行用户策略，包括QoS策略、流量控制策略等。\n2.会话管理服务：用于管理用户会话的生命周期，包括会话建立、修改和释放。\n3.计费控制服务：用于收集和报告用户使用情况，以便进行计费。\n4.网络切片管理服务：用于管理网络切片资源分配和策略执行。"
  }

];
const NewPage: React.FC = () => {
  // **知识库管理状态**
  const [knowledgeBases, setKnowledgeBases] = useState<string[]>(['默认知识库']);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<string>('默认知识库');

  // **文件上传状态**
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url?: string }[]>([]);

  // **GPT 聊天状态**
  const [chatHistory, setChatHistory] = useState<{ sender: string; message: string, type?: string }[]>([]);
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
  const handleUpload = async (fileList: FileList) => {
    const formData = new FormData();
    formData.append('knowledge_base_id', selectedKnowledgeBase); // 确保上传时传递知识库ID

    // 遍历文件列表，确保每个文件是 .txt 格式
    Array.from(fileList).forEach((file) => {
      if (file.type !== 'text/plain') {
        message.error('只能上传 .txt 文件');
        return;
      }
      formData.append('files[]', file); // 添加每个文件到表单数据
    });

    const token = localStorage.getItem('token');  // 获取存储在 localStorage 中的 token

    if (!token) {
      message.error('用户未登录');
      return;
    }

    try {
      const response = await axios.post('/api/upload_folder', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,  // 在请求头中传递 token
        },
      });

      if (response.data.success) {
        message.success('文件上传成功');
        // 更新已上传文件列表
        setUploadedFiles((prev) => [
          ...prev,
          ...Array.from(fileList).map((file) => ({
            name: file.name,
            url: '文件路径待填写', // 后端需要返回实际路径
          })),
        ]);
      }
    } catch (error) {
      message.error('文件上传失败');
      console.error(error);
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
        // 查找是否存在与问题匹配的答案
        const question = inputMessage.trim();
        const matchedData = fakeData.find((data) => data.query.includes(question));

        if (matchedData) {
          const ragAnswer = matchedData.answer1;
          const contextAnswer = matchedData.answer2;
          
          const aiResponse = isRagOnly
            ? [{ sender: 'GPT (RAG)', message: ragAnswer, type: 'rag' }] // RAG 模式，只返回 RAG 答案
            : [
                { sender: 'GPT (RAG)', message: ragAnswer, type: 'rag' },   // RAG 模式的答案
                { sender: 'GPT (Context)', message: contextAnswer, type: 'context' } // 上下文模式的答案
              ];

          setChatHistory((prev) => [...prev, ...aiResponse]);
        } else {
          setChatHistory((prev) => [
            ...prev,
            { sender: 'GPT', message: '未能找到相关答案，请尝试其他问题。' }
          ]);
        }
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
            name="files"
            multiple
            beforeUpload={() => false}  // 阻止自动上传
            onChange={(info) => handleUpload(info.fileList)}
          >
            <Button icon={<UploadOutlined />}>上传文件</Button>
          </Upload>
        </Card>

        {/* GPT 聊天 */}
        <Card title={`当前知识库：${selectedKnowledgeBase}`} style={{ marginBottom: '16px' }}>
        <div
  ref={chatBoxRef}
  style={{
    height: '800px',
    overflowY: 'auto',
    padding: '16px',
    border: '1px solid #d9d9d9',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
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
          backgroundColor: chat.type === 'rag' ? '#ffb3d9' : chat.type === 'context' ? '#e6f7ff' : '#e6ffe6',
          color: chat.type === 'rag' ? '#333' : chat.type === 'context' ? '#007acc' : '#16b150',
          fontSize: '14px',
          fontWeight: chat.sender === 'User' ? 600 : 400,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        <strong>{chat.sender}:</strong> <span dangerouslySetInnerHTML={{ __html: chat.message.replace(/\n/g, '<br />') }} />
      </div>
    </div>
  ))}
</div>

          <div style={{ display: 'flex', marginTop: '16px' }}>
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="输入消息"
              style={{ flex: 1, marginRight: '8px' }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={sendMessage}
            >
              发送
            </Button>
          </div>
          <div style={{ marginTop: '16px' }}>
            <label>
              <Switch
                checked={isRagOnly}
                onChange={(checked) => setIsRagOnly(checked)}
                checkedChildren="RAG"
                unCheckedChildren="上下文"
              />
              RAG模式
            </label>
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default NewPage;
