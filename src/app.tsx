import { AvatarDropdown, AvatarName, Footer, Question, SelectLang } from '@/components';
import { currentUser as queryCurrentUser } from '@/services/ant-design-pro/api';
import { PlusOutlined, DeleteOutlined, SmileOutlined } from '@ant-design/icons'; // 引入 SmileOutlined 图标
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { history, Link } from '@umijs/max';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import { message, Tooltip } from 'antd'; // 引入 message 和 Tooltip 组件


const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/user/login';

export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
  conversationIds?: number[];
  menuItems?: any[];
}> {
  const fetchUserInfo = async () => {
    try {
      const msg = await queryCurrentUser({
        skipErrorHandler: true,
      });
      return msg.data;
    } catch (error) {
      history.push(loginPath);
    }
    return undefined;
  };

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

  const { location } = history;
  if (location.pathname !== loginPath) {
    const [currentUser, conversationIds] = await Promise.all([
      fetchUserInfo(),
      fetchConversationIds(),
    ]);
    const menuItems = [
      {
        path: '/welcome',
        name: '欢迎',
        icon: <SmileOutlined />, // 使用 SmileOutlined 图标
        component: './Welcome',
      },
      ...conversationIds.map((conversationId) => ({
        path: `/chat/${conversationId}`,
        name: `Chat ${conversationId}`,
        icon: (
          <Tooltip title="删除会话" placement="right">
            <DeleteOutlined onClick={() => handleDeleteConversation(conversationId)} />
          </Tooltip>
        ), // 添加删除按钮
      })),
    ];

    // 添加新增会话的菜单项
    menuItems.push({
      path: '/chat/new',
      name: 'New Chat',
      icon: <PlusOutlined />, // 使用加号图标
    });

    console.log('Menu items generated:', menuItems);
    return {
      fetchUserInfo,
      currentUser,
      conversationIds,
      menuItems,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }
  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

const handleDeleteConversation = async (conversationId: number) => {
  try {
    await fetch(`http://127.0.0.1:3000/api/chat/${conversationId}`, {
      method: 'DELETE',
    });
    message.success('会话删除成功'); // 删除成功提示
    // 删除成功后，重新获取会话列表并更新菜单项
    const newConversationIds = await fetchConversationIds();
    const newMenuItems = [
      {
        path: '/welcome',
        name: 'welcome',
        icon: <SmileOutlined />, // 使用 SmileOutlined 图标
        component: './Welcome',
      },
      ...newConversationIds.map((conversationId: number) => ({
        path: `/chat/${conversationId}`,
        name: `Chat ${conversationId}`,
        icon: (
          <Tooltip title="删除会话" placement="right">
            <DeleteOutlined onClick={() => handleDeleteConversation(conversationId)} />
          </Tooltip>
        ), // 添加删除按钮
      })),
    ];

    // 添加新增会话的菜单项
    newMenuItems.push({
      path: '/chat/new',
      name: 'New Chat',
      icon: <PlusOutlined />, // 使用加号图标
    });

    // 更新 initialState 中的 menuItems
    setInitialState((preInitialState) => ({
      ...preInitialState,
      conversationIds: newConversationIds,
      menuItems: newMenuItems,
    }));
  } catch (error) {
    console.error('Error deleting conversation:', error);
    message.error('会话删除失败'); // 删除失败提示
  }
};

export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  return {
    actionsRender: () => [<Question key="doc" />, <SelectLang key="SelectLang" />],
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: <AvatarName />,
      render: (_, avatarChildren) => {
        return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
      },
    },
    waterMarkProps: {
      content: initialState?.currentUser?.name,
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
    bgLayoutImgList: [
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
        left: 85,
        bottom: 100,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
        bottom: -68,
        right: -45,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
        bottom: 0,
        left: 0,
        width: '331px',
      },
    ],
    menuHeaderRender: undefined,
    childrenRender: (children) => {
      return (
        <>
          {children}
          {isDev && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings}
              onSettingChange={(settings) => {
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )}
        </>
      );
    },
    menu: {
      locale: false,
      request: async () => {
        console.log('Generating menu items...');
        console.log('Menu items:', initialState?.menuItems || []);
        return initialState?.menuItems || [];
      },
    },
    ...initialState?.settings,
  };
};

export const request = {
  ...errorConfig,
};
