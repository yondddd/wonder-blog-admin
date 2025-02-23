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
} from 'antd';
import { history } from '@umijs/max';
import LexicalEditor from '@/components/Editor';
import { getBlogById, saveBlog, updateBlog } from '@/services/ant-design-pro/blogApi';
import { listAllCategory } from '@/services/ant-design-pro/categoryApi';
import { listAllTag } from '@/services/ant-design-pro/tagApi';
import type { BlogItem, CategoryListItem, TagListItem } from '@/services/ant-design-pro/types';

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

  const { Title } = Typography;
  const handleSubmit = async (values: any, autoSave = false) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
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
      const result = await (isUpdate ? updateBlog : saveBlog)(payload);
      if (result.success) {
        if (!autoSave) message.success(isUpdate ? '更新成功' : '保存成功');
        if (!isUpdate && result.data) {
          history.push(`/blog/list`);
        }
      }
    } catch (error) {
      message.error('操作失败');
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

  const handleModalSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      await handleSubmit(values);
      setVisibilityModalVisible(false);
    } catch (error) {
      console.error('验证失败:', error);
      message.error('请检查表单字段');
    }
  }, [form]);

  const handleDescriptionChange = useCallback(
    (description: string) => {
      descriptionRef.current = description;
      form.setFieldsValue({ description });
      isChange.current = true;
    },
    [form],
  );

  const handleContentChange = useCallback(
    (content: string) => {
      contentRef.current = content;
      form.setFieldsValue({ content });
      isChange.current = true;
    },
    [form],
  );

  const startAutoSave = useCallback(() => {
    if (saveTimer.current) {
      window.clearInterval(saveTimer.current);
    }
    saveTimer.current = window.setInterval(() => {
      console.log('定时');
      if (!isSubmittingRef.current && isChange.current) {
        form
          .validateFields()
          .then((values) => handleSubmit(values, true))
          .catch(() => {});
      }
      isChange.current = false;
    }, 30000);
  }, [form]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([listAllCategory(), listAllTag()]);
        if (categoriesRes.success) setCategoryList(categoriesRes.data || []);
        if (tagsRes.success) setTagList(tagsRes.data || []);
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
      <Form form={form} layout="vertical">
        <div className="max-w-4xl mx-auto" style={{ background: 'rgb(238, 239, 233)' }}>
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
            <Title level={5}>文章摘要</Title>
            <Form.Item name="description" hidden>
              <Input />
            </Form.Item>
            <LexicalEditor
              initialContent={descriptionRef.current}
              onChange={handleDescriptionChange}
            />
          </div>
          <div className="mt-4">
            <Title level={5}>文章正文</Title>
            <Form.Item name="content" hidden>
              <Input />
            </Form.Item>
            <LexicalEditor initialContent={contentRef.current} onChange={handleContentChange} />
          </div>
        </div>
      </Form>

      {/* Modal for Visibility Settings */}
      <Modal
        title="可见性设置"
        open={visibilityModalVisible}
        onCancel={() => setVisibilityModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setVisibilityModalVisible(false)}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={handleModalSubmit}>
            保存
          </Button>,
          <Button
            key="preview"
            type="primary"
            onClick={async () => {
              await handleModalSubmit();
              if (initialValues.id) {
                history.push(`/blog/preview/${initialValues.id}`);
              }
            }}
          >
            保存并预览
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="可见性设置" name="visibilityType">
            <Radio.Group>
              <Radio value={1}>公开</Radio>
              <Radio value={2}>私密</Radio>
              <Radio value={3}>密码保护</Radio>
            </Radio.Group>
          </Form.Item>
          {form.getFieldValue('visibilityType') === 3 && (
            <Form.Item
              label="访问密码"
              name="password"
              rules={[{ required: true, message: '请输入访问密码' }]}
            >
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item label="功能开关">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="appreciation" valuePropName="checked" noStyle>
                  <Checkbox>开启赞赏</Checkbox>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="recommend" valuePropName="checked" noStyle>
                  <Checkbox>开启推荐</Checkbox>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="commentEnabled" valuePropName="checked" noStyle>
                  <Checkbox>开启评论</Checkbox>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="top" valuePropName="checked" noStyle>
                  <Checkbox>开启置顶</Checkbox>
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
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
        }}
        onClick={() => setVisibilityModalVisible(true)}
      >
        保存
      </Button>
    </PageContainer>
  );
};

export default BlogWrite;
