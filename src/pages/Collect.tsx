import { Button, Card, List, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { message } from 'antd';  // 导入 antd 的 message 组件
import ReactMarkdown from 'react-markdown';  // 导入 react-markdown 组件
import remarkGfm from 'remark-gfm';  // 导入 remark-gfm 插件

const Collect: React.FC = () => {
  const [collects, setCollects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 删除收藏的函数
  const handleDelete = (answerId: number) => {
    // 发送删除请求到后端
    console.log("要删除的回答id为", answerId);
    fetch(`http://127.0.0.1:3000/api/messages/${answerId}/delete`, {
      method: 'PATCH',  // 假设你使用的是 PATCH 请求
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ is_collected: 0 }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          message.success('回答已删除');
          // 更新前端数据，删除已删除的消息
          setCollects((prevCollects) =>
            prevCollects.filter((item) => item.answerId !== answerId)  // 从收藏列表中过滤掉已删除的消息
          );
        } else {
          message.error('删除失败');
        }
      })
      .catch((error) => {
        console.error('删除请求失败:', error);
        message.error('请求失败');
      });
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
              <Card title={`收藏：${item.collectId}`}>
                {item.content.includes('```') ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {item.content}
                  </ReactMarkdown>
                ) : (
                  <p>{item.content}</p>
                )}
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
