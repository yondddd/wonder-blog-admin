import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Row,
  Select,
  Typography,
  Switch,
  Space,
  Divider,
  Tooltip,
  Tabs,
} from 'antd';
import { history } from '@umijs/max';
import LexicalEditor from '@/components/Editor';
import { getBlogById, saveBlog, updateBlog } from '@/services/ant-design-pro/blogApi';
import { listAllCategory } from '@/services/ant-design-pro/categoryApi';
import { listAllTag } from '@/services/ant-design-pro/tagApi';
import type { BlogItem, CategoryListItem, TagListItem } from '@/services/ant-design-pro/types';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
  FileImageOutlined,
  ReadOutlined,
  FieldTimeOutlined,
  SaveOutlined,
  EditOutlined,
  TagOutlined,
  EyeInvisibleFilled
} from '@ant-design/icons';

// 创建一个编辑器内容获取组件
const EditorContentGetter = ({
  editorRef
}: {
  editorRef: React.MutableRefObject<any>;
}) => {
  const [editor] = useLexicalComposerContext();

  // 只将编辑器实例存储到ref中，不监听任何事件
  React.useEffect(() => {
    if (editor && editorRef) {
      editorRef.current = editor;
    }
    // 不返回任何清理函数，因为没有设置任何需要清理的监听器
  }, [editor, editorRef]);

  return null;
};

