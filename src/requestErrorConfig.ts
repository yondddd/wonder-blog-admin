import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { message, notification } from 'antd';
import { history } from '@@/core/history';

enum ErrorShowType {
  SILENT = 0,
  WARN_MESSAGE = 1,
  ERROR_MESSAGE = 2,
  NOTIFICATION = 3,
  REDIRECT = 9,
}

interface ResponseStructure {
  code: number;
  data: any;
  msg: string;
  success: boolean;
  errorCode?: number;
  errorMessage?: string;
  showType?: ErrorShowType;
}

const loginPath = '/user/login';

export const errorConfig: RequestConfig = {
  errorConfig: {
    errorThrower: (res) => {
      const { success, code, msg, data } = res as unknown as ResponseStructure;

      if (code === 401) {
        const error: any = new Error(msg);
        error.name = 'BizError';
        error.info = {
          errorCode: code,
          msg,
          showType: ErrorShowType.REDIRECT,
          data,
        };
        throw error;
      }

      if (!success) {
        const error: any = new Error(msg);
        error.name = 'BizError';
        error.info = res;
        throw error;
      }
    },
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;

      // 统一处理 401 未授权
      if (error.response?.status === 401) {
        if (history.location.pathname !== loginPath) {
          localStorage.removeItem('token');
          history.push(loginPath);
        }
        return;
      }

      if (error.name === 'BizError') {
        const errorInfo: ResponseStructure = error.info;
        if (errorInfo.showType === ErrorShowType.REDIRECT) {
          if (history.location.pathname !== loginPath) {
            localStorage.removeItem('token');
            history.push(loginPath);
          }
          return;
        }

        const { errorMessage = '操作失败', showType } = errorInfo;
        switch (showType) {
          case ErrorShowType.SILENT:
            break;
          case ErrorShowType.WARN_MESSAGE:
            message.warning(errorMessage);
            break;
          case ErrorShowType.ERROR_MESSAGE:
            message.error(errorMessage);
            break;
          case ErrorShowType.NOTIFICATION:
            notification.open({
              message: '系统错误',
              description: errorMessage,
            });
            break;
          default:
            message.error(errorMessage);
        }
      } else if (error.response) {
        message.error(`请求错误 ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        message.error('网络异常，请检查网络连接');
      } else {
        message.error('请求处理异常');
      }
    },
  },

  requestInterceptors: [
    (config: RequestOptions) => {
      const token = localStorage.getItem('token');
      return {
        ...config,
        headers: {
          ...config.headers,
          Authorization: token ? `Bearer ${token}` : '',
        },
      };
    },
  ],

  responseInterceptors: [
    (response) => {
      const { data } = response as unknown as ResponseStructure;

      // 处理业务层级错误（这里保持原样，实际错误会在 errorThrower 处理）
      if (data?.success === false && data?.code !== 401) {
        message.error(data.msg || '操作失败');
      }
      return response;
    },
  ],
};
