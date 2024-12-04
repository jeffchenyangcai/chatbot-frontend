import { Button, Card, List, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { collectMockData } from '../mock/collectMockData.ts'; // 引入 mock 数据

const Collect: React.FC = () => {
  const [collects, setCollects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // useEffect(() => {
  //   const fetchCollects = async () => {
  //     try {
  //       const response = await fetch('/api/collect');
  //       const data = await response.json();
  //       setCollects(data);
  //     } catch (error) {
  //       console.error('Error fetching collects:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //
  //   fetchCollects();
  // }, []);
  useEffect(() => {
    // 模拟 API 请求
    setTimeout(() => {
      setCollects(collectMockData); // 使用 mock 数据
      setLoading(false);
    }, 1000); // 延迟1秒，模拟加载过程
  }, []);

  return (
    <div>
      <h2>我的收藏</h2>
      {loading ? (
        <Spin size="large" /> // 显示加载中的 Spinner
      ) : (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={collects}
          renderItem={(item) => (
            <List.Item>
              <Card title={`回答：${item.answerId}`}>
                <p>{item.content}</p>
                <Button type="link">查看</Button>
                {/* 你可以在这里添加取消收藏按钮 */}
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default Collect;
