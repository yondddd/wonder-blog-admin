import { request } from '@umijs/max';
import { BASE_URL } from '@/services/ant-design-pro/api';
import {
  FileSpaceReq,
  LocalFileSpace,
  UploadVO
} from '@/services/types/localFileType';

/**
 * 获取文件空间列表
 * @PostMapping("/space")
 */
export async function getFileSpace(body: FileSpaceReq, options?: { [key: string]: any }) {
  return request<API.Response<LocalFileSpace[]>>(BASE_URL + '/file/space', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/**
 * 上传文件
 * @RequestMapping("/upload")
 */
export async function uploadFile(file: File, filePath: string, options?: { [key: string]: any }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('filePath', filePath);

  return request<API.Response<UploadVO>>(BASE_URL + '/file/upload', {
    method: 'POST',
    data: formData,
    ...(options || {}),
  });
}

/**
 * 重命名文件
 * @RequestMapping("/rename")
 */
export async function renameFile(path: string, newName: string, options?: { [key: string]: any }) {
  const params = {
    path,
    newName,
  };

  return request<API.Response<boolean>>(BASE_URL + '/file/rename', {
    method: 'POST',
    params,
    ...(options || {}),
  });
}

/**
 * 新建文件夹
 * @RequestMapping("/newFolder")
 */
export async function createFolder(folderPath: string, options?: { [key: string]: any }) {
  const params = {
    folderPath,
  };

  return request<API.Response<boolean>>(BASE_URL + '/file/newFolder', {
    method: 'POST',
    params,
    ...(options || {}),
  });
}
