/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type {TableOfContentsEntry} from '@lexical/react/LexicalTableOfContentsPlugin';
import type {HeadingTagType} from '@lexical/rich-text';
import type {NodeKey} from 'lexical';
import type {JSX} from 'react';

import './index.css';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {TableOfContentsPlugin as LexicalTableOfContentsPlugin} from '@lexical/react/LexicalTableOfContentsPlugin';
import {useEffect, useRef, useState} from 'react';
import * as React from 'react';

// 动态获取编辑器顶部位置
function getEditorTopMargin(): number {
  const editorElement = document.querySelector('.editor-shell');
  if (editorElement) {
    const rect = editorElement.getBoundingClientRect();
    return rect.top + window.scrollY;
  }
  return 200; // 默认值
}

function indent(tagName: HeadingTagType) {
  if (tagName === 'h2') {
    return 'heading2';
  } else if (tagName === 'h3') {
    return 'heading3';
  }
  return '';
}

/**
 * 判断标题在视口中的位置
 * @returns -1: 在视口上方, 0: 在视口中, 1: 在视口下方
 */
function getHeadingViewportPosition(element: HTMLElement): number {
  if (!element) return 1; // 默认在下方

  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

  // 元素完全在视口上方
  if (rect.bottom < 0) return -1;

  // 元素完全在视口下方
  if (rect.top > viewportHeight) return 1;

  // 元素在视口中
  return 0;
}

/**
 * 找出最适合选中的标题
 * 策略: 1. 优先选择在视口中的标题
 *      2. 如果没有在视口中的标题，选择最接近视口的标题
 */
function findBestHeadingToSelect(
  tableOfContents: Array<TableOfContentsEntry>,
  editor: any
): NodeKey | null {
  if (tableOfContents.length === 0) return null;

  // 所有标题的位置信息
  const headingPositions: {key: NodeKey, position: number, distance: number}[] = [];

  // 计算每个标题在视口中的位置
  for (const [key] of tableOfContents) {
    const element = editor.getElementByKey(key);
    if (!element) continue;

    const position = getHeadingViewportPosition(element);
    const rect = element.getBoundingClientRect();

    // 计算到视口顶部或底部的距离
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    let distance = 0;

    if (position === -1) { // 在视口上方
      distance = Math.abs(rect.bottom);
    } else if (position === 1) { // 在视口下方
      distance = Math.abs(rect.top - viewportHeight);
    } else { // 在视口中
      // 到视口中心的距离
      distance = Math.abs(rect.top + rect.height / 2 - viewportHeight / 2);
    }

    headingPositions.push({ key, position, distance });
  }

  if (headingPositions.length === 0) return null;

  // 找出在视口中的标题
  const visibleHeadings = headingPositions.filter(h => h.position === 0);

  if (visibleHeadings.length > 0) {
    // 如果有在视口中的标题，选择距离视口顶部最近的
    visibleHeadings.sort((a, b) => a.distance - b.distance);
    return visibleHeadings[0].key;
  }

  // 如果没有在视口中的标题
  // 查找刚刚移出视口上方的标题
  const aboveHeadings = headingPositions.filter(h => h.position === -1);
  // 查找在视口下方的标题
  const belowHeadings = headingPositions.filter(h => h.position === 1);

  if (aboveHeadings.length > 0) {
    // 优先选择刚刚移出视口上方的标题
    aboveHeadings.sort((a, b) => a.distance - b.distance);
    return aboveHeadings[0].key;
  }

  if (belowHeadings.length > 0) {
    // 然后选择即将进入视口的下方标题
    belowHeadings.sort((a, b) => a.distance - b.distance);
    return belowHeadings[0].key;
  }

  // 如果都没有，选择第一个标题
  return tableOfContents[0][0];
}

// 箭头图标组件 - 简化SVG路径，使用标准箭头形状
const ChevronIcon = ({ isExpanded }: { isExpanded: boolean }) => (
  <svg
    className={`toc-chevron-icon ${isExpanded ? 'expanded' : 'collapsed'}`}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 使用简单清晰的箭头形状，CSS旋转控制方向 */}
    <path
      d="M4 6L8 10L12 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 全部展开/折叠按钮组件
