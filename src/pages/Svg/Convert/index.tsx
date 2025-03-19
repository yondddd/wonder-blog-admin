import React, { useState } from 'react';
import { Upload, Button, message, Select, Row, Col, Card, Empty } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import { SwapOutlined, InboxOutlined, FullscreenOutlined } from '@ant-design/icons';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';
import styles from './index.module.less';

const { Option } = Select;
const { Dragger } = Upload;

const Convert: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [svgUrl, setSvgUrl] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleUpload = ({ file, fileList }: any) => {
    setFileList(fileList);

    if (file.status === 'removed') {
      setSvgUrl('');
      return;
    }

    const fileToRead = file.originFileObj || file;
    if (fileToRead instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => setSvgUrl(e.target?.result as string);
      reader.readAsDataURL(fileToRead);
    }
  };

  const beforeUpload = (file: RcFile) => {
    const isSvg = file.type === 'image/svg+xml';
    if (!isSvg) {
      message.error('只能上传 SVG 文件!');
      return Upload.LIST_IGNORE;
    }
    return false; // 阻止自动上传
  };

  const handleConvert = () => {
    if (!selectedFormat) {
      message.warning('请先选择要转换的格式');
      return;
    }
    if (!svgUrl) {
      message.warning('请先上传SVG文件');
      return;
    }
    message.info(`转换为 ${selectedFormat.toUpperCase()} 的功能待实现`);
  };

  const resetUpload = () => {
    setFileList([]);
    setSvgUrl('');
    setSelectedFormat('');
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const content = (
    <>
      {isFullScreen && svgUrl ? (
        <div className={styles.fullScreenPreview}>
          <div className={styles.fullScreenControls}>
            <Button type="primary" icon={<FullscreenOutlined />} onClick={toggleFullScreen}>
              退出全屏
            </Button>
          </div>
          <div className={styles.fullScreenImage}>
            <img src={svgUrl} alt="SVG Preview" />
          </div>
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={15}>
            <Card title="SVG 文件" className={styles.uploadCard} bordered={false}>
              <Dragger
                accept=".svg"
                maxCount={1}
                fileList={fileList}
                beforeUpload={beforeUpload}
                onChange={handleUpload}
                onRemove={resetUpload}
                className={styles.dragger}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽SVG文件到此区域</p>
                <p className="ant-upload-hint">支持单个SVG文件上传</p>
              </Dragger>

              {svgUrl ? (
                <div className={styles.previewContainer}>
                  <div className={styles.previewHeader}>
                    <h3>预览</h3>
                    <Button type="link" icon={<FullscreenOutlined />} onClick={toggleFullScreen}>
                      全屏查看
                    </Button>
                  </div>
                  <div className={styles.preview}>
                    <img src={svgUrl} alt="SVG Preview" />
                  </div>
                </div>
              ) : (
                <Empty description="暂无预览" className={styles.emptyPreview} />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={9}>
            <Card title="转换设置" className={styles.convertCard} bordered={false}>
              <div className={styles.convertForm}>
                <div className={styles.formItem}>
                  <label>目标格式</label>
                  <Select
                    placeholder="请选择要转换的格式"
                    style={{ width: '100%' }}
                    value={selectedFormat || undefined}
                    onChange={setSelectedFormat}
                    size="large"
                  >
                    <Option value="png">PNG 格式</Option>
                    <Option value="jpeg">JPEG 格式</Option>
                    <Option value="tiff">TIFF 格式</Option>
                  </Select>
                </div>

                <div className={styles.formItem}>
                  <Button
                    type="primary"
                    icon={<SwapOutlined />}
                    onClick={handleConvert}
                    disabled={!selectedFormat || !svgUrl}
                    size="large"
                    block
                  >
                    开始转换
                  </Button>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}
    </>
  );

  return (
    <PageContainer
      header={{
        title: 'SVG 图片转换工具',
        ghost: true,
      }}
      className={styles.pageContainer}
    >
      {content}
    </PageContainer>
  );
};

export default Convert;
