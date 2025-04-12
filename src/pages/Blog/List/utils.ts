import { BlogListItem, VisibilityType } from '@/services/types/blogType';
import { VISIBILITY_OPTIONS } from './constants';

/**
 * 确定博客条目的可见性类型
 */
export const getBlogVisibilityType = (blog: BlogListItem): VisibilityType => {
  if (!blog.published) return VisibilityType.PRIVATE;
  return blog.password ? VisibilityType.PASSWORD_PROTECTED : VisibilityType.PUBLIC;
};

/**
 * 根据类型获取可见性选项
 */
export const getVisibilityOption = (visibilityType: VisibilityType) => {
  return VISIBILITY_OPTIONS.find(option => option.value === visibilityType);
};
