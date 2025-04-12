import React, { useState, useEffect, useCallback, useRef, ChangeEvent, KeyboardEvent, MouseEvent } from 'react';
import {
  PageContainer,
} from '@ant-design/pro-components';
import {
  Button,
  Modal,
  Input,
  message,
  Space,
  Breadcrumb,
  Upload,
  Tooltip,
  Card,
  Typography,
  Row,
  Col,
  Divider,
  Menu,
  Empty,
  Spin,
  Select,
} from 'antd';
import {
  FolderOutlined,
  FileOutlined,
  FolderAddOutlined,
  UploadOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
  FileAddOutlined,
  ReloadOutlined,
  CopyOutlined,
  GithubOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import {
  getFileSpace,
  createFolder,
  renameFile,
  uploadFile,
} from '@/services/ant-design-pro/localFileApi';
import {
  getGitHubRepos,
  getGitHubContents,
  createGitHubFolder,
  renameGitHubFile,
  convertGitHubRepoToLocalFileSpace,
  convertGitHubContentToLocalFileSpace,
  parseGitHubPath,
  getUserGitHubRepos,
  checkIfOwnRepo,
  uploadFileToGitHub,
} from '@/services/ant-design-pro/githubFileApi';
import { LocalFileSpace, UploadVO } from '@/services/types/localFileType';
import { BASE_URL } from '@/services/ant-design-pro/api';

// 定义一个通用的API响应类型，用于类型断言
interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  code?: number;
}

const { Text, Title } = Typography;
const { Option } = Select;

// 存储类型枚举
enum StorageType {
  LOCAL = 'local',
  GITHUB = 'github',
}

// Custom function to handle GitHub path parsing
const parseGitHubPathForNavigation = (currentPath: string) => {
  const parts = currentPath.split('/').filter(Boolean);

  if (parts.length < 1) {
    return { owner: '', repo: '', filePath: '' };
  }

  // 第一个部分是用户名或组织名
  const owner = parts[0];

  // 如果只有用户/组织名
  if (parts.length === 1) {
    return { owner, repo: '', filePath: '' };
  }

  // 第二个部分是仓库名
  const repo = parts[1];

  // 如果有路径部分，解析它
  if (parts.length > 2) {
    const filePath = parts.slice(2).join('/');
    return { owner, repo, filePath };
  }

  // 只有用户和仓库
  return { owner, repo, filePath: '' };
};

// Function to check if a path includes a valid GitHub repo
const isValidGitHubRepoPath = (path: string): boolean => {
  const { owner, repo } = parseGitHubPathForNavigation(path);
  return Boolean(owner && repo);
};

