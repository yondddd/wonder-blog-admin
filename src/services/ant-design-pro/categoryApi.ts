import { request } from '@@/exports';
import { CategoryListItem } from '@/services/ant-design-pro/types';

export async function listAllCategory(options?: { [key: string]: any }) {
  return request<API.Response<CategoryListItem>>('/api/category/listAll', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    ...(options || {}),
  });
}
