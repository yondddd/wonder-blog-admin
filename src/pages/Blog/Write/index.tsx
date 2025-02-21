import React, { useEffect, useRef, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Checkbox,
  Form,
  type FormInstance,
  Input,
  message,
  Modal,
  Radio,
  Select,
} from 'antd';
import { history } from '@umijs/max';
import LexicalEditor from '@/components/Editor';
import { getBlogById, saveBlog, updateBlog } from '@/services/ant-design-pro/blogApi';

import type { BlogItem, CategoryListItem, TagListItem } from '@/services/ant-design-pro/types';

import { listAllCategory } from '@/services/ant-design-pro/categoryApi';
import { listAllTag } from '@/services/ant-design-pro/tagApi';

const { Option } = Select;

const BlogWrite: React.FC = () => {
  const [form] = Form.useForm<FormInstance>();
  const [categoryList, setCategoryList] = useState<CategoryListItem[]>([]);
  const [tagList, setTagList] = useState<TagListItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [visibilityModalVisible, setVisibilityModalVisible] = useState(false);
  const [visibilityType, setVisibilityType] = useState<1 | 2 | 3>(1);
  const [initialValues, setInitialValues] = useState<Partial<BlogItem>>({});
  const saveTimer = useRef<NodeJS.Timeout>();
  const [contentVersion, setContentVersion] = useState(0);

  // 初始化数据加载
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categories, tags] = await Promise.all([listAllCategory(), listAllTag()]);
        setCategoryList(categories.data || []);
        setTagList(tags.data || []);
      } catch (error) {
        message.error('初始化数据加载失败');
      }
    };

    const blogId = history.location.pathname.split('/').pop();
    if (blogId && blogId !== 'create') {
      getBlogById({ id: Number(blogId) }).then((res) => {
        const data = res.data;
        form.setFieldsValue(data);
        setInitialValues(data);
        setSelectedTags(data.tags?.map((t) => t.name) || []);
        setVisibilityType(data.published ? (data.password ? 3 : 1) : 2);
      });
    }

    loadData();
    startAutoSave();
    return () => clearInterval(saveTimer.current);
  }, []);

  // 自动保存逻辑
  const startAutoSave = () => {
    saveTimer.current = setInterval(() => {
      form.validateFields().then((values) => {
        handleSubmit(values, true);
      });
    }, 30000);
  };

  const handleSubmit = async (values: any, autoSave = false) => {
    const payload = {
      ...values,
      tags: selectedTags.map((t) => ({ name: t })),
      published: visibilityType !== 2,
      password: visibilityType === 3 ? values.password : '',
    };

    try {
      const result = await (initialValues.id ? updateBlog(payload) : saveBlog(payload));
      if (!autoSave) message.success(result.message);
      if (!initialValues.id) history.push(`/blog/edit/${result.data}`);
    } catch (error) {
      message.error('保存失败');
    }
  };

  // 分类选择处理
  const handleCategorySearch = (value: string) => {
    if (value && !categoryList.some((c) => c.name === value)) {
      setCategoryList([...categoryList, { id: -1, name: value }]);
    }
  };

  // 标签选择处理
  const handleTagChange = (tags: string[]) => {
    const newTags = tags.filter((t) => !tagList.some((lt) => lt.name === t));
    if (newTags.length) {
      setTagList([...tagList, ...newTags.map((t) => ({ id: -1, name: t }))]);
    }
    setSelectedTags(tags);
  };

  return (
    <PageContainer title={initialValues.id ? '编辑文章' : '新建文章'}>
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={(values) => setVisibilityModalVisible(true)}
      >
        <Form.Item label="文章标题" name="title" rules={[{ required: true }]}>
          <Input placeholder="请输入标题" />
        </Form.Item>

        <Form.Item label="文章首图" name="firstPicture" rules={[{ required: true }]}>
          <Input placeholder="输入图片URL或上传图片" />
        </Form.Item>

        <div className="flex gap-4">
          <Form.Item label="分类" name={['category', 'name']} rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="选择或创建分类"
              onSearch={handleCategorySearch}
              filterOption={(input, option) =>
                option?.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {categoryList.map((category) => (
                <Option key={category.id} value={category.name}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="标签" rules={[{ required: true }]}>
            <Select
              mode="multiple"
              placeholder="选择或创建标签"
              value={selectedTags}
              onChange={handleTagChange}
              filterOption={(input, option) =>
                option?.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {tagList.map((tag) => (
                <Option key={tag.id} value={tag.name}>
                  {tag.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <Form.Item label="文章摘要" name="description" rules={[{ required: true }]}>
          <LexicalEditor
            initialContent={initialValues.description}
            onChange={(value) => form.setFieldValue('description', value)}
          />
        </Form.Item>

        <Form.Item label="文章正文" name="content" rules={[{ required: true }]}>
          <LexicalEditor
            debug={true}
            key={`content-${contentVersion}`}
            initialContent={initialValues.content}
            onChange={(value) => form.setFieldValue('content', value)}
          />
        </Form.Item>

        <div className="flex gap-4">
          <Form.Item label="字数统计" name="words" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item label="阅读时长（分钟）" name="readTime">
            <Input type="number" disabled />
          </Form.Item>
        </div>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            保存设置
          </Button>
        </Form.Item>
      </Form>

      {/* 可见性设置模态框 */}
      <Modal
        title="可见性设置"
        open={visibilityModalVisible}
        onCancel={() => setVisibilityModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setVisibilityModalVisible(false)}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={() => form.submit()}>
            保存
          </Button>,
          <Button
            key="preview"
            type="primary"
            onClick={() => {
              form.submit();
              history.push(`/blog/preview/${initialValues.id}`);
            }}
          >
            保存并预览
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="可见性设置">
            <Radio.Group value={visibilityType} onChange={(e) => setVisibilityType(e.target.value)}>
              <Radio value={1}>公开</Radio>
              <Radio value={2}>私密</Radio>
              <Radio value={3}>密码保护</Radio>
            </Radio.Group>
          </Form.Item>

          {visibilityType === 3 && (
            <Form.Item label="访问密码" name="password" rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item label="功能开关">
            <Checkbox.Group className="grid grid-cols-2 gap-4">
              <Checkbox name="appreciation">开启赞赏</Checkbox>
              <Checkbox name="recommend">开启推荐</Checkbox>
              <Checkbox name="commentEnabled">开启评论</Checkbox>
              <Checkbox name="top">开启置顶</Checkbox>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default BlogWrite;
