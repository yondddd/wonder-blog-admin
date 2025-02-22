import {request} from '@umijs/max';
import {BlogItem} from '@/services/ant-design-pro/types';

/** 获取规则列表 GET /api/rule */
export async function pageBlog(body: API.BlogPageParams, options?: { [key: string]: any }) {
  return request<API.PageResponse<API.RuleListResp>>('/api/blog/page', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function deleteBlogById(body: API.DelBlogReq, options?: { [key: string]: any }) {
  return request<API.BooleanResponse>('/api/blog/del', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function updateRecommend(
  body: API.RecommendBlogReq,
  options?: { [key: string]: any },
) {
  return request<API.BooleanResponse>('/api/blog/recommend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function updateTop(body: API.TopBlogReq, options?: { [key: string]: any }) {
  return request<API.BooleanResponse>('/api/blog/top', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function updateVisibility(
  body: API.VisibilityBlogReq,
  options?: { [key: string]: any },
) {
  return request<API.BooleanResponse>('/api/blog/visible', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function getBlogById(body: API.IdReq, options?: { [key: string]: any }) {
  return request<API.Response<BlogItem>>('/api/blog/detail', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function saveBlog(body: API.BlogSaveReq, options?: { [key: string]: any }) {
  return request<API.Response<number>>('/api/blog/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function updateBlog(body: API.BlogSaveReq, options?: { [key: string]: any }) {
  return request<API.Response<boolean>>('/api/blog/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
