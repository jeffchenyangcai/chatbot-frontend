import { AvatarDropdown, AvatarName, Footer, Question, SelectLang } from '@/components';
import { currentUser as queryCurrentUser } from '@/services/ant-design-pro/api';
import { PlusOutlined, DeleteOutlined, SmileOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { history, Link } from '@umijs/max';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import { message, Tooltip, Button } from 'antd';

const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/user/login';

// Fetch user info
const fetchUserInfo = async () => {
  try {
    const msg = await queryCurrentUser({ skipErrorHandler: true });
    return msg.data;
  } catch (error) {
    history.push(loginPath);
    return undefined;
  }
};

// Fetch conversation IDs
const fetchConversationIds = async () => {
  try {
    const response = await fetch('http://127.0.0.1:3000/api/conversations', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    const data = await response.json();
    return data.conversation_ids || [];
  } catch (error) {
    console.error('Error fetching conversation IDs:', error);
    return [];
  }
};

// Add a new conversation
const handleAddConversation = async (setInitialState: any) => {
  try {
    const response = await fetch('http://127.0.0.1:3000/api/chat/new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    const data = await response.json();
    message.success('会话创建成功');

    const newConversationIds = await fetchConversationIds();
    const newMenuItems = generateMenuItems(newConversationIds, setInitialState);
    setInitialState((prevState: any) => ({
      ...prevState,
      conversationIds: newConversationIds,
      menuItems: newMenuItems,
    }));
  } catch (error) {
    console.error('Error adding conversation:', error);
    message.error('会话创建失败');
  }
};

// Delete a conversation
const handleDeleteConversation = async (conversationId: number, setInitialState: any) => {
  try {
    await fetch(`http://127.0.0.1:3000/api/chat/${conversationId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    message.success('会话删除成功');

    const newConversationIds = await fetchConversationIds();
    const newMenuItems = generateMenuItems(newConversationIds, setInitialState);
    setInitialState((prevState: any) => ({
      ...prevState,
      conversationIds: newConversationIds,
      menuItems: newMenuItems,
    }));
  } catch (error) {
    console.error('Error deleting conversation:', error);
    message.error('会话删除失败');
  }
};

// Generate menu items
const generateMenuItems = (conversationIds: number[], setInitialState: any) => [
  {
    path: '/welcome',
    name: '欢迎',
    icon: <SmileOutlined />,
  },
  ...conversationIds.map((id) => ({
    path: `/chat/${id}`,
    name: `Chat ${id}`,
    icon: (
      <Tooltip title="删除会话">
        <DeleteOutlined onClick={() => handleDeleteConversation(id, setInitialState)} />
      </Tooltip>
    ),
  })),
  {
    path: '/chat/new',
    name: 'New Chat',
    icon: <PlusOutlined onClick={() => handleAddConversation(setInitialState)} />,
  },
];

// Get initial state
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
  conversationIds?: number[];
  menuItems?: any[];
  userChanged?: boolean;
}> {
  const { location } = history;

  if (location.pathname !== loginPath) {
    const [currentUser, conversationIds] = await Promise.all([
      fetchUserInfo(),
      fetchConversationIds(),
    ]);
    const menuItems = generateMenuItems(conversationIds, null); // 初始化时不需要传 setInitialState
    return {
      fetchUserInfo,
      currentUser,
      conversationIds,
      menuItems,
      settings: defaultSettings as Partial<LayoutSettings>,
      userChanged: false, // 初始化时用户未切换
    };
  }
  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
    userChanged: false, // 初始化时用户未切换
  };
}

// Layout configuration
import { useState } from 'react';

export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  const [menuKey, setMenuKey] = useState<number>(Date.now()); // 用于强制刷新菜单

  // 页面路径发生变化时触发
  const onPageChange = async () => {
    const { location } = history;

    // 如果未登录，跳转到登录页
    if (!initialState?.currentUser && location.pathname !== loginPath) {
      history.push(loginPath);
      return;
    }

    // 检查用户是否切换，如果切换用户则刷新用户相关数据
    const newUser = await fetchUserInfo();
    if (!initialState?.userChanged) {
      console.log('Checking user change...');
      if (newUser?.userid !== initialState?.currentUser?.userid) {
        console.log('User changed detected!');
        // 切换用户，重新加载会话数据
        const newConversationIds = await fetchConversationIds();
        const newMenuItems = generateMenuItems(newConversationIds, setInitialState);

        // 更新 initialState
        setInitialState((prevState) => ({
          ...prevState,
          currentUser: newUser,
          conversationIds: newConversationIds,
          menuItems: newMenuItems, // 更新菜单项
          userChanged: true, // 标记用户已切换
        }));

        // 强制刷新 Layout（菜单）
        setMenuKey(Date.now());
      }
    }
  };

  return {
    onPageChange,
    actionsRender: () => [
      <Button
        type="primary"
        style={{ width: '100px', textAlign: 'center', fontWeight: 'bold' }}
        onClick={() => history.push('/new-page')}
        key="new-page-button"
      >
        RAG
      </Button>,
      <Question key="doc" />,
      <SelectLang key="SelectLang" />,
    ],
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: <AvatarName />,
      render: (_, avatarChildren) => <AvatarDropdown>{avatarChildren}</AvatarDropdown>,
    },
    waterMarkProps: { content: initialState?.currentUser?.name },
    footerRender: () => <Footer />,
    menu: {
      params: initialState,
      locale: false,
      request: async () => initialState?.menuItems || [],
    },
    menuRender: (props, dom) => <div key={menuKey}>{dom}</div>, // 用 menuKey 重新渲染菜单
    ...initialState?.settings,
  };
};

export const request = { ...errorConfig };
