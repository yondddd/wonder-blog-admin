import React, { useEffect } from 'react';
import { Modal, Form, Input, Radio, Button, Switch } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { BlogListItem, BlogVisibilityFormValues,VisibilityType } from '@/services/types/blogType';
import { VISIBILITY_OPTIONS, BLOG_FEATURE_OPTIONS } from '../constants';

interface VisibilityModalProps {
  visible: boolean;
  currentBlog?: BlogListItem;
  onCancel: () => void;
  onSubmit: (values: BlogVisibilityFormValues) => Promise<void>;
}

const VisibilityModal: React.FC<VisibilityModalProps> = ({
  visible,
  currentBlog,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm<BlogVisibilityFormValues>();

  useEffect(() => {
    if (currentBlog && visible) {
      const visibilityType = currentBlog.published
        ? (currentBlog.password ? VisibilityType.PASSWORD_PROTECTED : VisibilityType.PUBLIC)
        : VisibilityType.PRIVATE;

      form.setFieldsValue({
        ...currentBlog,
        radio: visibilityType,
      });
    }
  }, [currentBlog, form, visible]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const radioValue = Form.useWatch('radio', form);
  const isPasswordProtected = radioValue === VisibilityType.PASSWORD_PROTECTED;
  const isPrivate = radioValue === VisibilityType.PRIVATE;

  return (
    <Modal
      title="文章可见性设置"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          确定
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item name="radio" label="可见性">
          <Radio.Group>
            {VISIBILITY_OPTIONS.map((option) => (
              <Radio key={option.value} value={option.value}>
                {option.label}
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>

        {isPasswordProtected && (
          <Form.Item
            name="password"
            label="访问密码"
            rules={[{ required: true, message: '请输入访问密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入访问密码" />
          </Form.Item>
        )}

        {!isPrivate && (
          <Form.Item label="功能设置">
            {BLOG_FEATURE_OPTIONS.map((option) => (
              <Form.Item
                key={option.name}
                name={option.name}
                valuePropName="checked"
                style={{ marginBottom: 8 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{option.label}</span>
                  <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                </div>
              </Form.Item>
            ))}
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default VisibilityModal;
