import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import LexicalEditor from '@/components/Editor';
import { getBlogById } from '@/services/ant-design-pro/blogApi';
import { history } from '@@/core/history';

const BlogPreview: React.FC = () => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    const blogId = history.location.pathname.split('/').pop();
    if (blogId) {
      getBlogById({ id: Number(blogId) }).then((res) => {
        if (res.success && res.data) {
          const blog = res.data;
          setContent(blog.content);
          setTitle(blog.title);
        }
      });
    }
  }, []);

  return (
    <PageContainer title={title}>
      <LexicalEditor initialContent={content} readOnly={false} />
    </PageContainer>
  );
};

export default BlogPreview;
