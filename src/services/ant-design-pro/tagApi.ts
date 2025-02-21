import { request } from '@@/exports';

export async function listAllTag(options?: { [key: string]: any }) {
  return request<API.Response<API.TagListItem>>('/api/tag/listAll', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    ...(options || {}),
  });
}
