import React from 'react';
import { EyeOutlined, EyeInvisibleOutlined, LockOutlined } from '@ant-design/icons';
import { VisibilityOption, BlogFeatureOption, VisibilityType } from '@/services/types/blogType';

export const VISIBILITY_OPTIONS: VisibilityOption[] = [
  { value: VisibilityType.PUBLIC, icon: React.createElement(EyeOutlined), label: '公开', color: '#52c41a' },
  { value: VisibilityType.PRIVATE, icon: React.createElement(EyeInvisibleOutlined), label: '私密', color: '#faad14' },
  { value: VisibilityType.PASSWORD_PROTECTED, icon: React.createElement(LockOutlined), label: '密码保护', color: '#1677ff' }
];

export const BLOG_FEATURE_OPTIONS: BlogFeatureOption[] = [
  { name: 'appreciation', label: '赞赏功能' },
  { name: 'recommend', label: '推荐文章' },
  { name: 'commentEnabled', label: '评论功能' },
  { name: 'top', label: '置顶文章' }
];
