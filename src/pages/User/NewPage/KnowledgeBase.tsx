import React, { useState } from 'react';
import { Menu, Button, Dropdown, Input, message } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';

const KnowledgeBase: React.FC = () => {
  const [knowledgeBases, setKnowledgeBases] = useState<string[]>(['默认知识库']);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<string>('默认知识库');

  // 添加知识库
  const addKnowledgeBase = () => {
    const newKnowledgeBase = `知识库 ${knowledgeBases.length + 1}`;
    setKnowledgeBases([...knowledgeBases, newKnowledgeBase]);
    setSelectedKnowledgeBase(newKnowledgeBase);
  };

  // 删除知识库
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

  // 重命名知识库
  const renameKnowledgeBase = (oldName: string) => {
    const newName = prompt('请输入新的知识库名称：', oldName);
    if (newName && newName !== oldName) {
      setKnowledgeBases(knowledgeBases.map((kb) => (kb === oldName ? newName : kb)));
      if (selectedKnowledgeBase === oldName) {
        setSelectedKnowledgeBase(newName);
      }
    }
  };

  // 右键菜单
  const menu = (name: string) => (
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

  return (
    <div>
      <Menu
        mode="inline"
        selectedKeys={[selectedKnowledgeBase]}
        onClick={(e) => setSelectedKnowledgeBase(e.key)}
      >
        {knowledgeBases.map((kb) => (
          <Menu.Item key={kb}>
            <Dropdown overlay={menu(kb)} trigger={['contextMenu']}>
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
    </div>
  );
};

export default KnowledgeBase;
