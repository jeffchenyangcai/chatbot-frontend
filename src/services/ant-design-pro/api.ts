// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取指定会话的聊天记录 GET /api/chat/:conversationId */
export async function getChatMessages(conversationId: number, options?: { [key: string]: any }) {
  return request<{
    messages: {
      id: number;
      user: string;
      text: string;
      conversation_id: number;
      created_at: string;
      updated_at: string;
      user_id: number | null;
    }[];
  }>(`/api/chat/${conversationId}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取会话ID列表 GET /api/conversations */
export async function getConversations(): Promise<{ conversation_ids: string[] }> {
  // 模拟获取会话 ID 的 API 调用
  const response = await fetch('/api/conversations');
  const data = await response.json();
  return { conversation_ids: data.conversation_ids.map(String) };
}

/** 获取当前的用户 GET /api/currentUser */
export async function currentUser(options?: { [key: string]: any }) {
  return request<{
    data: API.CurrentUser;
  }>('/api/currentUser', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 退出登录接口 POST /api/login/outLogin */
export async function outLogin(options?: { [key: string]: any }) {
  return request<Record<string, any>>('http://127.0.0.1:3000/api/login/outLogin', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 注册接口 POST /api/register */
export async function register(body: API.RegisterParams, options?: { [key: string]: any }) {
  return request<API.RegisterResult>('http://127.0.0.1:3000/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 登录接口 POST /api/login/account */
export async function login(body: API.LoginParams, options?: { [key: string]: any }) {
  return request<API.LoginResult>('http://127.0.0.1:3000/api/login/account', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /api/notices */
export async function getNotices(options?: { [key: string]: any }) {
  return request<API.NoticeIconList>('/api/notices', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取规则列表 GET /api/rule */
export async function rule(
  params: {
    // query
    /** 当前的页码 */
    current?: number;
    /** 页面的容量 */
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.RuleList>('/api/rule', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 更新规则 PUT /api/rule */
export async function updateRule(options?: { [key: string]: any }) {
  return request<API.RuleListItem>('/api/rule', {
    method: 'POST',
    data: {
      method: 'update',
      ...(options || {}),
    },
  });
}

/** 新建规则 POST /api/rule */
export async function addRule(options?: { [key: string]: any }) {
  return request<API.RuleListItem>('/api/rule', {
    method: 'POST',
    data: {
      method: 'post',
      ...(options || {}),
    },
  });
}

/** 删除规则 DELETE /api/rule */
export async function removeRule(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/rule', {
    method: 'POST',
    data: {
      method: 'delete',
      ...(options || {}),
    },
  });
}
