import { CategoryListItem } from '@/services/types/blogType';
import { request } from '@umijs/max';
import { BASE_URL } from '@/services/ant-design-pro/api';

export async function listAllCategory(options?: { [key: string]: any }) {
  return request<API.Response<CategoryListItem>>(BASE_URL + '/category/listAll', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    ...(options || {}),
  });
}
