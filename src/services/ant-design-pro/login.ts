// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';
import { BASE_URL } from '@/services/ant-design-pro/api';
import { LoginParams, LoginData } from '@/services/types/userType';


/** 登录接口 POST /api/login/account */
export async function login(body: LoginParams, options?: { [key: string]: any }) {
  return request<API.Response<LoginData>>(BASE_URL + '/account/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}