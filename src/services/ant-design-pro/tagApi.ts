import { request } from '@umijs/max';
import { BASE_URL } from '@/services/ant-design-pro/api';
import { TagListItem } from '@/services/types/blogType';

export async function listAllTag(options?: { [key: string]: any }) {
  return request<API.Response<TagListItem>>(BASE_URL + '/tag/listAll', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    ...(options || {}),
  });
}
