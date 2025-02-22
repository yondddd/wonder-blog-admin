import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  type ActionType,
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { history } from '@umijs/max';
import {
  Button,
  Form,
  type FormInstance,
  Input,
  message,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Switch,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type {
  BlogListItem,
  CategoryListItem,
  TagListItem,
  VisibilityBlogReq,
} from '@/services/ant-design-pro/types';

import {
  deleteBlogById,
  pageBlog,
  updateRecommend,
  updateTop,
  updateVisibility,
} from '@/services/ant-design-pro/blogApi';
import { listAllCategory } from '@/services/ant-design-pro/categoryApi';
import { listAllTag } from '@/services/ant-design-pro/tagApi';

// 类型定义
type BlogVisibilityFormValues = VisibilityBlogReq & {
  radio: 1 | 2 | 3;
};

type TableParams = {
  current?: number;
  pageSize?: number;
} & Record<string, any>;

const BlogList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [form] = Form.useForm<FormInstance>();
  const [selectedRows, setSelectedRows] = useState<BlogListItem[]>([]);
  const [categoryList, setCategoryList] = useState<CategoryListItem[]>([]);
  const [tagList, setTagList] = useState<TagListItem[]>([]);
  const [visible, setVisible] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<BlogListItem>();
  const [visibilityForm] = Form.useForm<BlogVisibilityFormValues>();

  // 获取分类和标签数据
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [categories, tags] = await Promise.all([listAllCategory(), listAllTag()]);
        setCategoryList(categories.data || []);
        setTagList(tags.data || []);
      } catch (error) {
        message.error('初始化数据加载失败');
        console.error('初始化数据加载失败:', error);
      }
    };

    fetchInitialData();
  }, []);

  // 处理开关状态变化
  const handleSwitchChange = useCallback(
    async (type: 'top' | 'recommend', id: number, value: boolean) => {
      try {
        const api = type === 'top' ? updateTop : updateRecommend;
        await api({ id, [type]: value });
        actionRef.current?.reload();
        message.success('状态更新成功');
      } catch (error) {
        message.error('状态更新失败');
        console.error(`${type}状态更新失败:`, error);
      }
    },
    [],
  );

  // 显示可见性设置模态框
  const showVisibilityModal = useCallback(
    (blog: BlogListItem) => {
      setCurrentBlog(blog);
      visibilityForm.setFieldsValue({
        ...blog,
        radio: blog.published ? (blog.password ? 3 : 1) : 2,
      });
      setVisible(true);
    },
    [visibilityForm],
  );

  // 提交可见性设置
  const handleVisibilitySubmit = useCallback(
    async (values: BlogVisibilityFormValues) => {
      try {
        const { radio, ...formValues } = values;
        const params: VisibilityBlogReq = {
          id: currentBlog?.id,
          ...formValues,
          published: radio !== 2,
          password: radio === 3 ? values.password : '',
        };

        if (radio === 3 && !params.password) {
          message.error('密码保护模式必须设置密码');
          return;
        }

        await updateVisibility(params);
        actionRef.current?.reload();
        setVisible(false);
        message.success('可见性设置更新成功');
      } catch (error) {
        message.error('可见性设置更新失败');
        console.error('可见性设置更新失败:', error);
      }
    },
    [currentBlog?.id],
  );

  // 删除博客
  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteBlogById({ id });
      actionRef.current?.reload();
      message.success('文章删除成功');
    } catch (error) {
      message.error('文章删除失败');
      console.error('文章删除失败:', error);
    }
  }, []);

  // 表格列配置
  const columns: ProColumns<BlogListItem>[] = [
    {
      title: '序号',
      dataIndex: 'id',
      valueType: 'indexBorder',
      align: 'center',
      width: 80,
    },
    {
      title: '标题',
      dataIndex: 'title',
      valueType: 'text',
      width: 200,
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
      width: 150,
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
      hideInSearch: true,
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
      width: 100,
      align: 'center',
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
      width: 100,
      align: 'center',
    },
    {
      title: '可见性',
      render: (_, record) => (
        <a onClick={() => showVisibilityModal(record)}>
          {record.published ? (record.password ? '密码保护' : '公开') : '私密'}
        </a>
      ),
      hideInSearch: true,
      width: 120,
      align: 'center',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      valueType: 'dateTime',
      hideInSearch: true,
      width: 180,
    },
    {
      title: '最近更新',
      dataIndex: 'updateTime',
      valueType: 'dateTime',
      hideInSearch: true,
      width: 180,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 220,
      fixed: 'right',
      render: (_, record) => [
        <Button
          key="preview"
          type="link"
          onClick={() => history.push(`/blog/preview/${record.id}`)}
        >
          预览
        </Button>,
        <Button key="edit" type="link" onClick={() => history.push(`/blog/edit/${record.id}`)}>
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确定删除吗？"
          description="删除后将无法恢复，请谨慎操作！"
          onConfirm={() => handleDelete(record.id)}
          okText="确认"
          cancelText="取消"
        >
          <Button type="link" danger>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer title="文章管理" content="管理您的博客文章">
      <ProTable<BlogListItem, TableParams>
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 100,
          defaultCollapsed: false,
          searchText: '搜索',
          resetText: '重置',
          optionRender: (_, __, dom) => [...dom],
        }}
        form={form}
        request={async (params) => {
          const { current: pageNo = 1, pageSize = 10, ...rest } = params;
          try {
            const res = await pageBlog({ pageNo, pageSize, ...rest });
            return {
              data: res.data,
              total: res.total,
              success: true,
            };
          } catch (error) {
            console.error('文章列表加载失败:', error);
            return {
              data: [],
              total: 0,
              success: false,
            };
          }
        }}
        columns={columns}
        rowSelection={{
          selectedRowKeys: selectedRows.map((n) => n.id),
          onChange: (_, rows) => setSelectedRows(rows),
        }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => history.push('/blog/edit/create')}
          >
            新建文章
          </Button>,
        ]}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          defaultPageSize: 10,
        }}
      />

      {/* 可见性设置模态框 */}
      <Modal
        title="文章可见性设置"
        open={visible}
        onCancel={() => setVisible(false)}
        onOk={() => visibilityForm.submit()}
        destroyOnClose
        centered
      >
        <Form<BlogVisibilityFormValues>
          form={visibilityForm}
          layout="vertical"
          onFinish={handleVisibilitySubmit}
        >
          <Form.Item
            name="radio"
            label="可见性设置"
            rules={[{ required: true, message: '请选择可见性类型' }]}
          >
            <Radio.Group>
              <Radio value={1}>公开</Radio>
              <Radio value={2}>私密</Radio>
              <Radio value={3}>密码保护</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.radio !== curr.radio}>
            {({ getFieldValue }) =>
              getFieldValue('radio') === 3 && (
                <Form.Item
                  name="password"
                  label="访问密码"
                  rules={[
                    { required: true, message: '密码保护模式必须设置密码' },
                    { min: 4, message: '密码长度不能少于4位' },
                  ]}
                >
                  <Input.Password placeholder="请输入访问密码" />
                </Form.Item>
              )
            }
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.radio !== curr.radio}>
            {({ getFieldValue }) =>
              getFieldValue('radio') !== 2 && (
                <div className="flex flex-col gap-4">
                  <Form.Item
                    name="appreciation"
                    label="功能开关"
                    valuePropName="checked"
                    className="mb-0"
                  >
                    <Switch checkedChildren="开启赞赏" unCheckedChildren="关闭赞赏" />
                  </Form.Item>
                  <Form.Item name="recommend" valuePropName="checked" className="mb-0">
                    <Switch checkedChildren="开启推荐" unCheckedChildren="关闭推荐" />
                  </Form.Item>
                  <Form.Item name="commentEnabled" valuePropName="checked" className="mb-0">
                    <Switch checkedChildren="开启评论" unCheckedChildren="关闭评论" />
                  </Form.Item>
                  <Form.Item name="top" valuePropName="checked" className="mb-0">
                    <Switch checkedChildren="开启置顶" unCheckedChildren="关闭置顶" />
                  </Form.Item>
                </div>
              )
            }
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default BlogList;
