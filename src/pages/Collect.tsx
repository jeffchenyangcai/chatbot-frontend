import { Button, Card, List, Spin } from 'antd';
import React, { useEffect, useState } from 'react';

const Collect: React.FC = () => {
  const [collects, setCollects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 删除收藏的函数
  const handleDelete = (answerId: string) => {
    // TODO: 实现删除收藏的逻辑
    console.log(`删除收藏：${answerId}`);
  };

  useEffect(() => {
    console.log('开始读取collect');
    const fetchCollects = async () => {
      try {
        const response = await fetch('http://127.0.0.1:3000/api/collect', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
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

  return (
    <div>
      <h2>我的收藏</h2>
      {loading ? (
        <Spin size="large" />
      ) : (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={collects}
          renderItem={(item) => (
            <List.Item>
              <Card title={`收藏：${item.answerId}`}>
                <p>{item.content}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div></div> {/* 占位符，用于将按钮推到右边 */}
                  <Button
                    type="link"
                    style={{ color: 'red' }}
                    onClick={() => handleDelete(item.answerId)}
                  >
                    删除
                  </Button>
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default Collect;
