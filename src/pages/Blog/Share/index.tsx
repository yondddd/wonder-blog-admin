import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import LexicalEditor from '@/components/Editor';
import { getShareBlogByToken } from '@/services/ant-design-pro/blogApi';
import { history } from '@@/core/history';

export const layout = false;

const BlogShare: React.FC = () => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(history.location.search);
    const token = searchParams.get('token');

    if (!token) {
      setTitle('访问地址有误');
      return;
    }

    getShareBlogByToken(token)
      .then(res => {
        if (res.success && res.data) {
          setContent(res.data.content);
          setTitle(res.data.title);
        } else {
          setTitle(res.msg || '访问地址有误');
        }
      })
      .catch(error => {
        // 尝试从不同位置获取错误消息
        const errorMsg = error?.message || '访问地址有误';
        setTitle(errorMsg);
      });
  }, []);

  return (
    <PageContainer
      title={title}
      header={{ breadcrumb: {}, ghost: true }}
      ghost
      affixProps={{}}
      footer={[]}
    >
      <LexicalEditor
        initialContent={content}
        showTableOfContent={true}
        hideSettings={true}
        hideComments={true}
      />
    </PageContainer>
  );
};

export default BlogShare;
