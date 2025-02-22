// First, let's create the missing types file
export interface TagListItem {
  id: number;
  name: string;
}

export interface CategoryListItem {
  id: number;
  name: string;
}

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
