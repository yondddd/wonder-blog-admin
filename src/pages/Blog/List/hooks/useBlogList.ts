import { useState, useCallback } from 'react';
import { message } from 'antd';
import type { ActionType } from '@ant-design/pro-components';
import type { BlogListItem, BlogVisibilityFormValues } from '@/services/types/blogType';
import { VisibilityType } from '@/services/types/blogType';
import type { CategoryListItem, TagListItem } from '@/services/types/blogType';
import {
  deleteBlogById,
  pageBlog,
  updateRecommend,
  updateTop,
  updateVisibility,
} from '@/services/ant-design-pro/blogApi';
import { listAllCategory } from '@/services/ant-design-pro/categoryApi';
import { listAllTag } from '@/services/ant-design-pro/tagApi';

/**
 * 通用API操作处理函数
 * @param apiCall API调用函数
 * @param successMessage 成功消息
 * @param errorMessage 失败消息
 * @param onSuccess 成功回调
 */
const handleApiRequest = async (
  apiCall: () => Promise<any>,
  successMessage: string,
  errorMessage: string,
  onSuccess?: () => void
) => {
  try {
    const response = await apiCall();
    console.log(`API调用成功:`, response);
    message.success(successMessage);
    console.log('准备执行成功回调');
    onSuccess?.();
    console.log('成功回调执行完成');
  } catch (error) {
    message.error(errorMessage);
    console.error(`${errorMessage}:`, error);
  }
};

export const useBlogList = (actionRef: React.RefObject<ActionType>) => {
  const [selectedRows, setSelectedRows] = useState<BlogListItem[]>([]);
  const [categoryList, setCategoryList] = useState<CategoryListItem[]>([]);
  const [tagList, setTagList] = useState<TagListItem[]>([]);
  const [visible, setVisible] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<BlogListItem>();

  const handleSetVisibleAndBlog = useCallback((blog: BlogListItem, isVisible: boolean) => {
    console.log('Setting currentBlog:', blog);
    console.log('Setting visible:', isVisible);
    setCurrentBlog(blog);
    setVisible(isVisible);
  }, []);

  const fetchInitialData = useCallback(async () => {
    try {
      const [categories, tags] = await Promise.all([listAllCategory(), listAllTag()]);
      setCategoryList((categories.data || []) as CategoryListItem[]);
      setTagList((tags.data || []) as TagListItem[]);
    } catch (error) {
      message.error('初始化数据加载失败');
      console.error('初始化数据加载失败:', error);
    }
  }, []);

  const handleSwitchChange = useCallback(
    async (type: 'top' | 'recommend', id: number, value: boolean) => {
      const api = type === 'top' ? updateTop : updateRecommend;
      await handleApiRequest(
        () => api({ id, [type]: value }),
        '状态更新成功',
        '状态更新失败',
        () => actionRef.current?.reload()
      );
    },
    [actionRef],
  );

  const handleVisibilitySubmit = useCallback(
    async (values: BlogVisibilityFormValues) => {
      const { radio: visibilityType, ...formValues } = values;
      const isPublished = visibilityType !== VisibilityType.PRIVATE;
      const needsPassword = visibilityType === VisibilityType.PASSWORD_PROTECTED;

      // 如果需要密码但未提供，提前结束
      if (needsPassword && !values.password) {
        message.error('密码保护模式必须设置密码');
        return;
      }

      const params = {
        id: currentBlog?.id,
        ...formValues,
        published: isPublished,
        password: needsPassword ? values.password : '',
      };

      await handleApiRequest(
        () => updateVisibility(params),
        '可见性设置更新成功',
        '可见性设置更新失败',
        () => {
          actionRef.current?.reload();
          setVisible(false);
        }
      );
    },
    [currentBlog?.id, actionRef],
  );

  const handleDelete = useCallback(
    async (id: number) => {
      await handleApiRequest(
        () => deleteBlogById({ id }),
        '文章删除成功',
        '文章删除失败',
        () => actionRef.current?.reload()
      );
    },
    [actionRef],
  );

  return {
    selectedRows,
    setSelectedRows,
    categoryList,
    tagList,
    visible,
    setVisible,
    currentBlog,
    setCurrentBlog,
    handleSetVisibleAndBlog,
    fetchInitialData,
    handleSwitchChange,
    handleVisibilitySubmit,
    handleDelete,
  };
};
