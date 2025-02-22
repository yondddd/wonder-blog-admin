import { request } from '@@/exports';
import { TagListItem } from '@/services/ant-design-pro/types';

export async function listAllTag(options?: { [key: string]: any }) {
  return request<API.Response<TagListItem>>('/api/tag/listAll', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    ...(options || {}),
  });
}
