import { Button, Card, List, Spin } from 'antd';
import React, { useEffect, useState } from 'react';

const Collect: React.FC = () => {
  const [collects, setCollects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log('开始读取collect');
    const fetchCollects = async () => {
      try {
        const response = await fetch('http://127.0.0.1:3000/api/collect', {
          method: 'GET', // 请求方法
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json', // 可选，取决于你的 API 需要的内容类型
          },
        });
        const data = await response.json();
        console.log('Fetched collects data:', data);
        const message_data = data['messages'];
        console.log('Fetched messages data:', message_data);
        setCollects(message_data);
      } catch (error) {
        console.error('Error fetching collects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollects();
  }, []);
  // //使用mock数据
  // useEffect(() => {
  //   // 模拟 API 请求
  //   setTimeout(() => {
  //     setCollects(collectMockData); // 使用 mock 数据
  //     setLoading(false);
  //   }, 1000); // 延迟1秒，模拟加载过程
  // }, []);

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
              <Card title={`收藏：${item.answerId}`}>
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
