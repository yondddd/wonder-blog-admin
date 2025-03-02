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
} from 'antd';
import { history } from '@umijs/max';
import LexicalEditor from '@/components/Editor';
import { getBlogById, saveBlog, updateBlog } from '@/services/ant-design-pro/blogApi';
import { listAllCategory } from '@/services/ant-design-pro/categoryApi';
import { listAllTag } from '@/services/ant-design-pro/tagApi';
import type { BlogItem, CategoryListItem, TagListItem } from '@/services/ant-design-pro/types';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { EyeOutlined, EyeInvisibleOutlined, LockOutlined } from '@ant-design/icons';

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
  const descriptionEditorRef = useRef<any>(null);
  const contentEditorRef = useRef<any>(null);

  const { Title } = Typography;
  const handleSubmit = async (values: any, autoSave = false) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      // 获取最新的编辑器内容
      if (descriptionEditorRef.current) {
        try {
          const descriptionState = descriptionEditorRef.current.getEditorState();
          descriptionRef.current = JSON.stringify(descriptionState.toJSON());
        } catch (error) {
          console.error('获取描述编辑器内容失败:', error);
        }
      }

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
      const payload = {
        ...formValues,
        id: formValues.id,
        content: contentRef.current,
        description: descriptionRef.current,
        category: { name: formValues.category },
        tags: (formValues.tags || []).map((t: string) => ({ name: t })),
        published: formValues.visibilityType !== 2,
        password: formValues.visibilityType === 3 ? formValues.password : '',
        recommend: formValues.recommend ?? false,
        appreciation: formValues.appreciation ?? false,
        commentEnabled: formValues.commentEnabled ?? false,
        top: formValues.top ?? false,
      };

      console.log('保存的内容:', {
        description: descriptionRef.current,
        content: contentRef.current
      });

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
      console.log('定时');
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
          };
          form.setFieldsValue(values);
          contentRef.current = blog.content || '';
          descriptionRef.current = blog.description || '';
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

  return (
    <PageContainer title={initialValues.id ? '编辑文章' : '新建文章'}>
      <Form form={form} >
        <div  style={{ background: 'rgb(238, 239, 233)' }}>
          {/* Metadata Section */}
          <Card style={{ background: 'rgb(238, 239, 233)' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="文章标题" name="title" rules={[{ required: true }]}>
                  <Input placeholder="请输入标题" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="分类" name="category" rules={[{ required: true }]}>
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
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="标签" name="tags" rules={[{ required: true }]}>
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
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="文章首图" name="firstPicture" rules={[{ required: true }]}>
                  <Input placeholder="输入图片URL" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Row gutter={8}>
                  <Col span={8}>
                    <Form.Item label="字数统计" name="words">
                      <Input type="number" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="阅读时长" name="readTime">
                      <Input type="number" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="浏览次数" name="views">
                      <Input type="number" />
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>

          {/* Content Section */}
          <div>
            <div>
              <Title level={5}>文章摘要</Title>
              <Form.Item name="description" hidden>
                <Input />
              </Form.Item>
                <LexicalEditor initialContent={descriptionRef.current}>
                  <EditorContentGetter editorRef={descriptionEditorRef} />
                </LexicalEditor>
            </div>

            <div >
              <Title level={5}>文章正文</Title>
              <Form.Item name="content" hidden>
                <Input />
              </Form.Item>

                <LexicalEditor initialContent={contentRef.current}>
                  <EditorContentGetter editorRef={contentEditorRef} />
                </LexicalEditor>
            </div>
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
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <Form.Item
            name="visibilityType"
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

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.visibilityType !== curr.visibilityType}>
            {({ getFieldValue }) =>
              getFieldValue('visibilityType') !== 2 && (
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
                        backgroundColor: '#eeefe9',
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
              )
            }
          </Form.Item>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            marginTop: '4px'
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

      {/* Floating Save Button */}
      <Button
        type="primary"
        shape="round"
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          fontSize: '16px',
        }}
        onClick={() => setVisibilityModalVisible(true)}
      >
        保存
      </Button>
    </PageContainer>
  );
};

export default BlogWrite;
