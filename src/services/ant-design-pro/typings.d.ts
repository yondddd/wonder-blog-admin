// @ts-ignore
/* eslint-disable */

declare namespace API {
  type PageReq = {
    pageNo?: number;
    pageSize?: number;
  };

  type IdReq = {
    id?: number;
  };

  type Response<T> = {
    code?: number;
    data?: T;
    msg?: string;
    success?: boolean;
  };

  type PageResponse<T> = {
    code?: number;
    data?: T;
    msg?: string;
    success?: boolean;
    hasNext?: boolean;
    pageNo?: number;
    pageSize?: number;
    total?: number;
  };

  type BooleanResponse = {
    code?: number;
    data?: boolean;
    msg?: string;
    success?: boolean;
  };


  type PageParams = {
    current?: number;
    pageSize?: number;
  };


  type BooleanResp = {
    data?: boolean;
    total?: number;
    success?: boolean;
  };


  type ErrorResponse = {
    /** 业务约定的错误码 */
    errorCode: string;
    /** 业务上的错误信息 */
    errorMessage?: string;
    /** 业务上的请求是否成功 */
    success?: boolean;
  };

}