const ExpandAllButton = ({
  isAllExpanded,
  onClick
}: {
  isAllExpanded: boolean;
  onClick: () => void;
}) => (
  <button className="toc-expand-all-button" onClick={onClick} title={isAllExpanded ? "全部折叠" : "全部展开"}>
    {isAllExpanded ? "折叠" : "展开"}
  </button>
);

function TableOfContentsList({
  tableOfContents,
}: {
  tableOfContents: Array<TableOfContentsEntry>;
}): JSX.Element {
  const [selectedKey, setSelectedKey] = useState('');
  const [editor] = useLexicalComposerContext();
  const lastScrollY = useRef(0);
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // 用于追踪用户是否手动点击了标题
  const isManuallySelected = useRef(false);
  const manualSelectionTimeout = useRef<number | null>(null);

  // 优化点击处理函数
  function scrollToNode(key: NodeKey, index: number) {
    try {
      editor.getEditorState().read(() => {
        const domElement = editor.getElementByKey(key);
        if (domElement !== null) {
          // 标记为手动选中
          isManuallySelected.current = true;

          // 先设置选中状态
          setSelectedKey(key);

          // 再滚动到元素
          domElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          // 3秒后恢复自动选中
          if (manualSelectionTimeout.current) {
            window.clearTimeout(manualSelectionTimeout.current);
          }
          manualSelectionTimeout.current = window.setTimeout(() => {
            isManuallySelected.current = false;
            manualSelectionTimeout.current = null;
          }, 3000);
        }
      });
    } catch (error) {
      console.error('Error scrolling to node:', error);
    }
  }

  // 处理折叠/展开逻辑
  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // 处理全部折叠/展开
  const toggleAllSections = () => {
    const newExpandedState = !isAllExpanded;
    setIsAllExpanded(newExpandedState);

    // 创建一个包含所有标题的展开状态对象
    const newExpandedSections: Record<string, boolean> = {};
    tableOfContents.forEach(([key]) => {
      newExpandedSections[key as string] = newExpandedState;
    });

    setExpandedSections(newExpandedSections);
  };

  // 监听滚动，更新当前选中的标题
  useEffect(() => {
    if (tableOfContents.length === 0) return;

    function updateSelectedHeading() {
      // 如果是手动选中状态，则不更新
      if (isManuallySelected.current) return;

      // 找出最适合选中的标题
      const bestHeadingKey = findBestHeadingToSelect(tableOfContents, editor);
      if (bestHeadingKey) {
        setSelectedKey(bestHeadingKey);
      }
    }

    // 使用节流函数减少滚动事件的触发频率
    let isScrolling = false;
    function onScroll() {
      // 记录滚动方向
      const currentScrollY = window.scrollY;
      lastScrollY.current = currentScrollY;

      if (!isScrolling) {
        window.requestAnimationFrame(() => {
          updateSelectedHeading();
          isScrolling = false;
        });
        isScrolling = true;
      }
    }

    // 初始更新
    updateSelectedHeading();

    // 添加滚动监听
    window.addEventListener('scroll', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      // 清除可能存在的超时
      if (manualSelectionTimeout.current) {
        window.clearTimeout(manualSelectionTimeout.current);
      }
    };
  }, [tableOfContents, editor]);

  // 获取标题层级
  const getHeadingLevel = (tag: HeadingTagType | undefined): number => {
    if (!tag) return 1;
    return parseInt(tag.substring(1), 10) || 1;
  };

  // 构建目录树结构
  const buildTocTree = () => {
    // 如果没有目录项，返回空数组
    if (tableOfContents.length === 0) {
      return [];
    }

    // 构建目录树
    const tocTree: Array<{
      key: NodeKey;
      text: string;
      tag: HeadingTagType;
      level: number;
      index: number;
      children: any[];
      parent: NodeKey | null;
    }> = [];

    // 当前父节点栈
    const parentStack: NodeKey[] = [];
    let lastLevel = 0;

    tableOfContents.forEach(([key, text, tag], index) => {
      const level = getHeadingLevel(tag);

      // 找到正确的父节点
      while (lastLevel >= level && parentStack.length > 0) {
        parentStack.pop();
        lastLevel--;
      }

      const item = {
        key,
        text,
        tag,
        level,
        index,
        children: [],
        parent: parentStack.length > 0 ? parentStack[parentStack.length - 1] : null
      };

      if (level === 1) {
        // 一级标题直接加入主树
        tocTree.push(item);
      } else {
        // 非一级标题，找到它的父节点并添加
        const findAndAddToParent = (items: any[]) => {
          for (const parent of items) {
            if (parent.key === parentStack[parentStack.length - 1]) {
              parent.children.push(item);
              return true;
            }
            if (parent.children.length > 0 && findAndAddToParent(parent.children)) {
              return true;
            }
          }
          return false;
        };

        findAndAddToParent(tocTree);
      }

      // 更新父节点栈
      parentStack.push(key);
      lastLevel = level;
    });

    return tocTree;
  };

  // 渲染目录项
  const renderTocItem = (item: any, isNested = false) => {
    const isSelected = selectedKey === item.key;
    const isExpanded = expandedSections[item.key as string] || isAllExpanded;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div
        className={`toc-item-wrapper ${isSelected ? 'selected-heading-wrapper' : ''} ${isNested ? 'nested-item' : ''}`}
        key={item.key}
      >
        <div className="toc-item-row">
          {/* 箭头按钮容器，与文本水平对齐 */}
          <div className="toc-toggle-container">
            {hasChildren && (
              <button
                className="toc-toggle-button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection(item.key as string);
                }}
                aria-label={isExpanded ? "折叠" : "展开"}
                title={isExpanded ? "折叠" : "展开"}
              >
                <ChevronIcon isExpanded={isExpanded} />
              </button>
            )}
            {/* 没有子项时也保留空间 */}
            {!hasChildren && <div className="toc-toggle-placeholder"></div>}
          </div>

          {/* 内容区域 */}
          <div
            className="toc-item-content"
            onClick={() => scrollToNode(item.key, item.index)}
          >
            <span
              className={`toc-item ${isSelected ? 'selected-heading' : ''} ${
                item.level === 1 ? 'first-heading' : indent(item.tag)
              }`}
              role="button"
              tabIndex={0}
            >
              {item.text.length > 24 ? item.text.substring(0, 24) + '...' : item.text}
            </span>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="toc-children">
            {item.children.map((child: any) => renderTocItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  // 如果没有目录项，返回空元素
  if (tableOfContents.length === 0) {
    return <></>;
  }

  const tocTree = buildTocTree();

  return (
    <div className="table-of-contents">
      <div className="toc-header">
        <div className="toc-title">目录</div>
        <ExpandAllButton
          isAllExpanded={isAllExpanded}
          onClick={toggleAllSections}
        />
      </div>
      <div className="toc-content">
        {tocTree.map(item => renderTocItem(item))}
      </div>
    </div>
  );
}

export default function TableOfContentsPlugin() {
  // 控制整个目录组件的折叠/展开状态 - 修改为默认展开
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 保存目录的展开状态，在收起整个目录再展开时能保持不变
  // 初始展开所有一级标题
  const [savedExpandedSections, setSavedExpandedSections] = useState<Record<string, boolean>>({});
  const [savedIsAllExpanded, setSavedIsAllExpanded] = useState(false);

  // 初始化展开标志，用于标记是否已经初始化了展开状态
  const hasInitializedExpand = useRef(false);

  // 缓存表格内容，以便在重新打开时复用
  const [cachedTableOfContents, setCachedTableOfContents] = useState<Array<TableOfContentsEntry>>([]);

  // 当获取到目录内容时进行缓存
  const handleTableOfContents = (tableOfContents: Array<TableOfContentsEntry>) => {
    if (tableOfContents.length > 0) {
      setCachedTableOfContents(tableOfContents);

      // 只在首次加载时初始化一级标题的展开状态
      if (!hasInitializedExpand.current) {
        const initialExpandedSections: Record<string, boolean> = {};

        // 遍历找出所有的一级标题并标记为展开
        tableOfContents.forEach(([key, _, tag]) => {
          if (tag === 'h1') {
            initialExpandedSections[key as string] = true;
          }
        });

        setSavedExpandedSections(initialExpandedSections);
        hasInitializedExpand.current = true;
      }
    }
    return tableOfContents;
  };

  // 接收子组件状态变更的回调
  const handleExpandStateChange = (
    expandedSections: Record<string, boolean>,
    isAllExpanded: boolean
  ) => {
    setSavedExpandedSections(expandedSections);
    setSavedIsAllExpanded(isAllExpanded);
  };

  return (
    <div className={`toc-container ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      <button
        className="toc-collapse-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "展开目录" : "折叠目录"}
      >
        {isCollapsed ? (
          <span className="toc-icon">📑</span>
        ) : (
          <span className="toc-icon">✕</span>
        )}
      </button>

      {!isCollapsed && (
        <LexicalTableOfContentsPlugin>
          {(tableOfContents) => {
            // 处理并缓存目录内容
            const currentContents = handleTableOfContents(tableOfContents);

            // 只有在有标题时才显示目录
            if (currentContents.length === 0) {
              return <div className="toc-empty">没有目录项</div>;
            }

            return (
              <TableOfContentsListWithState
                tableOfContents={currentContents}
                initialExpandedSections={savedExpandedSections}
                initialIsAllExpanded={savedIsAllExpanded}
                onExpandStateChange={handleExpandStateChange}
              />
            );
          }}
        </LexicalTableOfContentsPlugin>
      )}
    </div>
  );
}

// 包装组件，接收初始展开状态和变更回调
function TableOfContentsListWithState({
  tableOfContents,
  initialExpandedSections,
  initialIsAllExpanded,
  onExpandStateChange
}: {
  tableOfContents: Array<TableOfContentsEntry>;
  initialExpandedSections: Record<string, boolean>;
  initialIsAllExpanded: boolean;
  onExpandStateChange: (
    expandedSections: Record<string, boolean>,
    isAllExpanded: boolean
  ) => void;
}): JSX.Element {
  const [selectedKey, setSelectedKey] = useState('');
  const [editor] = useLexicalComposerContext();
  const lastScrollY = useRef(0);

  // 使用父组件传来的初始状态
  const [isAllExpanded, setIsAllExpanded] = useState(initialIsAllExpanded);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(initialExpandedSections);

  // 用于追踪用户是否手动点击了标题
  const isManuallySelected = useRef(false);
  const manualSelectionTimeout = useRef<number | null>(null);

  // 当展开状态变化时，通知父组件
  useEffect(() => {
    onExpandStateChange(expandedSections, isAllExpanded);
  }, [expandedSections, isAllExpanded, onExpandStateChange]);

  // 优化点击处理函数
  function scrollToNode(key: NodeKey, index: number) {
    try {
      editor.getEditorState().read(() => {
        const domElement = editor.getElementByKey(key);
        if (domElement !== null) {
          // 标记为手动选中
          isManuallySelected.current = true;

          // 先设置选中状态
          setSelectedKey(key);

          // 再滚动到元素
          domElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          // 3秒后恢复自动选中
          if (manualSelectionTimeout.current) {
            window.clearTimeout(manualSelectionTimeout.current);
          }
          manualSelectionTimeout.current = window.setTimeout(() => {
            isManuallySelected.current = false;
            manualSelectionTimeout.current = null;
          }, 3000);
        }
      });
    } catch (error) {
      console.error('Error scrolling to node:', error);
    }
  }

  // 处理折叠/展开逻辑
  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // 处理全部折叠/展开
  const toggleAllSections = () => {
    const newExpandedState = !isAllExpanded;
    setIsAllExpanded(newExpandedState);

    // 创建一个包含所有标题的展开状态对象
    const newExpandedSections: Record<string, boolean> = {};
    tableOfContents.forEach(([key]) => {
      newExpandedSections[key as string] = newExpandedState;
    });

    setExpandedSections(newExpandedSections);
  };

  // 监听滚动，更新当前选中的标题
  useEffect(() => {
    if (tableOfContents.length === 0) return;

    function updateSelectedHeading() {
      // 如果是手动选中状态，则不更新
      if (isManuallySelected.current) return;

      // 找出最适合选中的标题
      const bestHeadingKey = findBestHeadingToSelect(tableOfContents, editor);
      if (bestHeadingKey) {
        setSelectedKey(bestHeadingKey);
      }
    }

    // 使用节流函数减少滚动事件的触发频率
    let isScrolling = false;
    function onScroll() {
      // 记录滚动方向
      const currentScrollY = window.scrollY;
      lastScrollY.current = currentScrollY;

      if (!isScrolling) {
        window.requestAnimationFrame(() => {
          updateSelectedHeading();
          isScrolling = false;
        });
        isScrolling = true;
      }
    }

    // 初始更新
    updateSelectedHeading();

    // 添加滚动监听
    window.addEventListener('scroll', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      // 清除可能存在的超时
      if (manualSelectionTimeout.current) {
        window.clearTimeout(manualSelectionTimeout.current);
      }
    };
  }, [tableOfContents, editor]);

  // 获取标题层级
  const getHeadingLevel = (tag: HeadingTagType | undefined): number => {
    if (!tag) return 1;
    return parseInt(tag.substring(1), 10) || 1;
  };

  // 构建目录树结构
  const buildTocTree = () => {
    // 如果没有目录项，返回空数组
    if (tableOfContents.length === 0) {
      return [];
    }

    // 构建目录树
    const tocTree: Array<{
      key: NodeKey;
      text: string;
      tag: HeadingTagType;
      level: number;
      index: number;
      children: any[];
      parent: NodeKey | null;
    }> = [];

    // 当前父节点栈
    const parentStack: NodeKey[] = [];
    let lastLevel = 0;

    tableOfContents.forEach(([key, text, tag], index) => {
      const level = getHeadingLevel(tag);

      // 找到正确的父节点
      while (lastLevel >= level && parentStack.length > 0) {
        parentStack.pop();
        lastLevel--;
      }

      const item = {
        key,
        text,
        tag,
        level,
        index,
        children: [],
        parent: parentStack.length > 0 ? parentStack[parentStack.length - 1] : null
      };

      if (level === 1) {
        // 一级标题直接加入主树
        tocTree.push(item);
      } else {
        // 非一级标题，找到它的父节点并添加
        const findAndAddToParent = (items: any[]) => {
          for (const parent of items) {
            if (parent.key === parentStack[parentStack.length - 1]) {
              parent.children.push(item);
              return true;
            }
            if (parent.children.length > 0 && findAndAddToParent(parent.children)) {
              return true;
            }
          }
          return false;
        };

        findAndAddToParent(tocTree);
      }

      // 更新父节点栈
      parentStack.push(key);
      lastLevel = level;
    });

    return tocTree;
  };

  // 渲染目录项
  const renderTocItem = (item: any, isNested = false) => {
    const isSelected = selectedKey === item.key;
    const isExpanded = expandedSections[item.key as string] || isAllExpanded;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div
        className={`toc-item-wrapper ${isSelected ? 'selected-heading-wrapper' : ''} ${isNested ? 'nested-item' : ''}`}
        key={item.key}
      >
        <div className="toc-item-row">
          {/* 箭头按钮容器，与文本水平对齐 */}
          <div className="toc-toggle-container">
            {hasChildren && (
              <button
                className="toc-toggle-button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection(item.key as string);
                }}
                aria-label={isExpanded ? "折叠" : "展开"}
                title={isExpanded ? "折叠" : "展开"}
              >
                <ChevronIcon isExpanded={isExpanded} />
              </button>
            )}
            {/* 没有子项时也保留空间 */}
            {!hasChildren && <div className="toc-toggle-placeholder"></div>}
          </div>

          {/* 内容区域 */}
          <div
            className="toc-item-content"
            onClick={() => scrollToNode(item.key, item.index)}
          >
            <span
              className={`toc-item ${isSelected ? 'selected-heading' : ''} ${
                item.level === 1 ? 'first-heading' : indent(item.tag)
              }`}
              role="button"
              tabIndex={0}
            >
              {item.text.length > 24 ? item.text.substring(0, 24) + '...' : item.text}
            </span>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="toc-children">
            {item.children.map((child: any) => renderTocItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  // 如果没有目录项，返回空元素
  if (tableOfContents.length === 0) {
    return <></>;
  }

  const tocTree = buildTocTree();

  return (
    <div className="table-of-contents">
      <div className="toc-header">
        <div className="toc-title">目录</div>
        <ExpandAllButton
          isAllExpanded={isAllExpanded}
          onClick={toggleAllSections}
        />
      </div>
      <div className="toc-content">
        {tocTree.map(item => renderTocItem(item))}
      </div>
    </div>
  );
}
