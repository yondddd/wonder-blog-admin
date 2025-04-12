/**
 * 本地文件数据类型
 */
export interface LocalFileSpace {
  // 是否为文件夹
  folder: boolean;
  // 文件名称
  name: string;
  // 文件URL路径
  url: string;
}

export interface FileSpaceReq {
  path: string;
}

export interface UploadVO {
  // 文件名
  fileName: string;
  // 文件URL
  url: string;
}

