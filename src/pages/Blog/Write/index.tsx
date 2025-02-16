import React from 'react';

import { PageContainer } from '@ant-design/pro-components'; // import Editor from 'src/components/Editor';
import Editor from '@/components/Editor';

const BlogWrite: React.FC = () => {
  return (
    <PageContainer>
      <Editor></Editor>
      <input style={{ width: '50%' }} placeholder="Write" />
      <h1>hello</h1>
    </PageContainer>
  );
};

export default BlogWrite;
