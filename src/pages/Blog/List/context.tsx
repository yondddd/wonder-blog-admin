import React, { createContext, useContext, ReactNode, useMemo, useEffect } from 'react';
import { useBlogList } from './hooks/useBlogList';
import type { ActionType } from '@ant-design/pro-components';
import type { BlogListItem, BlogVisibilityFormValues, BlogListState } from '@/services/types/blogType';

interface BlogContextProps extends BlogListState {
  handleSetVisibleAndBlog: (blog: BlogListItem, isVisible: boolean) => void;
  handleSwitchChange: (type: 'top' | 'recommend', id: number, value: boolean) => Promise<void>;
  handleVisibilitySubmit: (values: BlogVisibilityFormValues) => Promise<void>;
  handleDelete: (id: number) => Promise<void>;
  setSelectedRows: React.Dispatch<React.SetStateAction<BlogListItem[]>>;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  fetchInitialData: () => Promise<void>;
  actionRef: React.RefObject<ActionType>;
}

const BlogContext = createContext<BlogContextProps | null>(null);

export const useBlogContext = () => {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error('useBlogContext must be used within a BlogProvider');
  }
  return context;
};

interface BlogProviderProps {
  children: ReactNode;
  actionRef: React.RefObject<ActionType>;
}

export const BlogProvider: React.FC<BlogProviderProps> = ({ children, actionRef }) => {
  const blogHook = useBlogList(actionRef);

  // 在组件挂载时加载初始数据
  useEffect(() => {
    blogHook.fetchInitialData();
  }, [blogHook.fetchInitialData]);

  const contextValue = useMemo(() => ({
    ...blogHook,
    actionRef,
  }), [
    blogHook.selectedRows,
    blogHook.categoryList,
    blogHook.tagList,
    blogHook.visible,
    blogHook.currentBlog,
    blogHook.handleSetVisibleAndBlog,
    blogHook.handleSwitchChange,
    blogHook.handleVisibilitySubmit,
    blogHook.handleDelete,
    actionRef,
  ]);

  return (
    <BlogContext.Provider value={contextValue}>
      {children}
    </BlogContext.Provider>
  );
};
