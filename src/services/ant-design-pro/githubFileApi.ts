import { LocalFileSpace } from '@/services/types/localFileType';

// 使用本地代理解决CORS问题
const GITHUB_API_URL = '/github';

// GitHub类型定义（内部使用，不修改现有类型）
interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  url: string;
}

interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  content?: string;
  encoding?: string;
}

/**
 * 从GitHub获取仓库列表
 */
export async function getGitHubRepos(token: string): Promise<GitHubRepo[]> {
  try {
    const response = await fetch(`${GITHUB_API_URL}/user/repos`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache, max-age=0'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`获取仓库列表失败: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('获取GitHub仓库失败:', error);
    throw error;
  }
}

/**
 * 获取特定用户或组织的GitHub仓库列表
 */
export async function getUserGitHubRepos(token: string, username: string): Promise<GitHubRepo[]> {
  try {
    const response = await fetch(`${GITHUB_API_URL}/users/${username}/repos`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache, max-age=0'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`获取用户仓库列表失败: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`获取用户 ${username} 的GitHub仓库失败:`, error);
    throw error;
  }
}

/**
 * 从GitHub获取目录内容或文件
 */
export async function getGitHubContents(
  token: string,
  owner: string,
  repo: string,
  path: string = ''
): Promise<GitHubContent[]> {
  try {
    // 移除路径开头的斜杠
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const apiUrl = `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${cleanPath}`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`获取内容失败: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error('获取GitHub内容失败:', error);
    throw error;
  }
}

/**
 * 在GitHub上创建文件
 */
export async function createGitHubFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string = 'Create file via API'
): Promise<any> {
  try {
    // Base64编码内容
    const base64Content = btoa(unescape(encodeURIComponent(content)));

    const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, max-age=0'
      },
      body: JSON.stringify({
        message,
        content: base64Content
      }),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`创建文件失败: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('创建GitHub文件失败:', error);
    throw error;
  }
}

/**
 * 在GitHub上创建文件夹（通过创建一个.gitkeep文件）
 */
export async function createGitHubFolder(
  token: string,
  owner: string,
  repo: string,
  path: string
): Promise<any> {
  // GitHub没有文件夹的概念，创建一个.gitkeep文件来模拟文件夹
  return createGitHubFile(
    token,
    owner,
    repo,
    `${path}/.gitkeep`,
    '',
    `Create folder ${path}`
  );
}

/**
 * 重命名GitHub上的文件/文件夹
 * GitHub API不直接支持重命名，需要先获取文件内容，然后删除旧文件，再创建新文件
 */
export async function renameGitHubFile(
  token: string,
  owner: string,
  repo: string,
  oldPath: string,
  newPath: string
): Promise<any> {
  try {
    // 获取文件内容
    const contentResponse = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${oldPath}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache, max-age=0'
      },
      cache: 'no-store'
    });

    if (!contentResponse.ok) {
      throw new Error(`获取文件内容失败: ${contentResponse.statusText}`);
    }

    const fileData = await contentResponse.json();

    // 如果是文件夹（实际上是获取文件列表）
    if (Array.isArray(fileData)) {
      throw new Error('不支持重命名文件夹');
    }

    // 创建新文件
    const createResponse = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${newPath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, max-age=0'
      },
      body: JSON.stringify({
        message: `Rename ${oldPath} to ${newPath}`,
        content: fileData.content,
      }),
      cache: 'no-store'
    });

    if (!createResponse.ok) {
      throw new Error(`创建新文件失败: ${createResponse.statusText}`);
    }

    // 删除旧文件
    const deleteResponse = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${oldPath}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, max-age=0'
      },
      body: JSON.stringify({
        message: `Rename ${oldPath} to ${newPath}`,
        sha: fileData.sha
      }),
      cache: 'no-store'
    });

    if (!deleteResponse.ok) {
      throw new Error(`删除旧文件失败: ${deleteResponse.statusText}`);
    }

    return await createResponse.json();
  } catch (error) {
    console.error('重命名GitHub文件失败:', error);
    throw error;
  }
}

/**
 * 将GitHub API数据转换为统一的LocalFileSpace格式
 */