const BlogWrite: React.FC = () => {
  const [form] = Form.useForm();
  const [tagList, setTagList] = useState<TagListItem[]>([]);
  const [categoryList, setCategoryList] = useState<CategoryListItem[]>([]);
  const [visibilityModalVisible, setVisibilityModalVisible] = useState(false);
  const [initialValues, setInitialValues] = useState<Partial<BlogItem>>({});
  const saveTimer = useRef<number>();
  const contentRef = useRef<string>('');
  const descriptionRef = useRef<string>('');
  const isSubmittingRef = useRef(false);
  const isChange = useRef(false);

  // 创建编辑器实例的ref
  const contentEditorRef = useRef<any>(null);

  const { Title } = Typography;
  const handleSubmit = async (values: any, autoSave = false) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      // 获取最新的编辑器内容
      if (contentEditorRef.current) {
        try {
          const contentState = contentEditorRef.current.getEditorState();
          contentRef.current = JSON.stringify(contentState.toJSON());
        } catch (error) {
          console.error('获取内容编辑器内容失败:', error);
        }
      }

      const formValues = form.getFieldsValue(true);
      const isUpdate = Boolean(formValues.id);

      // 直接使用表单中的description字段值
      const description = formValues.description || '';

      const payload = {
        ...formValues,
        id: formValues.id,
        content: contentRef.current,
        description: description, // 使用表单中的description
        category: { name: formValues.category },
        tags: (formValues.tags || []).map((t: string) => ({ name: t })),
        published: formValues.visibilityType !== 2,
        password: formValues.visibilityType === 3 ? formValues.password : '',
        recommend: formValues.recommend ?? false,
        appreciation: formValues.appreciation ?? false,
        commentEnabled: formValues.commentEnabled ?? false,
        top: formValues.top ?? false,
      };

      const result = await (isUpdate ? updateBlog : saveBlog)(payload);
      if (result.success) {
        if (!autoSave) message.success(isUpdate ? '更新成功' : '保存成功');
        if (!isUpdate && result.data) {
          history.push(`/blog/list`);
        }
      }
    } catch (error) {
      message.error('操作失败');
      console.error('保存失败:', error);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleCategorySearch = useCallback(
    (value: string) => {
      const normalizedValue = value.trim().toLowerCase();
      if (value && !categoryList.some((c) => c.name.toLowerCase() === normalizedValue)) {
        setCategoryList((prev) => [...prev, { id: -1, name: value }]);
      }
    },
    [categoryList],
  );

  const handleTagChange = useCallback(
    (tags: string[]) => {
      const newTags = tags.filter(
        (t) => !tagList.some((lt) => lt.name.toLowerCase() === t.toLowerCase()),
      );
      if (newTags.length) {
        setTagList((prev) => [...prev, ...newTags.map((t) => ({ id: -1, name: t }))]);
      }
    },
    [tagList],
  );

  const startAutoSave = useCallback(() => {
    if (saveTimer.current) {
      window.clearInterval(saveTimer.current);
    }
    saveTimer.current = window.setInterval(() => {
      if (!isSubmittingRef.current) {
        // 不再依赖isChange标记，直接检查并保存内容
        // 这样可以避免在用户未修改内容时进行不必要的保存
        form
          .validateFields()
          .then((values) => handleSubmit(values, true))
          .catch(() => {});
      }
      // 重置编辑标记
      isChange.current = false;
    }, 30000);
  }, [form]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([listAllCategory(), listAllTag()]);
        if (categoriesRes.success) setCategoryList((categoriesRes.data || []) as CategoryListItem[]);
        if (tagsRes.success) setTagList((tagsRes.data || []) as TagListItem[]);
      } catch (error) {
        message.error('加载数据失败');
      }
    };

    const blogId = history.location.pathname.split('/').pop();
    if (blogId && blogId !== 'create') {
      getBlogById({ id: Number(blogId) }).then((res) => {
        if (res.success && res.data) {
          const blog = res.data;
          const values = {
            ...blog,
            category: blog.category?.name,
            tags: blog.tags?.map((t) => t.name) || [],
            visibilityType: blog.published ? (blog.password ? 3 : 1) : 2,
            recommend: blog.recommend ?? false,
            appreciation: blog.appreciation ?? false,
            commentEnabled: blog.commentEnabled ?? false,
            top: blog.top ?? false,
            readTime: blog.readTime || 0,
            description: blog.description || '', // 确保description正确设置到表单
          };
          form.setFieldsValue(values);
          contentRef.current = blog.content || '';
          setInitialValues(blog);
        }
      });
    }
    loadData();
    startAutoSave();
    return () => {
      if (saveTimer.current) {
        window.clearInterval(saveTimer.current);
      }
    };
  }, []);

  // 监听description字段变化
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    descriptionRef.current = e.target.value;
  };

  return (
    <PageContainer title={initialValues.id ? '编辑文章' : '新建文章'}>
      <Form form={form} layout="vertical">
        <div style={{ background: 'rgb(238, 239, 233)', padding: '16px', borderRadius: '8px' }}>
          {/* 文章基本信息 - 使用精简的卡片布局 */}
          <Card style={{ marginBottom: '16px', borderRadius: '6px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* 第一行：标题和首图 */}
              <div style={{ flex: '3 0 300px' }}>
                <Form.Item
                  label="文章标题"
                  name="title"
                  rules={[{ required: true, message: '请输入文章标题' }]}
                  style={{ marginBottom: '8px' }}
                >
                  <Input
                    placeholder="请输入标题"
                    size="middle"
                    style={{ borderRadius: '4px' }}
                  />
                </Form.Item>
              </div>
              <div style={{ flex: '2 0 200px' }}>
                <Form.Item
                  label="文章首图"
                  name="firstPicture"
                  rules={[{ required: true, message: '请输入图片URL' }]}
                  style={{ marginBottom: '8px' }}
                >
                  <Input
                    placeholder="输入图片URL"
                    prefix={<FileImageOutlined />}
                    style={{ borderRadius: '4px' }}
                  />
                </Form.Item>
              </div>

              {/* 第二行：分类和标签 */}
              <div style={{ flex: '1 0 200px' }}>
                <Form.Item
                  label="分类"
                  name="category"
                  rules={[{ required: true, message: '请选择分类' }]}
                  style={{ marginBottom: '8px' }}
                >
                  <Select
                    showSearch
                    placeholder="选择或创建分类"
                    options={categoryList.map((category) => ({
                      value: category.name,
                      label: category.name,
                    }))}
                    onSearch={handleCategorySearch}
                    filterOption={(input, option) =>
                      (option?.label as string).toLowerCase().includes(input.toLowerCase())
                    }
                    style={{ borderRadius: '4px' }}
                  />
                </Form.Item>
              </div>
              <div style={{ flex: '2 0 300px' }}>
                <Form.Item
                  label="标签"
                  name="tags"
                  rules={[{ required: true, message: '请选择标签' }]}
                  style={{ marginBottom: '8px' }}
                >
                  <Select
                    mode="multiple"
                    placeholder="选择或创建标签"
                    onChange={handleTagChange}
                    options={tagList.map((tag) => ({
                      value: tag.name,
                      label: tag.name,
                    }))}
                    filterOption={(input, option) =>
                      (option?.label as string).toLowerCase().includes(input.toLowerCase())
                    }
                    showSearch
                    allowClear
                    style={{ borderRadius: '4px' }}
                  />
                </Form.Item>
              </div>

              {/* 第三行：统计信息和摘要 */}
              <div style={{ flex: '1 0 100%' }}>
                <Tabs
                  defaultActiveKey="description"
                  size="small"
                  style={{ marginBottom: '-16px' }}
                  items={[
                    {
                      key: 'description',
                      label: '文章摘要',
                      children: (
                        <Form.Item name="description" style={{ marginBottom: '0' }}>
                          <Input.TextArea
                            rows={2}
                            placeholder="请输入文章摘要"
                            autoSize={{ minRows: 2, maxRows: 3 }}
                            style={{ borderRadius: '4px', resize: 'none' }}
                            onChange={handleDescriptionChange}
                          />
                        </Form.Item>
                      )
                    },
                    {
                      key: 'stats',
                      label: '文章统计',
                      children: (
                        <Row gutter={16} style={{ marginBottom: '0' }}>
                          <Col span={8}>
                            <Form.Item label="字数统计" name="words" style={{ marginBottom: '0' }}>
                              <Input
                                type="number"
                                prefix={<ReadOutlined />}
                                style={{ borderRadius: '4px' }}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item label="阅读时长(分钟)" name="readTime" style={{ marginBottom: '0' }}>
                              <Input
                                type="number"
                                prefix={<FieldTimeOutlined />}
                                style={{ borderRadius: '4px' }}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item label="浏览次数" name="views" style={{ marginBottom: '0' }}>
                              <Input
                                type="number"
                                prefix={<EyeOutlined />}
                                style={{ borderRadius: '4px' }}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      )
                    }
                  ]}
                />
              </div>
            </div>
          </Card>

          {/* 文章正文 - 保持不变 */}
          <div>
            <Title level={5} style={{ marginBottom: '12px' }}>文章正文</Title>
            <Form.Item name="content" hidden>
              <Input />
            </Form.Item>

            <LexicalEditor initialContent={contentRef.current} showTableOfContent={true}>
              <EditorContentGetter editorRef={contentEditorRef} />
            </LexicalEditor>
          </div>
        </div>
      </Form>

      {/* Modal for Visibility Settings */}
      <Modal
        open={visibilityModalVisible}
        onCancel={() => setVisibilityModalVisible(false)}
        footer={null}
        destroyOnClose
        centered
        width={380}
        maskClosable={false}
        bodyStyle={{ padding: '20px' }}
        title="文章设置"
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <Form.Item
            name="visibilityType"
            label="可见性设置"
            rules={[{ required: true, message: '请选择可见性类型' }]}
            style={{ marginBottom: 0 }}
          >
            <Radio.Group style={{ width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
                {[
                  { value: 1, icon: <EyeOutlined />, label: '公开', color: '#52c41a' },
                  { value: 2, icon: <EyeInvisibleOutlined />, label: '私密', color: '#faad14' },
                  { value: 3, icon: <LockOutlined />, label: '密码保护', color: '#1677ff' }
                ].map(item => (
                  <Radio
                    value={item.value}
                    key={item.value}
                    style={{
                      margin: 0,
                      padding: 0,
                      width: '100%',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px 0',
                      backgroundColor: form.getFieldValue('visibilityType') === item.value ? `${item.color}10` : 'transparent',
                      borderRadius: '4px',
                      height: '64px',
                    }}>
                      <span style={{ color: item.color, fontSize: '18px', marginBottom: '4px' }}>{item.icon}</span>
                      <span style={{ fontSize: '12px' }}>{item.label}</span>
                    </div>
                  </Radio>
                ))}
              </div>
            </Radio.Group>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.visibilityType !== curr.visibilityType}>
            {({ getFieldValue }) =>
              getFieldValue('visibilityType') === 3 && (
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
                    style={{ borderRadius: '4px', height: '32px' }}
                  />
                </Form.Item>
              )
            }
          </Form.Item>

          <Divider style={{ margin: '0 0 8px' }} />
          <div style={{ fontWeight: 500, marginBottom: '8px' }}>文章选项</div>

          <div style={{ marginBottom: 0 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}>
              {[
                { name: 'appreciation', label: '赞赏功能' },
                { name: 'recommend', label: '推荐文章' },
                { name: 'commentEnabled', label: '评论功能' },
                { name: 'top', label: '置顶文章' }
              ].map(item => (
                <div key={item.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#f5f5f5',
                  padding: '6px 10px',
                  borderRadius: '4px',
                }}>
                  <span style={{
                    color: 'rgba(0, 0, 0, 0.65)',
                    fontSize: '12px',
                  }}>
                    {item.label}
                  </span>
                  <Form.Item name={item.name} valuePropName="checked" style={{ margin: 0 }}>
                    <Switch size="small" />
                  </Form.Item>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            marginTop: '12px'
          }}>
            <Button size="small" onClick={() => setVisibilityModalVisible(false)}>取消</Button>
            <Button
              size="small"
              type="primary"
              onClick={async () => {
                try {
                  // 验证必填字段
                  await form.validateFields(['title', 'category', 'tags', 'firstPicture', 'visibilityType']);
                  if (form.getFieldValue('visibilityType') === 3) {
                    await form.validateFields(['password']);
                  }
                  await handleSubmit(form.getFieldsValue());
                  setVisibilityModalVisible(false);
                } catch (error) {
                  console.error('验证失败:', error);
                  if (error && (error as any).errorFields) {
                    message.error('请填写必填字段: ' + (error as any).errorFields.map((f: any) => f.name[0]).join(', '));
                  } else {
                    message.error('表单验证失败，请检查必填字段');
                  }
                }
              }}
            >
              保存
            </Button>
            <Button
              size="small"
              type="primary"
              onClick={async () => {
                try {
                  // 验证必填字段
                  await form.validateFields(['title', 'category', 'tags', 'firstPicture', 'visibilityType']);
                  if (form.getFieldValue('visibilityType') === 3) {
                    await form.validateFields(['password']);
                  }
                  await handleSubmit(form.getFieldsValue());
                  if (initialValues.id) {
                    history.push(`/blog/preview/${initialValues.id}`);
                  }
                } catch (error) {
                  console.error('验证失败:', error);
                  if (error && (error as any).errorFields) {
                    message.error('请填写必填字段: ' + (error as any).errorFields.map((f: any) => f.name[0]).join(', '));
                  } else {
                    message.error('表单验证失败，请检查必填字段');
                  }
                }
              }}
            >
              保存并预览
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 优化后的保存按钮 */}
      <Tooltip title="保存文章" placement="left">
        <Button
          type="primary"
          shape="circle"
          icon={<SaveOutlined />}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            width: '56px',
            height: '56px',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
          onClick={() => setVisibilityModalVisible(true)}
        />
      </Tooltip>
    </PageContainer>
  );
};

export default BlogWrite;
