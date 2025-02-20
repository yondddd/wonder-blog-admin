import React, { useRef } from 'react';

import {
  type ActionType,
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { FormattedMessage } from '@@/exports';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { rule } from '@/services/ant-design-pro/api';

const BlogList: React.FC = () => {
  const actionRef = useRef<ActionType>();

  const columns: ProColumns<API.BlogListItem>[] = [
    {
      title: '序号',
      dataIndex: 'id',
      valueType: 'index',
    },
    {
      title: '标题',
      dataIndex: 'title',
      valueType: 'index',
    },
    {
      title: '分类',
      dataIndex: 'categoryName',
      valueType: 'select',
    },
    {
      title: '置顶',
      dataIndex: 'top',
      valueType: 'switch',
      hideInSearch: true,
    },
    {
      title: '推荐',
      dataIndex: 'recommend',
      valueType: 'switch',
      hideInSearch: true,
    },
    {
      title: '可见性',
      dataIndex: 'recommend',
      valueType: 'text',
      hideInSearch: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      valueType: 'dateTime',
    },
    {
      title: '最近更新',
      dataIndex: 'updateTime',
      valueType: 'dateTime',
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="config"
          onClick={() => {
            handleUpdateModalOpen(true);
            setCurrentRow(record);
          }}
        >
          <FormattedMessage id="pages.searchTable.config" defaultMessage="Configuration" />
        </a>,
        <a key="subscribeAlert" href="https://procomponents.ant.design/">
          <FormattedMessage
            id="pages.searchTable.subscribeAlert"
            defaultMessage="Subscribe to alerts"
          />
        </a>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.BlogListItem, API.PageReq>
        headerTitle="文章列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              handleModalOpen(true);
            }}
          >
            <PlusOutlined /> <FormattedMessage id="pages.searchTable.new" defaultMessage="New" />
          </Button>,
        ]}
        request={rule}
        columns={columns}
        rowSelection={{
          onChange: (_, selectedRows) => {
            setSelectedRows(selectedRows);
          },
        }}
      />
    </PageContainer>
  );
};

export default BlogList;