export function convertGitHubContentToLocalFileSpace(content: GitHubContent): LocalFileSpace {
  return {
    folder: content.type === 'dir',
    name: content.name,
    url: content.download_url || '',
  };
}

/**
 * 将GitHub仓库转换为统一的LocalFileSpace格式
 */
export function convertGitHubRepoToLocalFileSpace(repo: GitHubRepo): LocalFileSpace {
  return {
    folder: true,
    name: repo.name,
    url: repo.html_url,
  };
}

/**
 * 解析GitHub路径，提取owner和repo
 * 示例: /owner/repo/path/to/file -> { owner: 'owner', repo: 'repo', path: 'path/to/file' }
 */
export function parseGitHubPath(path: string): { owner: string; repo: string; filePath: string } {
  // 删除开头的斜杠
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const parts = cleanPath.split('/');

  if (parts.length < 2) {
    return { owner: '', repo: '', filePath: '' };
  }

  const owner = parts[0];
  const repo = parts[1];
  const filePath = parts.slice(2).join('/');

  return { owner, repo, filePath };
}

/**
 * 检查仓库名是否是当前用户拥有的仓库
 * 如果是，返回仓库的详细信息；如果不是，抛出错误
 */
export async function checkIfOwnRepo(token: string, repoName: string): Promise<GitHubRepo | null> {
  try {
    // 获取当前用户的仓库列表
    const repos = await getGitHubRepos(token);

    // 查找是否有匹配的仓库
    const foundRepo = repos.find(repo => repo.name === repoName);

    return foundRepo || null;
  } catch (error) {
    console.error('检查仓库所有权失败:', error);
    return null;
  }
}

/**
 * 上传文件到GitHub仓库
 */
export async function uploadFileToGitHub(
  token: string,
  owner: string,
  repo: string,
  path: string,
  file: File,
  message: string = 'Upload file via API'
): Promise<any> {
  try {
    // 读取文件内容
    const fileContent = await file.arrayBuffer();
    // 转换为 Base64
    const base64Content = btoa(
      new Uint8Array(fileContent).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // 完整路径
    const fullPath = path ? `${path}/${file.name}` : file.name;

    // 调用API创建文件
    const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${fullPath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, max-age=0'
      },
      body: JSON.stringify({
        message,
        content: base64Content
      }),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`上传文件失败: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('上传文件到GitHub失败:', error);
    throw error;
  }
}

/**
 * 测试GitHub API连接状态
 * 用于诊断连接问题并提供解决方案
 */
export async function testGitHubApiConnection(token?: string): Promise<{
  status: 'success' | 'error';
  message: string;
  details?: any;
}> {
  try {
    // 测试GitHub API健康状态
    const response = await fetch(`${GITHUB_API_URL}/zen`, {
      headers: token ? {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      } : {
        'Accept': 'application/vnd.github.v3+json'
      },
      cache: 'no-store',
      // 短超时，快速返回结果
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      return {
        status: 'success',
        message: '连接GitHub API成功，网络正常'
      };
    } else {
      const errorText = await response.text();
      return {
        status: 'error',
        message: `连接GitHub API失败: ${response.status} ${response.statusText}`,
        details: {
          statusCode: response.status,
          statusText: response.statusText,
          responseText: errorText
        }
      };
    }
  } catch (error: any) {
    let troubleshootingSteps = '';

    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      troubleshootingSteps = `
可能的解决方案:
1. 检查网络连接是否正常
2. 确认GitHub服务是否可访问 (https://www.githubstatus.com/)
3. 检查是否存在浏览器CORS问题 (可能需要配置代理或使用浏览器扩展)
4. 检查防火墙或网络代理设置是否阻止了请求
5. 确认所用的GitHub Token是否有效且未过期
`;
    } else if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      troubleshootingSteps = `
可能的解决方案:
1. 检查网络连接速度和稳定性
2. 尝试稍后再次连接
3. 检查GitHub服务状态 (https://www.githubstatus.com/)
`;
    }

    return {
      status: 'error',
      message: `连接GitHub API失败: ${error.message}${troubleshootingSteps}`,
      details: error
    };
  }
}
