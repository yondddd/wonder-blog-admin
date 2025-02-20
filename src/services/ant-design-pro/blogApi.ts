import {request} from '@umijs/max';

/** 获取规则列表 GET /api/rule */
export async function rule(
  params: {
    /** 当前的页码 */
    pageNo?: number;
    /** 页面的容量 */
    pageSize?: number;
  },
  body: API.BlogPageParams,
  options?: { [key: string]: any },
) {
  return request<API.RuleList>('/api/blog/page', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
