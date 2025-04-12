import React, { useRef } from 'react';
import { PageContainer, ProTable, type ProColumns, type ActionType } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Button, Select, Switch, Space, Popconfirm, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { BlogListItem } from '@/services/types/blogType';
import VisibilityModal from './components/VisibilityModal';
import { pageBlog } from '@/services/ant-design-pro/blogApi';
import { BlogProvider, useBlogContext } from './context';
import { getBlogVisibilityType, getVisibilityOption } from './utils';

// 使用React.memo优化VisibilityModal组件
const MemoizedVisibilityModal = React.memo(VisibilityModal);

// 提取表格组件为独立组件
const BlogTable: React.FC = () => {
  const {
    selectedRows,
    setSelectedRows,
    categoryList,
    tagList,
    handleSetVisibleAndBlog,
    handleSwitchChange,
    handleDelete,
    actionRef,
  } = useBlogContext();

  const columns: ProColumns<BlogListItem>[] = [
    {
      title: '序号',
      dataIndex: 'id',
      valueType: 'indexBorder',
      width: 80,
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'categoryId',
      render: (_, record) => record.category?.name || '-',
      renderFormItem: () => (
        <Select placeholder="请选择分类" allowClear showSearch optionFilterProp="label">
          {categoryList.map((item) => (
            <Select.Option key={item.id} value={item.id} label={item.name}>
              {item.name}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tagId',
      renderFormItem: () => (
        <Select placeholder="请选择标签" allowClear showSearch optionFilterProp="label">
          {tagList.map((item) => (
            <Select.Option key={item.id} value={item.id} label={item.name}>
              {item.name}
            </Select.Option>
          ))}
        </Select>
      ),
      hideInTable: true,
    },
    {
      title: '置顶',
      dataIndex: 'top',
      render: (_, record) => (
        <Switch
          checked={record.top}
          onChange={(checked) => handleSwitchChange('top', record.id, checked)}
        />
      ),
      hideInSearch: true,
    },
    {
      title: '推荐',
      dataIndex: 'recommend',
      render: (_, record) => (
        <Switch
          checked={record.recommend}
          onChange={(checked) => handleSwitchChange('recommend', record.id, checked)}
        />
      ),
      hideInSearch: true,
    },
    {
      title: '可见性',
      dataIndex: 'published',
      valueEnum: {
        true: { text: '公开', status: 'Success' },
        false: { text: '私密', status: 'Default' },
      },
      hideInSearch: true,
      render: (_, record) => {
        const visibilityType = getBlogVisibilityType(record);
        const option = getVisibilityOption(visibilityType);

        if (!option) return null;

        return (
          <Tag
            color={option.color}
            style={{ cursor: 'pointer' }}
            onClick={() => handleSetVisibleAndBlog(record, true)}
          >
            {option.label}
          </Tag>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: '最近更新',
      dataIndex: 'updateTime',
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => window.open(`/blog/preview/${record.id}`, '_blank')}
          >
            预览
          </Button>
          <Button
            type="link"
            onClick={() => history.push(`/blog/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这篇文章吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ProTable<BlogListItem>
      headerTitle="博客列表"
      rowKey="id"
      actionRef={actionRef}
      search={{
        labelWidth: 120,
      }}
      toolBarRender={() => [
        <Button
          key="button"
          icon={<PlusOutlined />}
          type="primary"
          onClick={() => history.push('/blog/edit/create')}
        >
          新建
        </Button>,
      ]}
      request={async (params) => {
        const result = await pageBlog({
          pageNo: params.current,
          pageSize: params.pageSize,
          title: params.title,
          categoryId: params.categoryId,
          tagId: params.tagId,
        });
        return {
          data: result.data || [],
          total: result.total || 0,
          success: result.success,
        };
      }}
      columns={columns}
      rowSelection={{
        onChange: (_, selectedRows) => {
          setSelectedRows(selectedRows);
        },
      }}
      pagination={{
        pageSize: 10,
      }}
    />
  );
};

// 使用React.memo优化BlogTable组件
const MemoizedBlogTable = React.memo(BlogTable);

const BlogList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);

  return (
    <BlogProvider actionRef={actionRef}>
      <PageContainer>
        <MemoizedBlogTable />
        <ModalContainer />
      </PageContainer>
    </BlogProvider>
  );
};

// 单独的Modal容器组件
const ModalContainer: React.FC = () => {
  const { visible, currentBlog, setVisible, handleVisibilitySubmit } = useBlogContext();

  return (
    <MemoizedVisibilityModal
      visible={visible}
      currentBlog={currentBlog}
      onCancel={() => setVisible(false)}
      onSubmit={handleVisibilitySubmit}
    />
  );
};

export default BlogList;