// Custom hook for file operations
const useFileOperations = (currentPath: string, refreshFiles: (path: string) => void) => {
  const [loading, setLoading] = useState<boolean>(false);
  const uploadRef = useRef<HTMLInputElement>(null);

  // 创建文件夹
  const handleCreateFolder = async (folderName: string): Promise<boolean> => {
    if (!folderName.trim()) {
      message.error('名称不能为空');
      return false;
    }

    setLoading(true);
    try {
      const newFolderPath = currentPath === '/' ? `/${folderName}` : `${currentPath}/${folderName}`;
      const res = await createFolder(newFolderPath);
      const apiRes = res as unknown as ApiResponse<boolean>;

      if (apiRes.success) {
        message.success('文件夹创建成功');
        refreshFiles(currentPath);
        return true;
      } else {
        message.error(apiRes.message || '创建文件夹失败');
        return false;
      }
    } catch (error) {
      message.error('操作时发生错误');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 重命名文件/文件夹
  const handleRename = async (item: LocalFileSpace, newName: string): Promise<boolean> => {
    if (!newName.trim() || newName === item.name) {
      return false;
    }

    setLoading(true);
    try {
      const oldPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
      const res = await renameFile(oldPath, newName.trim());
      const apiRes = res as unknown as ApiResponse<boolean>;

      if (apiRes.success) {
        message.success('重命名成功');
        refreshFiles(currentPath);
        return true;
      } else {
        message.error(apiRes.message || '重命名失败');
        return false;
      }
    } catch (error) {
      message.error('操作时发生错误');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 文件上传
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;
    const file = fileInput.files?.[0];

    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const fullPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      formData.append('filePath', fullPath);

      const response = await fetch(`${BASE_URL}/file/upload`, {
        method: 'POST',
        headers: {
          Authorization: localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        message.success(`${file.name} 上传成功`);
        refreshFiles(currentPath);
      } else {
        message.error(result.message || `${file.name} 上传失败`);
      }
    } catch (error) {
      message.error('上传出错');
      console.error('上传错误:', error);
    } finally {
      setLoading(false);
      fileInput.value = '';
    }
  };

  // 触发文件选择对话框
  const triggerUpload = () => {
    if (uploadRef.current) {
      uploadRef.current.click();
    }
  };

  return {
    loading,
    uploadRef,
    handleCreateFolder,
    handleRename,
    handleFileUpload,
    triggerUpload,
  };
};

// Custom hook for modal management
const useModalManagement = () => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'rename' | 'newFolder' | 'githubToken' | null>(null);
  const [selectedItem, setSelectedItem] = useState<LocalFileSpace | null>(null);
  const [inputValue, setInputValue] = useState<string>('');

  const showModal = (type: 'rename' | 'newFolder' | 'githubToken', item?: LocalFileSpace) => {
    setModalType(type);
    if (type === 'rename' && item) {
      setSelectedItem(item);
      setInputValue(item.name);
    } else {
      setSelectedItem(null);
      setInputValue('');
    }
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setInputValue('');
    setSelectedItem(null);
    setModalType(null);
  };

  return {
    isModalVisible,
    modalType,
    selectedItem,
    inputValue,
    setInputValue,
    showModal,
    closeModal,
  };
};

// Custom hook for context menu
const useContextMenu = () => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [record, setRecord] = useState<LocalFileSpace | null>(null);

  const showMenu = (e: React.MouseEvent, item?: LocalFileSpace) => {
    e.preventDefault();
    setRecord(item || null);
    setPosition({ x: e.clientX, y: e.clientY });
  };

  const closeMenu = () => {
    setPosition(null);
    setRecord(null);
  };

  // Global click event to close context menu
  useEffect(() => {
    const handleClickOutside = () => closeMenu();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return {
    position,
    record,
    showMenu,
    closeMenu,
  };
};

// Custom hook for inline editing
const useInlineEditing = (handleRename: (item: LocalFileSpace, newName: string) => Promise<boolean>) => {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const startEditing = (item: LocalFileSpace, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const itemKey = item.name + (item.folder ? '_dir' : '_file');
    setEditingItem(itemKey);
    setEditingValue(item.name);

    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 0);
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>, item: LocalFileSpace) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit(item);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingItem(null);
    }
  };

  const saveEdit = async (item: LocalFileSpace) => {
    if (!editingValue.trim() || editingValue === item.name) {
      setEditingItem(null);
      return;
    }

    const success = await handleRename(item, editingValue);
    if (!success) {
      // If rename failed, keep editing state
      if (editInputRef.current) {
        editInputRef.current.focus();
      }
    } else {
      setEditingItem(null);
    }
  };

  return {
    editingItem,
    editingValue,
    editInputRef,
    setEditingValue,
    setEditingItem,
    startEditing,
    handleEditKeyDown,
    saveEdit,
  };
};

// Custom hook for GitHub operations
const useGitHubOperations = (currentPath: string, refreshFiles: (path: string) => void) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [token, setToken] = useState<string>(() => localStorage.getItem('github_token') || '');
  const [showTokenInput, setShowTokenInput] = useState<boolean>(false);
  const uploadRef = useRef<HTMLInputElement>(null);

  // 保存GitHub Token
  const saveToken = (newToken: string) => {
    localStorage.setItem('github_token', newToken);
    setToken(newToken);
    setShowTokenInput(false);
    message.success('GitHub Token已保存');
  };

  // 检查Token是否有效
  const checkToken = async (): Promise<boolean> => {
    if (!token) {
      setShowTokenInput(true);
      return false;
    }

    setLoading(true);
    try {
      await getGitHubRepos(token);
      return true;
    } catch (error) {
      console.error('GitHub token无效:', error);
      message.error('GitHub Token无效，请重新输入');
      setShowTokenInput(true);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 创建GitHub文件夹
  const handleCreateGitHubFolder = async (folderName: string): Promise<boolean> => {
    if (!folderName.trim()) {
      message.error('名称不能为空');
      return false;
    }

    const isTokenValid = await checkToken();
    if (!isTokenValid) return false;

    setLoading(true);
    try {
      const { owner, repo, filePath } = parseGitHubPathForNavigation(currentPath);

      // 如果是根目录，无法创建文件夹
      if (!owner || !repo) {
        message.error('需要在特定仓库内才能创建文件夹');
        return false;
      }

      // 构建新文件夹路径
      const newFolderPath = filePath ? `${filePath}/${folderName}` : folderName;

      await createGitHubFolder(token, owner, repo, newFolderPath);
      message.success('文件夹创建成功');
      refreshFiles(currentPath);
      return true;
    } catch (error) {
      console.error('创建GitHub文件夹失败:', error);
      message.error('创建文件夹失败');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 重命名GitHub文件/文件夹
  const handleRenameGitHub = async (item: LocalFileSpace, newName: string): Promise<boolean> => {
    if (!newName.trim() || newName === item.name) {
      return false;
    }

    const isTokenValid = await checkToken();
    if (!isTokenValid) return false;

    setLoading(true);
    try {
      const { owner, repo, filePath } = parseGitHubPathForNavigation(currentPath);

      if (!owner || !repo) {
        message.error('需要在特定仓库内才能重命名文件/文件夹');
        return false;
      }

      // 构建旧路径和新路径
      const oldPath = filePath ? `${filePath}/${item.name}` : item.name;
      const newPath = filePath ? `${filePath}/${newName}` : newName;

      await renameGitHubFile(token, owner, repo, oldPath, newPath);
      message.success('重命名成功');
      refreshFiles(currentPath);
      return true;
    } catch (error) {
      console.error('重命名GitHub文件失败:', error);
      message.error('重命名失败');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 上传文件到GitHub
  const handleGitHubFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;
    const file = fileInput.files?.[0];

    if (!file) return;

    const isTokenValid = await checkToken();
    if (!isTokenValid) return;

    try {
      setLoading(true);
      const { owner, repo, filePath } = parseGitHubPathForNavigation(currentPath);

      // 检查是否在有效的仓库路径中
      if (!owner || !repo) {
        message.error('需要在特定仓库内才能上传文件');
        return;
      }

      // 上传文件到GitHub
      await uploadFileToGitHub(token, owner, repo, filePath, file, `Upload ${file.name} via Admin UI`);

      message.success(`${file.name} 上传成功`);
      refreshFiles(currentPath);
    } catch (error) {
      console.error('GitHub文件上传错误:', error);
      message.error('文件上传失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
      fileInput.value = '';
    }
  };

  // 触发文件选择对话框
  const triggerGitHubUpload = () => {
    if (uploadRef.current) {
      uploadRef.current.click();
    }
  };

  return {
    loading,
    token,
    showTokenInput,
    setShowTokenInput,
    saveToken,
    checkToken,
    handleCreateGitHubFolder,
    handleRenameGitHub,
    handleGitHubFileUpload,
    uploadRef,
    triggerGitHubUpload,
  };
};

const LocalFileManager: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [dataSource, setDataSource] = useState<LocalFileSpace[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [storageType, setStorageType] = useState<StorageType>(StorageType.LOCAL);

  // Initialize GitHub operations first to get the token
  const {
    loading: githubLoading,
    token: githubToken,
    showTokenInput: showGitHubTokenInput,
    setShowTokenInput: setShowGitHubTokenInput,
    saveToken: saveGitHubToken,
    checkToken: checkGitHubToken,
    handleCreateGitHubFolder,
    handleRenameGitHub,
    handleGitHubFileUpload,
    uploadRef,
    triggerGitHubUpload,
  } = useGitHubOperations(currentPath, () => fetchFiles(currentPath));

  // Fetch files from API
  const fetchFiles = useCallback(async (path: string) => {
    setIsLoading(true);
    try {
      if (storageType === StorageType.LOCAL) {
        // 本地文件逻辑
        const res = await getFileSpace({ path });
        const apiRes = res as unknown as ApiResponse<LocalFileSpace[]>;

        if (apiRes.success === true && Array.isArray(apiRes.data)) {
          // Sort: folders first, then alphabetically
          const sortedData = apiRes.data.sort((a, b) => {
            if (a.folder && !b.folder) return -1;
            if (!a.folder && b.folder) return 1;
            return a.name.localeCompare(b.name);
          });
          setDataSource(sortedData);
        } else {
          message.error(apiRes.message || '加载文件列表失败');
          setDataSource([]);
        }
      } else {
        // GitHub文件逻辑
        if (!githubToken) {
          setShowGitHubTokenInput(true);
          setDataSource([]);
          return;
        }

        try {
          if (path === '/') {
            // 获取仓库列表
            const repos = await getGitHubRepos(githubToken);
            const formattedRepos = repos.map(repo => convertGitHubRepoToLocalFileSpace(repo));
            setDataSource(formattedRepos);
          } else {
            // 获取仓库内容
            const { owner, repo, filePath } = parseGitHubPathForNavigation(path);

            console.log('GitHub路径解析:', { path, owner, repo, filePath });

            // 检查是否有有效的仓库路径
            if (!owner) {
              message.error('无效的GitHub路径：缺少用户名或组织名');
              setDataSource([]);
              return;
            }

            // 检查是从仓库列表中点击的是仓库
            if (!repo) {
              // 首先检查是否为当前用户自己的仓库
              const ownRepo = await checkIfOwnRepo(githubToken, owner);

              if (ownRepo) {
                // 如果是自己的仓库，直接获取内容
                console.log('发现当前登录用户的仓库:', ownRepo.name);
                const contents = await getGitHubContents(githubToken, ownRepo.full_name.split('/')[0], ownRepo.name, '');
                const formattedContents = contents.map(content =>
                  convertGitHubContentToLocalFileSpace(content)
                );
                const sortedData = formattedContents.sort((a, b) => {
                  if (a.folder && !b.folder) return -1;
                  if (!a.folder && b.folder) return 1;
                  return a.name.localeCompare(b.name);
                });
                setDataSource(sortedData);
                return;
              }

              // 如果不是自己的仓库，尝试获取该用户的仓库列表
              try {
                console.log('尝试获取用户的仓库列表:', owner);
                const userRepos = await getUserGitHubRepos(githubToken, owner);
                const formattedRepos = userRepos.map(repo => convertGitHubRepoToLocalFileSpace(repo));
                setDataSource(formattedRepos);
                return;
              } catch (userError) {
                console.error('获取用户仓库失败:', userError);
                message.error('无法获取该用户的仓库');
                setDataSource([]);
                return;
              }
            }

            // 有用户名和仓库名，获取仓库内容
            try {
              console.log('获取仓库内容:', { owner, repo, filePath });
              const contents = await getGitHubContents(githubToken, owner, repo, filePath);
              const formattedContents = contents.map(content =>
                convertGitHubContentToLocalFileSpace(content)
              );
              // 对内容进行排序：文件夹在前，文件在后
              const sortedData = formattedContents.sort((a, b) => {
                if (a.folder && !b.folder) return -1;
                if (!a.folder && b.folder) return 1;
                return a.name.localeCompare(b.name);
              });
              setDataSource(sortedData);
            } catch (error) {
              console.error('获取仓库内容失败:', error);

              // 如果是 404 错误，可能是因为路径不存在，尝试看看是否有同名用户
              try {
                console.log('尝试作为用户名查找:', owner);
                const userRepos = await getUserGitHubRepos(githubToken, owner);
                if (userRepos && userRepos.length > 0) {
                  // 找到了同名用户，显示他的仓库列表
                  const formattedRepos = userRepos.map(repo => convertGitHubRepoToLocalFileSpace(repo));
                  setDataSource(formattedRepos);
                  message.info(`已切换到用户 "${owner}" 的仓库列表`);
                  // 更新当前路径以反映我们实际上在用户仓库列表中
                  setCurrentPath(`/${owner}`);
                  return;
                }
              } catch (userError) {
                // 静默忽略这个错误，回落到下面的通用错误消息
              }

              message.error('无法获取仓库内容，请检查路径是否正确');
              setDataSource([]);
            }
          }
        } catch (error) {
          console.error('GitHub API 错误:', error);
          message.error('GitHub访问失败，请检查您的Token');
          setShowGitHubTokenInput(true);
          setDataSource([]);
        }
      }
    } catch (error) {
      console.error('获取文件列表失败:', error);
      message.error('请求文件列表时出错');
      setDataSource([]);
    } finally {
      setIsLoading(false);
    }
  }, [storageType, githubToken, setShowGitHubTokenInput]);

  // Update fetchFiles dependencies
  useEffect(() => {
    // This updates the fetchFiles closure with the latest values
    fetchFiles(currentPath);
  }, [currentPath, fetchFiles, storageType, githubToken]);

  // 切换存储类型时重置路径
  useEffect(() => {
    setCurrentPath('/');
  }, [storageType]);

  // Initialize other hooks
  const {
    loading: operationLoading,
    uploadRef: localUploadRef,
    handleCreateFolder,
    handleRename,
    handleFileUpload,
    triggerUpload,
  } = useFileOperations(currentPath, fetchFiles);

  const {
    isModalVisible,
    modalType,
    selectedItem,
    inputValue,
    setInputValue,
    showModal,
    closeModal,
  } = useModalManagement();

  const {
    position: contextMenuPosition,
    record: contextMenuRecord,
    showMenu: showContextMenu,
    closeMenu: closeContextMenu,
  } = useContextMenu();

  const {
    editingItem,
    editingValue,
    editInputRef,
    setEditingValue,
    setEditingItem,
    startEditing,
    handleEditKeyDown,
    saveEdit,
  } = useInlineEditing(
    storageType === StorageType.LOCAL ? handleRename : handleRenameGitHub
  );

  // Document click handler for saving inline edits
  useEffect(() => {
    const handleDocumentClick = (e: globalThis.MouseEvent) => {
      if (editingItem && editInputRef.current && !editInputRef.current.contains(e.target as Node)) {
        const [name, type] = editingItem.split('_');
        const itemToSave = dataSource.find(item =>
          item.name === name &&
          (type === 'dir' ? item.folder : !item.folder)
        );

        if (itemToSave) {
          saveEdit(itemToSave);
        } else {
          setEditingItem(null);
        }
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [editingItem, dataSource, saveEdit, setEditingItem]);

  // Navigation functions
  const handleNavigate = (item: LocalFileSpace) => {
    if (item.folder) {
      let newPath;

      if (storageType === StorageType.GITHUB) {
        if (currentPath === '/') {
          // 在GitHub模式下，从根目录点击仓库或用户
          const itemIsRepo = item.url && item.url.includes('github.com/') && item.url.split('/').length >= 5;

          if (itemIsRepo) {
            // 这是一个仓库，获取仓库拥有者和名称
            const urlParts = item.url.split('/');
            const ownerIndex = urlParts.indexOf('github.com') + 1;
            if (ownerIndex > 0 && ownerIndex < urlParts.length) {
              const owner = urlParts[ownerIndex];
              const repo = urlParts[ownerIndex + 1];
              // 设置路径为 /owner/repo 格式
              newPath = `/${owner}/${repo}`;
              console.log('导航到GitHub仓库:', { owner, repo, newPath });
            } else {
              // 如果无法解析URL，退回到简单模式
              newPath = `/${item.name}`;
            }
          } else {
            // 假设这是一个用户/组织
            newPath = `/${item.name}`;
          }
        } else {
          // 检查当前路径是否已包含用户名但没有仓库名
          const { owner, repo } = parseGitHubPathForNavigation(currentPath);

          if (owner && !repo) {
            // 这是从用户仓库列表中选择仓库的情况
            newPath = `/${owner}/${item.name}`;
          } else {
            // 正常导航到子目录
            newPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
          }
        }
      } else {
        // 本地存储的路径处理不变
        newPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
      }

      // 设置新路径并输出日志以便调试
      console.log('导航到新路径:', newPath);
      setCurrentPath(newPath);
    } else if (item.url) {
      // 对于文件，打开下载链接
      const downloadLink = document.createElement('a');
      downloadLink.href = item.url;
      downloadLink.target = '_blank';
      downloadLink.download = item.name;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      message.success(`正在下载: ${item.name}`);
    } else {
      message.info(`文件: ${item.name} 没有可用的下载链接`);
    }
  };

  const handleGoBack = () => {
    if (currentPath !== '/') {
      if (storageType === StorageType.LOCAL) {
        // 本地文件系统的返回逻辑不变
        const pathParts = currentPath.split('/').filter(Boolean);
        pathParts.pop();
        setCurrentPath(pathParts.length > 0 ? `/${pathParts.join('/')}` : '/');
      } else {
        // GitHub的返回逻辑需要处理owner/repo的特殊情况
        const pathParts = currentPath.split('/').filter(Boolean);

        // 如果只有两部分(owner/repo)或更少，直接返回根目录
        if (pathParts.length <= 2) {
          setCurrentPath('/');
        } else {
          // 否则去掉最后一部分
          pathParts.pop();
          setCurrentPath(`/${pathParts.join('/')}`);
        }
      }
    }
  };

  // Modal action handlers
  const handleModalOk = async () => {
    if (!inputValue.trim() && modalType !== 'githubToken') {
      message.error('名称不能为空');
      return;
    }

    let success = false;

    if (modalType === 'rename' && selectedItem) {
      if (storageType === StorageType.LOCAL) {
        success = await handleRename(selectedItem, inputValue);
      } else {
        success = await handleRenameGitHub(selectedItem, inputValue);
      }
    } else if (modalType === 'newFolder') {
      if (storageType === StorageType.LOCAL) {
        success = await handleCreateFolder(inputValue);
      } else {
        success = await handleCreateGitHubFolder(inputValue);
      }
    } else if (modalType === 'githubToken') {
      try {
        if (inputValue.trim()) {
          saveGitHubToken(inputValue);
          message.success('GitHub Token已保存');
        } else {
          // 清除Token
          saveGitHubToken('');
          message.success('GitHub Token已清除');
          setStorageType(StorageType.LOCAL);
        }
        success = true;
        // 刷新文件列表
        fetchFiles(currentPath);
      } catch (error) {
        message.error('保存GitHub Token失败');
      }
    }

    if (success) {
      closeModal();
    }
  };

  // Context menu items and handlers
  const getContextMenuItems = () => {
    const baseMenuItems = [
      {
        key: 'refresh',
        label: '刷新',
        icon: <ReloadOutlined />,
      }
    ];

    if (currentPath !== '/') {
      baseMenuItems.push({
        key: 'goBack',
        label: '返回上一级',
        icon: <ArrowLeftOutlined />,
      });
    }

    // 在GitHub模式下，根目录不能创建文件夹
    if (!(storageType === StorageType.GITHUB && currentPath === '/')) {
      baseMenuItems.push({
        key: 'newFolder',
        label: '新建文件夹',
        icon: <FolderAddOutlined />,
      });
    }

    // 上传文件选项，但GitHub模式需要在仓库内部
    if (storageType === StorageType.LOCAL || (storageType === StorageType.GITHUB && isValidGitHubRepoPath(currentPath))) {
      baseMenuItems.push({
        key: 'upload',
        label: '上传文件',
        icon: <UploadOutlined />,
      });
    }

    if (contextMenuRecord) {
      const itemSpecificItems = [
        {
          key: 'rename',
          label: '重命名',
          icon: <EditOutlined />,
        }
      ];

      // 如果是文件类型且有URL，添加复制URL选项
      if (!contextMenuRecord.folder && contextMenuRecord.url) {
        itemSpecificItems.push({
          key: 'copyUrl',
          label: '复制URL',
          icon: <CopyOutlined />,
        });
      }

      return [
        ...itemSpecificItems,
        ...baseMenuItems,
      ];
    }

    return baseMenuItems;
  };

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    closeContextMenu();

    switch (key) {
      case 'rename':
        if (contextMenuRecord) {
          showModal('rename', contextMenuRecord);
        }
        break;
      case 'copyUrl':
        if (contextMenuRecord && !contextMenuRecord.folder && contextMenuRecord.url) {
          navigator.clipboard.writeText(contextMenuRecord.url)
            .then(() => {
              message.success('URL已复制到剪贴板');
            })
            .catch(() => {
              message.error('复制URL失败');
            });
        }
        break;
      case 'newFolder':
        showModal('newFolder');
        break;
      case 'upload':
        if (storageType === StorageType.LOCAL) {
          if (localUploadRef.current) {
            localUploadRef.current.click();
          }
        } else {
          if (uploadRef.current) {
            uploadRef.current.click();
          }
        }
        break;
      case 'refresh':
        fetchFiles(currentPath);
        break;
      case 'goBack':
        handleGoBack();
        break;
      default:
        break;
    }
  };

  // Breadcrumb navigation
  const renderBreadcrumb = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    let breadcrumbItems: { title: React.ReactNode; onClick: () => void; key: string }[] = [
      { title: <HomeOutlined />, onClick: () => setCurrentPath('/'), key: 'root' },
    ];

    if (storageType === StorageType.LOCAL) {
      // 本地文件系统的面包屑导航不变
      breadcrumbItems = [
        ...breadcrumbItems,
        ...pathParts.map((part, index) => {
          const path = `/${pathParts.slice(0, index + 1).join('/')}`;
          return { title: part as React.ReactNode, onClick: () => setCurrentPath(path), key: path };
        }),
      ];
    } else {
      // GitHub的面包屑导航需要特殊处理
      pathParts.forEach((part, index) => {
        const path = `/${pathParts.slice(0, index + 1).join('/')}`;

        // 为GitHub仓库和所有者添加特殊处理
        if (index === 0) {
          breadcrumbItems.push({
            title: (
              <span>
                {part}
                <Text type="secondary" style={{ fontSize: '12px', marginLeft: '4px' }}>
                  (组织/用户)
                </Text>
              </span>
            ),
            onClick: () => setCurrentPath(path),
            key: path
          });
        } else if (index === 1) {
          breadcrumbItems.push({
            title: (
              <span>
                {part}
                <Text type="secondary" style={{ fontSize: '12px', marginLeft: '4px' }}>
                  (仓库)
                </Text>
              </span>
            ),
            onClick: () => setCurrentPath(path),
            key: path
          });
        } else {
          breadcrumbItems.push({
            title: part as React.ReactNode,
            onClick: () => setCurrentPath(path),
            key: path
          });
        }
      });
    }

    return (
      <Breadcrumb
        items={breadcrumbItems}
        separator="/"
        style={{ fontSize: '14px' }}
      />
    );
  };

  // Render functions
  const renderFileItem = (item: LocalFileSpace) => {
    const itemKey = item.name + (item.folder ? '_dir' : '_file');
    const isEditing = editingItem === itemKey;

    return (
      <Col xs={12} sm={8} md={6} lg={4} xl={4} xxl={3} key={itemKey}>
        <div
          style={{
            padding: '12px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s',
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '120px',
            margin: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #f0f0f0',
            overflow: 'hidden',
            position: 'relative',
          }}
          onClick={() => handleNavigate(item)}
          onContextMenu={(e) => showContextMenu(e, item)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f7';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.09)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
          }}
        >
          {!item.folder && item.url && (
            <Tooltip title="复制URL">
              <Button
                type="text"
                icon={<CopyOutlined />}
                size="small"
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  opacity: 0.7,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(item.url || '')
                    .then(() => {
                      message.success('URL已复制到剪贴板');
                    })
                    .catch(() => {
                      message.error('复制URL失败');
                    });
                }}
              />
            </Tooltip>
          )}
          <div style={{ fontSize: '32px', color: item.folder ? '#3E7BE7' : '#8E8E93', marginBottom: '8px' }}>
            {item.folder ? <FolderOutlined /> : <FileOutlined />}
          </div>

          {isEditing ? (
            <input
              ref={editInputRef}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyDown={(e) => handleEditKeyDown(e, item)}
              style={{
                width: '90%',
                padding: '2px 4px',
                border: '1px solid #3E7BE7',
                borderRadius: '4px',
                textAlign: 'center',
                fontSize: '14px',
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div style={{ width: '100%', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
              <Text
                style={{
                  color: item.folder ? '#3E7BE7' : 'inherit',
                  fontWeight: item.folder ? 500 : 'normal',
                  width: '100%',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: 'text',
                }}
                ellipsis={{ tooltip: item.name }}
                onDoubleClick={(e) => startEditing(item, e)}
              >
                {item.name}
              </Text>
            </div>
          )}
        </div>
      </Col>
    );
  };

  // 显示GitHub Token设置模态框
  const showGitHubTokenModal = () => {
    showModal('githubToken');
    setInputValue(githubToken || '');
  };

  return (
    <PageContainer
      header={{
        title: '文件',
        ghost: true,
        breadcrumb: {},
      }}
    >
      <Card
        bodyStyle={{ padding: '0' }}
        bordered={false}
        style={{ borderRadius: '10px', overflow: 'hidden' }}
      >
        {/* 工具栏区域 */}
        <div style={{
          padding: '12px 16px',
          background: '#F5F5F7',
          borderBottom: '1px solid #E5E5EA',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Space size="middle">
            <Space>
              {currentPath !== '/' && (
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={handleGoBack}
                  type="text"
                  style={{ color: '#007AFF' }}
                />
              )}
              {renderBreadcrumb()}
            </Space>
          </Space>
          <Space>
            {/* 存储类型选择器 */}
            <Select
              value={storageType}
              onChange={(value) => setStorageType(value)}
              style={{ width: 150 }}
              dropdownMatchSelectWidth={false}
            >
              <Option value={StorageType.LOCAL}>本地存储</Option>
              <Option value={StorageType.GITHUB}>GitHub</Option>
            </Select>

            {/* GitHub模式下的Token设置按钮 */}
            {storageType === StorageType.GITHUB && githubToken && (
              <Tooltip title="管理GitHub Token">
                <Button
                  icon={<GithubOutlined />}
                  onClick={showGitHubTokenModal}
                  type="text"
                >
                  管理Token
                </Button>
              </Tooltip>
            )}
          </Space>
        </div>

        {/* 文件网格视图 */}
        <div
          style={{ padding: '16px', minHeight: '300px' }}
          onContextMenu={(e) => showContextMenu(e)}
        >
          {isLoading || operationLoading || githubLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
              <Spin size="large" />
            </div>
          ) : storageType === StorageType.GITHUB && !githubToken ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '300px',
              padding: '0 20%'
            }}>
              <Title level={4}>需要GitHub个人访问令牌 (PAT)</Title>
              <Text style={{ marginBottom: 20, textAlign: 'center' }}>
                请提供一个GitHub个人访问令牌以访问您的仓库，需要有repo权限。
                您可以在 <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">
                  GitHub Token设置页面
                </a> 创建令牌。
              </Text>
              <Input.Password
                placeholder="输入GitHub Token"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                style={{ marginBottom: 16, width: '100%' }}
                onPressEnter={() => saveGitHubToken(inputValue)}
              />
              <Space>
                <Button onClick={() => {
                  setStorageType(StorageType.LOCAL);
                }}>切换到本地存储</Button>
                <Button
                  type="primary"
                  onClick={() => saveGitHubToken(inputValue)}
                  disabled={!inputValue.trim()}
                >
                  保存并使用
                </Button>
              </Space>
            </div>
          ) : dataSource.length > 0 ? (
            <Row gutter={[8, 16]}>
              {dataSource.map(item => renderFileItem(item))}
            </Row>
          ) : (
            <Empty description={`${storageType === StorageType.LOCAL ? '文件夹' : '仓库'}为空`} style={{ marginTop: '100px' }} />
          )}
        </div>
      </Card>

      {/* 模态框 */}
      <Modal
        title={(() => {
          if (modalType === 'rename') return '重命名';
          if (modalType === 'newFolder') return '新建文件夹';
          if (modalType === 'githubToken') return '管理GitHub令牌';
          return '';
        })()}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={closeModal}
        confirmLoading={operationLoading || githubLoading}
        destroyOnClose
        width={400}
        style={{ borderRadius: '10px', overflow: 'hidden' }}
        footer={
          modalType === 'githubToken' ?
          [
            <Button key="clear" danger onClick={() => {
              saveGitHubToken('');
              message.success('GitHub Token已清除');
              setStorageType(StorageType.LOCAL);
              closeModal();
            }}>
              清除Token
            </Button>,
            <Button key="cancel" onClick={closeModal}>
              取消
            </Button>,
            <Button key="submit" type="primary" onClick={handleModalOk} disabled={!inputValue.trim()}>
              保存
            </Button>,
          ] : undefined
        }
      >
        {modalType === 'rename' || modalType === 'newFolder' ? (
          <Input
            placeholder={(() => {
              if (modalType === 'rename') return '请输入新名称';
              if (modalType === 'newFolder') return '请输入文件夹名称';
              return '';
            })()}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleModalOk}
            autoFocus
            style={{ marginTop: '16px' }}
          />
        ) : modalType === 'githubToken' ? (
          <>
            <Text style={{ display: 'block', marginBottom: 16 }}>
              {githubToken ? '您已设置GitHub Token，可以更新或清除它' : '请输入GitHub个人访问令牌以访问您的GitHub仓库'}
            </Text>
            <Input.Password
              placeholder="输入GitHub Token"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={() => inputValue.trim() && handleModalOk()}
              autoFocus
              style={{ width: '100%' }}
            />
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              您可以在 <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">
                GitHub Token设置页面
              </a> 创建具有repo权限的令牌。
            </Text>
          </>
        ) : null}
      </Modal>

      {/* 右键菜单 */}
      {contextMenuPosition && (
        <div
          style={{
            position: 'fixed',
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
            boxShadow: '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08)',
            borderRadius: '8px',
            backgroundColor: 'white',
            zIndex: 1000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Menu
            items={getContextMenuItems()}
            onClick={handleMenuClick}
            style={{
              border: 'none',
              borderRadius: '8px',
              padding: '4px 0',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}
          />
        </div>
      )}

      {/* 隐藏的文件输入元素 - 本地文件上传 */}
      <input
        type="file"
        ref={localUploadRef}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* 隐藏的文件输入元素 - GitHub文件上传 */}
      <input
        type="file"
        ref={uploadRef}
        style={{ display: 'none' }}
        onChange={handleGitHubFileUpload}
      />
    </PageContainer>
  );
};

export default LocalFileManager;
