import {BlogItem} from '@/services/ant-design-pro/types';
import {request} from '@umijs/max';
import {BASE_URL} from '@/services/ant-design-pro/api';

/** 获取规则列表 GET /api/rule */
export async function pageBlog(body: API.BlogPageParams, options?: { [key: string]: any }) {
  return request<API.PageResponse<API.RuleListResp>>(BASE_URL + '/blog/page', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function deleteBlogById(body: API.DelBlogReq, options?: { [key: string]: any }) {
  return request<API.BooleanResponse>(BASE_URL + '/blog/del', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function updateRecommend(body: API.RecommendBlogReq, options?: { [key: string]: any }) {
  return request<API.BooleanResponse>(BASE_URL + '/blog/recommend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function updateTop(body: API.TopBlogReq, options?: { [key: string]: any }) {
  return request<API.BooleanResponse>(BASE_URL + '/blog/top', {
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
  return request<API.BooleanResponse>(BASE_URL + '/blog/visible', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function getBlogById(body: API.IdReq, options?: { [key: string]: any }) {
  return request<API.Response<BlogItem>>(BASE_URL + '/blog/detail', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function saveBlog(body: API.BlogSaveReq, options?: { [key: string]: any }) {
  return request<API.Response<number>>(BASE_URL + '/blog/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function updateBlog(body: API.BlogSaveReq, options?: { [key: string]: any }) {
  return request<API.Response<boolean>>(BASE_URL + '/blog/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
