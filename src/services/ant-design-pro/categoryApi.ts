import { request } from '@@/exports';

export async function listAllCategory(options?: { [key: string]: any }) {
  return request<API.Response<API.CategoryListItem>>('/api/category/listAll', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    ...(options || {}),
  });
}
