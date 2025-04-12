

export interface BlogItem {
  id?: number;
  title: string;
  content: string;
  firstPicture: string;
  description: string;
  published: boolean;
  password?: string;
  category: CategoryListItem;
  tags: TagListItem[];
  words: number;
  readTime?: number;
  appreciation?: boolean;
  recommend?: boolean;
  commentEnabled?: boolean;
  top?: boolean;
  views?: number;
}

export interface BlogListItem {
  id: number;
  category: {
    id: number;
    name: string;
  };
  userId: number;
  title: string;
  firstPicture?: string | null;
  content: string;
  description: string;
  published: boolean;
  recommend: boolean;
  appreciation: boolean;
  commentEnabled: boolean;
  top: boolean;
  createTime: string;
  updateTime: string;
  views: number;
  words: number;
  readTime: number;
  password?: string;
}
export interface BlogPageParams {
  pageNo?: number;
  pageSize?: number;
  categoryId?: number;
  tagId?: number;
  title?: string;
}

export interface BlogSaveReq {
  id?: number;
  title?: string;
  firstPicture?: string;
  content?: string;
  description?: string;
  published?: boolean;
  recommend?: boolean;
  appreciation?: boolean;
  commentEnabled?: boolean;
  top?: boolean;
  views?: number;
  words?: number;
  readTime?: number;
  password?: string;
  category?: CategoryListItem;
  tags?: TagListItem[];
}

export interface DelBlogReq {
  id?: number;
}

export interface RecommendBlogReq {
  id?: number;
  recommend?: boolean;
}

export interface TopBlogReq {
  id?: number;
  top?: boolean;
}

export interface VisibilityBlogReq {
  id?: number;
  appreciation?: boolean;
  recommend?: boolean;
  commentEnabled?: boolean;
  top?: boolean;
  published?: boolean;
  password?: string;
}

export enum VisibilityType {
  PUBLIC = 1,
  PRIVATE = 2,
  PASSWORD_PROTECTED = 3
}

export interface BlogVisibilityFormValues extends VisibilityBlogReq {
  radio: VisibilityType;
}

export interface TableParams {
  current?: number;
  pageSize?: number;
  [key: string]: any;
}

export interface VisibilityOption {
  value: VisibilityType;
  icon: React.ReactNode;
  label: string;
  color: string;
}

export interface BlogFeatureOption {
  name: string;
  label: string;
}

export interface BlogListState {
  selectedRows: BlogListItem[];
  categoryList: CategoryListItem[];
  tagList: TagListItem[];
  visible: boolean;
  currentBlog?: BlogListItem;
}

export interface TagListItem {
  id: number;
  name: string;
  color?: string;
}

export interface CategoryListItem {
  id: number;
  name: string;
}
