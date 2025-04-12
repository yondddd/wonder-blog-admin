import { request } from '@umijs/max';
import { BASE_URL } from '@/services/ant-design-pro/api';
import {
  BlogPageParams,
  BlogListItem,
  DelBlogReq,
  RecommendBlogReq,
  TopBlogReq,
  VisibilityBlogReq,
  BlogItem,
  BlogSaveReq
} from '@/services/types/blogType';

/** 获取博客列表 POST /blog/page */
export async function pageBlog(body: BlogPageParams, options?: { [key: string]: any }) {
  return request<API.PageResponse<BlogListItem[]>>(BASE_URL + '/blog/page', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function deleteBlogById(body: DelBlogReq, options?: { [key: string]: any }) {
  return request<API.BooleanResponse>(BASE_URL + '/blog/del', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function updateRecommend(body: RecommendBlogReq, options?: { [key: string]: any }) {
  return request<API.BooleanResponse>(BASE_URL + '/blog/recommend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function updateTop(body: TopBlogReq, options?: { [key: string]: any }) {
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
  body: VisibilityBlogReq,
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

export async function getShareBlogByToken(token: string, options?: { [key: string]: any }) {
  return request<API.Response<BlogItem>>(BASE_URL + '/blog/share', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    params: {
      token,
    },
    ...(options || {}),
  });
}



export async function saveBlog(body: BlogSaveReq, options?: { [key: string]: any }) {
  return request<API.Response<number>>(BASE_URL + '/blog/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

export async function updateBlog(body: BlogSaveReq, options?: { [key: string]: any }) {
  return request<API.Response<boolean>>(BASE_URL + '/blog/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
