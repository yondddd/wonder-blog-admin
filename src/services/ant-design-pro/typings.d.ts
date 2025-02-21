// @ts-ignore
/* eslint-disable */

declare namespace API {
  type PageReq = {
    pageNo?: number;
    pageSize?: number;
  };

  type IdReq = {
    id?: number;
  };

  type Response<T> = {
    code?: number;
    data?: T;
    msg?: string;
    success?: boolean;
  };

  type PageResponse<T> = {
    code?: number;
    data?: T;
    msg?: string;
    success?: boolean;
    hasNext?: boolean;
    pageNo?: number;
    pageSize?: number;
    total?: number;
  };

  type BooleanResponse = {
    code?: number;
    data?: boolean;
    msg?: string;
    success?: boolean;
  };

  type CurrentUser = {
    name?: string;
    userid?: string;
    signature?: string;
    title?: string;
    group?: string;
    tags?: { key?: string; label?: string }[];
    notifyCount?: number;
    unreadCount?: number;
    country?: string;
    access?: string;
    geographic?: {
      province?: { label?: string; key?: string };
      city?: { label?: string; key?: string };
    };
    address?: string;
    phone?: string;
    // 上面是没用的
    avatar: string;
    createTime: string; // ISO 日期字符串
    email: string;
    guid: string;
    id: number;
    nickname: string;
    password: string | null;
    role: string;
    updateTime: string; // ISO 日期字符串
    username: string;
  };

  type LoginData = {
    token?: string;
    user?: CurrentUser;
  };

  type BlogListItem = {
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
  };


  type PageParams = {
    current?: number;
    pageSize?: number;
  };

  type BlogPageParams = PageReq & {
    categoryId?: number;
    tagId?: number;
    title?: string;
  };

  type CategoryListItem = {
    id: number;
    name: string;
  };

  type TagListItem = {
    id: number;
    name: string;
    color: string;
  };

  type BlogItem = {
    id?: number;
    category?: CategoryListItem;
    userId?: number;
    title?: string;
    firstPicture?: string;
    content?: string;
    description?: string;
    published?: boolean;
    recommend?: boolean;
    appreciation?: boolean;
    commentEnabled?: boolean;
    top?: boolean;
    createTime?: Date;
    updateTime?: Date;
    views?: number;
    words?: number;
    readTime?: number;
    password?: string;
    tags?: TagListItem[];
  };

  type BlogSaveReq = {
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
  };


  type RuleListItem = {
    key?: number;
    disabled?: boolean;
    href?: string;
    avatar?: string;
    name?: string;
    owner?: string;
    desc?: string;
    callNo?: number;
    status?: number;
    updatedAt?: string;
    createdAt?: string;
    progress?: number;
  };

  type RuleListResp = {
    data?: RuleListItem[];
    /** 列表的内容总数 */
    total?: number;
    success?: boolean;
  };

  type DelBlogReq = {
    id?: number;
  };

  type RecommendBlogReq = {
    id?: number;
    recommend?: boolean;
  };

  type TopBlogReq = {
    id?: number;
    top?: boolean;
  };

  type VisibilityBlogReq = {
    id?: number;
    appreciation?: boolean;
    recommend?: boolean;
    commentEnabled?: boolean;
    top?: boolean;
    published?: boolean;
    password?: string;
  };

  type BooleanResp = {
    data?: boolean;
    total?: number;
    success?: boolean;
  };

  type FakeCaptcha = {
    code?: number;
    status?: string;
  };

  type LoginParams = {
    username?: string;
    password?: string;
    type?: string;
  };

  type ErrorResponse = {
    /** 业务约定的错误码 */
    errorCode: string;
    /** 业务上的错误信息 */
    errorMessage?: string;
    /** 业务上的请求是否成功 */
    success?: boolean;
  };

  type NoticeIconList = {
    data?: NoticeIconItem[];
    /** 列表的内容总数 */
    total?: number;
    success?: boolean;
  };

  type NoticeIconItemType = 'notification' | 'message' | 'event';

  type NoticeIconItem = {
    id?: string;
    extra?: string;
    key?: string;
    read?: boolean;
    avatar?: string;
    title?: string;
    status?: string;
    datetime?: string;
    description?: string;
    type?: NoticeIconItemType;
  };
}
