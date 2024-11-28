// app.tsx
import { AvatarDropdown, AvatarName, Footer, Question, SelectLang } from '@/components';
import { generateRoutes } from '@/dynamicRoutes';
import { getConversations, currentUser as queryCurrentUser } from '@/services/ant-design-pro/api';
import { LinkOutlined } from '@ant-design/icons';
import { SettingDrawer } from '@ant-design/pro-components';
import type { Settings as LayoutSettings } from '@ant-design/pro-layout';
import { history, Link, RunTimeLayoutConfig } from '@umijs/max';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import routes from '../config/routes'; // 引入静态路由配置

const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/user/login';

let dRoutes: { path: string; component: string }[] = [];

export function patchRoutes({ routes }) {
  // 打印当前路由
  console.log('Current routes:', routes);

  // 重新定义路由
  dRoutes.forEach(item => routes.push(item));

  // 打印更新后的路由
  console.log('Updated routes:', routes);
}

export async function render(oldRender: Function) {
  console.log('---render');

  try {
    console.log('Fetching conversations...');
    const response = await getConversations();
    const conversationIds = response.conversation_ids;
    console.log('Conversation IDs:', conversationIds);
    dRoutes = generateRoutes(conversationIds);
    console.log('Generated dynamic routes:', dRoutes);

    // 获取初始状态
    const initialState = await getInitialState();

    // 合并静态路由和动态路由
    const combinedRoutes = [ ...routes];
    console.log('Combined routes:', combinedRoutes);

    // 调用 patchRoutes 函数并传递合并后的路由
    patchRoutes({ routes: combinedRoutes });

    // 调用 oldRender 函数，触发应用的渲染
    console.log('Calling oldRender...');
    oldRender();
    console.log('oldRender called successfully');
  } catch (error) {
    console.error('Error fetching conversations:', error);
  }
}

export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
  dynamicRoutes?: any[];
  menuData?: any[];
  combinedRoutes?: any[];
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

  const fetchConversations = async () => {
    console.log('Fetching conversations...');
    const response = await getConversations();
    const conversationIds = response.conversation_ids;
    console.log('Conversation IDs:', conversationIds);
    const dynamicRoutes = generateRoutes(conversationIds);
    console.log('Generated dynamic routes:', dynamicRoutes);

    // 生成菜单数据
    const menuData = dynamicRoutes.map((route) => ({
      path: route.path,
      name: `Chat ${route.path.split('/').pop()}`,
    }));

    return { dynamicRoutes, menuData };
  };

  // 如果不是登录页面，执行
  const { location } = history;
  if (location.pathname !== loginPath) {
    const currentUser = await fetchUserInfo();
    const { dynamicRoutes, menuData } = await fetchConversations();
    const combinedRoutes = dynamicRoutes ? [...dynamicRoutes, ...routes] : routes;
    console.log('Combined routes:', combinedRoutes);

    return {
      fetchUserInfo,
      currentUser,
      settings: defaultSettings as Partial<LayoutSettings>,
      dynamicRoutes,
      menuData,
      combinedRoutes, // 添加合并后的路由
    };
  }
  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  console.log('Initial state:', initialState);
  console.log('Static routes:', routes);

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
      // 如果没有登录，重定向到 login
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
    links: isDev
      ? [
        <Link key="openapi" to="/umi/plugin/openapi" target="_blank">
          <LinkOutlined />
          <span>OpenAPI 文档</span>
        </Link>,
      ]
      : [],
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
    ...initialState?.settings,
    menuDataRender: () => {
      return [
        {
          path: '/welcome',
          name: '欢迎',
        },
        ...(initialState?.menuData || []),
      ];
    },
    route: {
      routes: initialState.combinedRoutes || routes, // 使用合并后的路由
    },
  };
};

export const request = {
  ...errorConfig,
};
