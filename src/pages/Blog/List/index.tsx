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
  Space,
  Tag,
  Divider,
  Tooltip,
  Typography,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import type {
  CategoryListItem,
  TagListItem,
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
type BlogListItem = API.BlogListItem;
type VisibilityBlogReq = API.VisibilityBlogReq;

type BlogVisibilityFormValues = VisibilityBlogReq & {
  radio: 1 | 2 | 3;
};

type TableParams = {
  current?: number;
  pageSize?: number;
} & Record<string, any>;

// 常量定义
const VISIBILITY_OPTIONS = [
  { value: 1, icon: <EyeOutlined />, label: '公开', color: '#52c41a' },
  { value: 2, icon: <EyeInvisibleOutlined />, label: '私密', color: '#faad14' },
  { value: 3, icon: <LockOutlined />, label: '密码保护', color: '#1677ff' }
];

const BLOG_FEATURE_OPTIONS = [
  { name: 'appreciation', label: '赞赏功能' },
  { name: 'recommend', label: '推荐文章' },
  { name: 'commentEnabled', label: '评论功能' },
  { name: 'top', label: '置顶文章' }
];

const BlogList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [form] = Form.useForm();
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

        // Type assertion to tell TypeScript these are arrays
        setCategoryList((categories.data || []) as CategoryListItem[]);
        setTagList((tags.data || []) as TagListItem[]);
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
      align: 'left',
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
      align: 'center',
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
      align: 'center',
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
      render: (_, record) => {
        // 使用更简洁的标签样式
        const status = !record.published
          ? { icon: <EyeInvisibleOutlined />, text: '私密', color: '#faad14' }
          : record.password
            ? { icon: <LockOutlined />, text: '密码', color: '#1677ff' }
            : { icon: <EyeOutlined />, text: '公开', color: '#52c41a' };

        return (
          <span
            onClick={() => showVisibilityModal(record)}
            style={{
              cursor: 'pointer',
              color: status.color,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              justifyContent: 'center',
              width: '100%'
            }}
          >
            {status.icon} {status.text}
          </span>
        );
      },
      hideInSearch: true,
      width: 100,
      align: 'center',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      valueType: 'dateTime',
      hideInSearch: true,
      width: 180,
      align: 'center',
    },
    {
      title: '最近更新',
      dataIndex: 'updateTime',
      valueType: 'dateTime',
      hideInSearch: true,
      width: 180,
      align: 'center',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 220,
      align: 'center',
      render: (_, record) => [
        <Button
          key="preview"
          onClick={() => history.push(`/blog/preview/${record.id}`)}
        >
          预览
        </Button>,
        <Button key="edit" onClick={() => history.push(`/blog/edit/${record.id}`)}>
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
          <Button danger>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer title="文章管理">
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
        request={async (params, sort, filter) => {
          const { current: pageNo = 1, pageSize = 10, ...rest } = params;
          try {
            const res = await pageBlog({ pageNo, pageSize, ...rest });
            return {
              data: (res.data || []) as BlogListItem[],
              total: res.total || 0,
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
        tableStyle={{
          backgroundColor: 'rgb(238, 239, 233)',
        }}
        cardProps={{
          bodyStyle: {
            backgroundColor: 'rgb(238, 239, 233)',
            padding: '24px',
          },
        }}
        options={{
          setting: {
            listsHeight: 400,
          },
        }}
      />

      {/* 可见性设置模态框 */}
      <Modal
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        destroyOnClose
        centered
        width={380}
        maskClosable={false}
        bodyStyle={{ padding: '20px 24px' }}
        title={null}
        className="visibility-modal"
      >
        <div style={{
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 500,
            color: '#000000d9'
          }}>
            文章可见性设置
          </div>
        </div>

        <Form<BlogVisibilityFormValues>
          form={visibilityForm}
          layout="vertical"
          onFinish={handleVisibilitySubmit}
          requiredMark={false}
        >
          {/* 可见性选项部分 */}
          <Form.Item
            name="radio"
            rules={[{ required: true, message: '请选择可见性类型' }]}
            style={{ marginBottom: '16px' }}
          >
            <Radio.Group style={{ width: '100%' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '8px',
                height: '92px'
              }}>
                {VISIBILITY_OPTIONS.map(item => (
                  <Radio
                    value={item.value}
                    key={item.value}
                    style={{
                      margin: 0,
                      padding: 0,
                      width: '100%',
                      height: '100%'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px 4px',
                      borderRadius: '4px',
                      height: '100%',
                      backgroundColor: visibilityForm.getFieldValue('radio') === item.value
                        ? '#f0f7ff' : '#f9f9f9',
                      border: visibilityForm.getFieldValue('radio') === item.value
                        ? '1px solid #91caff' : '1px solid #f0f0f0',
                    }}>
                      <div style={{
                        color: item.color,
                        fontSize: '20px',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {item.icon}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: 'rgba(0, 0, 0, 0.65)',
                        textAlign: 'center',
                        lineHeight: '1.2'
                      }}>
                        {item.label}
                      </div>
                    </div>
                  </Radio>
                ))}
              </div>
            </Radio.Group>
          </Form.Item>

          {/* 密码输入部分 */}
          <div style={{ minHeight: '36px', marginBottom: '16px', display: 'block' }}>
            <Form.Item
              noStyle
              shouldUpdate={(prev, curr) => prev.radio !== curr.radio}
            >
              {({ getFieldValue }) =>
                getFieldValue('radio') === 3 ? (
                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: '请输入访问密码' },
                      { min: 4, message: '密码长度不能少于4位' },
                    ]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: '#1677ff' }} />}
                      placeholder="请输入访问密码"
                      autoComplete="new-password"
                      style={{
                        borderRadius: '4px',
                        height: '32px',
                      }}
                    />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
          </div>

          {/* 功能选项部分 */}
          <div style={{ minHeight: '84px', marginBottom: '16px', display: 'block' }}>
            <Form.Item
              noStyle
              shouldUpdate={(prev, curr) => prev.radio !== curr.radio}
            >
              {({ getFieldValue }) =>
                getFieldValue('radio') !== 2 ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                  }}>
                    {BLOG_FEATURE_OPTIONS.map(item => (
                      <div key={item.name} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#f9f9f9',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid #f0f0f0',
                        height: '36px'
                      }}>
                        <span style={{
                          color: 'rgba(0, 0, 0, 0.65)',
                          fontSize: '13px',
                        }}>
                          {item.label}
                        </span>
                        <Form.Item name={item.name} valuePropName="checked" style={{ margin: 0 }}>
                          <Switch size="small" />
                        </Form.Item>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ height: '84px' }}></div>
                )
              }
            </Form.Item>
          </div>

          {/* 按钮部分 */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            marginTop: '8px'
          }}>
            <Button
              onClick={() => setVisible(false)}
              style={{
                borderRadius: '4px',
              }}
            >
              取消
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                borderRadius: '4px',
              }}
            >
              保存
            </Button>
          </div>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default BlogList;
