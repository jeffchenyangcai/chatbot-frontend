// dynamicRoutes.js

export const generateRoutes = (conversationIds: any[]) => {
  return conversationIds.map((id) => {
    return {
      path: `/chat/${id}`,
      component: './Chat', // 假设 Chat 组件位于 src/pages/Chat.tsx
    };
  });
};
