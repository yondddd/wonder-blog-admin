export type LoginParams = {
  username?: string;
  password?: string;
  type?: string;
};

export type LoginData = {
  token?: string;
  user?: CurrentUser;
};

export type CurrentUser = {
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
