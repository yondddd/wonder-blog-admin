/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { CharacterLimitPlugin } from '@lexical/react/LexicalCharacterLimitPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import LexicalClickableLinkPlugin, {ClickableLinkPlugin} from '@lexical/react/LexicalClickableLinkPlugin';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { useEffect, useState } from 'react';
import { createWebsocketProvider } from './collaboration';
import { SettingsContext, useSettings } from './context/SettingsContext';
import { SharedHistoryContext, useSharedHistoryContext } from './context/SharedHistoryContext';
import ActionsPlugin from './plugins/ActionsPlugin';
import AutocompletePlugin from './plugins/AutocompletePlugin';
import AutoEmbedPlugin from './plugins/AutoEmbedPlugin';
import AutoLinkPlugin from './plugins/AutoLinkPlugin';
import CodeActionMenuPlugin from './plugins/CodeActionMenuPlugin';
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin';
import CollapsiblePlugin from './plugins/CollapsiblePlugin';
import CommentPlugin from './plugins/CommentPlugin';
import ComponentPickerPlugin from './plugins/ComponentPickerPlugin';
import ContextMenuPlugin from './plugins/ContextMenuPlugin';
import DragDropPaste from './plugins/DragDropPastePlugin';
import DraggableBlockPlugin from './plugins/DraggableBlockPlugin';
import EmojiPickerPlugin from './plugins/EmojiPickerPlugin';
import EmojisPlugin from './plugins/EmojisPlugin';
import EquationsPlugin from './plugins/EquationsPlugin';
import ExcalidrawPlugin from './plugins/ExcalidrawPlugin';
import FigmaPlugin from './plugins/FigmaPlugin';
import FloatingLinkEditorPlugin from './plugins/FloatingLinkEditorPlugin';
import FloatingTextFormatToolbarPlugin from './plugins/FloatingTextFormatToolbarPlugin';
import ImagesPlugin from './plugins/ImagesPlugin';
import InlineImagePlugin from './plugins/InlineImagePlugin';
import KeywordsPlugin from './plugins/KeywordsPlugin';
import { LayoutPlugin } from './plugins/LayoutPlugin/LayoutPlugin';
import LinkPlugin from './plugins/LinkPlugin';
import MarkdownShortcutPlugin from './plugins/MarkdownShortcutPlugin';
import { MaxLengthPlugin } from './plugins/MaxLengthPlugin';
import MentionsPlugin from './plugins/MentionsPlugin';
import PageBreakPlugin from './plugins/PageBreakPlugin';
import PollPlugin from './plugins/PollPlugin';
import SpeechToTextPlugin from './plugins/SpeechToTextPlugin';
import TabFocusPlugin from './plugins/TabFocusPlugin';
import TableCellActionMenuPlugin from './plugins/TableActionMenuPlugin';
import TableCellResizer from './plugins/TableCellResizer';
import TableOfContentsPlugin from './plugins/TableOfContentsPlugin';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import TreeViewPlugin from './plugins/TreeViewPlugin';
import TwitterPlugin from './plugins/TwitterPlugin';
import YouTubePlugin from './plugins/YouTubePlugin';
import ContentEditable from './ui/ContentEditable';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import PlaygroundNodes from '@/components/Editor/nodes/PlaygroundNodes';
import './index.css';
import theme from '@/components/Editor/themes/PlaygroundEditorTheme';
import { TableContext } from '@/components/Editor/plugins/TablePlugin';
import Settings from '@/components/Editor/Settings';
import { ToolbarContext } from '@/components/Editor/context/ToolbarContext';
import SpecialTextPlugin from '@/components/Editor/plugins/SpecialTextPlugin';
import TableHoverActionsPlugin from '@/components/Editor/plugins/TableHoverActionsPlugin';
import ShortcutsPlugin from '@/components/Editor/plugins/ShortcutsPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { FlashMessageContext } from '@/components/Editor/context/FlashMessageContext';
import React from 'react';
import {useLexicalEditable} from "@lexical/react/useLexicalEditable";
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';

// 基础接口，包含共有属性
interface BaseEditorProps {
  debug?: boolean;
  showTableOfContent?: boolean;
  children?: React.ReactNode;
}

// 编辑器组件接口，只需要基础属性
interface EditorProps extends BaseEditorProps {}

// 应用组件接口，扩展基础属性
interface AppProps extends BaseEditorProps {
  initialContent?: string;
  readOnly?: boolean;
}

// 导出的主组件接口，与 App 接口相同
export interface LexicalEditorProps extends AppProps {}

function Editor({
  debug = false,
  showTableOfContent = false,
  children,
}: EditorProps): JSX.Element {
  const { historyState } = useSharedHistoryContext();
  const {
    settings: {
      isCollab,
      isAutocomplete,
      isMaxLength,
      isCharLimit,
      hasLinkAttributes,
      isCharLimitUtf8,
      isRichText,
      shouldUseLexicalContextMenu,
      shouldPreserveNewLinesInMarkdown,
      tableCellMerge,
      tableCellBackgroundColor,
      tableHorizontalScroll,
      shouldAllowHighlightingWithBrackets,
    },
  } = useSettings();
  const isEditable = useLexicalEditable();
  const placeholder = isCollab
    ? 'Enter some collaborative rich text...'
    : isRichText
      ? 'Enter some rich text...'
      : 'Enter some plain text...';
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null);
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  let floatingAnchorElementPlugins = null;
  if (floatingAnchorElem) {
    floatingAnchorElementPlugins = (
      <>
        <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
        <CodeActionMenuPlugin anchorElem={floatingAnchorElem} />
        <FloatingLinkEditorPlugin
          anchorElem={floatingAnchorElem}
          isLinkEditMode={isLinkEditMode}
          setIsLinkEditMode={setIsLinkEditMode}
        />
        <TableCellActionMenuPlugin anchorElem={floatingAnchorElem} cellMerge={true} />
        <TableHoverActionsPlugin anchorElem={floatingAnchorElem} />
      </>
    );
  }

  return (
    <>
      {isRichText && (
        <ToolbarPlugin
          editor={editor}
          activeEditor={activeEditor}
          setActiveEditor={setActiveEditor}
          setIsLinkEditMode={setIsLinkEditMode}
        />
      )}
      {isRichText && (
        <ShortcutsPlugin editor={activeEditor} setIsLinkEditMode={setIsLinkEditMode} />
      )}
      <div
        className={`editor-container ${debug ? 'tree-view' : ''} ${
          !isRichText ? 'plain-text' : ''
        }`}
      >
        {children}

        {isMaxLength && <MaxLengthPlugin maxLength={30} />}
        <DragDropPaste />
        <AutoFocusPlugin />
        <ClearEditorPlugin />
        <ComponentPickerPlugin />
        <EmojiPickerPlugin />
        <AutoEmbedPlugin />

        <MentionsPlugin />
        <EmojisPlugin />
        <HashtagPlugin />
        <KeywordsPlugin />
        <SpeechToTextPlugin />
        <AutoLinkPlugin />
        <CommentPlugin providerFactory={isCollab ? createWebsocketProvider : undefined} />
        {isRichText ? (
          <>
            {isCollab ? (
              <CollaborationPlugin
                id="main"
                providerFactory={createWebsocketProvider}
                shouldBootstrap={!skipCollaborationInit}
              />
            ) : (
              <HistoryPlugin externalHistoryState={historyState} />
            )}
            <RichTextPlugin
              contentEditable={
                <div className="editor-scroller">
                  <div className="editor" ref={onRef}>
                    <ContentEditable placeholder={placeholder} />
                  </div>
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <MarkdownShortcutPlugin />
            <CodeHighlightPlugin />
            <ListPlugin />
            <CheckListPlugin />
            <TablePlugin
              hasCellMerge={tableCellMerge}
              hasCellBackgroundColor={tableCellBackgroundColor}
              hasHorizontalScroll={tableHorizontalScroll}
            />
            <TableCellResizer />
            <ImagesPlugin />
            <InlineImagePlugin />
            <LinkPlugin hasLinkAttributes={hasLinkAttributes} />
            <PollPlugin />
            <TwitterPlugin />
            <YouTubePlugin />
            <FigmaPlugin />
            <ClickableLinkPlugin disabled={isEditable} />
            <HorizontalRulePlugin />
            <EquationsPlugin />
            <ExcalidrawPlugin />
            <TabFocusPlugin />
            <TabIndentationPlugin maxIndent={7} />
            <CollapsiblePlugin />
            <PageBreakPlugin />
            <LayoutPlugin />
            {floatingAnchorElem && (
              <>
                <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
                <CodeActionMenuPlugin anchorElem={floatingAnchorElem} />
                <FloatingLinkEditorPlugin
                  anchorElem={floatingAnchorElem}
                  isLinkEditMode={isLinkEditMode}
                  setIsLinkEditMode={setIsLinkEditMode}
                />
                <TableCellActionMenuPlugin
                  anchorElem={floatingAnchorElem}
                  cellMerge={true}
                />
                <TableHoverActionsPlugin anchorElem={floatingAnchorElem} />
                <FloatingTextFormatToolbarPlugin
                  anchorElem={floatingAnchorElem}
                  setIsLinkEditMode={setIsLinkEditMode}
                />
              </>
            )}
          </>
        ) : (
          <>
            <PlainTextPlugin
              contentEditable={<ContentEditable placeholder={placeholder} />}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin externalHistoryState={historyState} />
          </>
        )}
        {(isCharLimit || isCharLimitUtf8) && (
          <CharacterLimitPlugin charset={isCharLimit ? 'UTF-16' : 'UTF-8'} maxLength={5} />
        )}
        {isAutocomplete && <AutocompletePlugin />}
        <div>{showTableOfContent && <TableOfContentsPlugin />}</div>
        {shouldUseLexicalContextMenu && <ContextMenuPlugin />}
        {shouldAllowHighlightingWithBrackets && <SpecialTextPlugin />}
        <ActionsPlugin
          isRichText={isRichText}
          shouldPreserveNewLinesInMarkdown={shouldPreserveNewLinesInMarkdown}
        />
      </div>
      {debug && <TreeViewPlugin />}
    </>
  );
}
// 修改后的EditorWrapper组件
function EditorWrapper({
  initialContent,
  debug,
  showTableOfContent,
  readOnly,
  children,
}: AppProps) {
  const [editor] = useLexicalComposerContext(); // 现在这里可以正确获取上下文

  // 添加手动更新editorState的effect
  useEffect(() => {
    if (initialContent) {
      try {
        // 尝试解析JSON格式的内容
        let contentToLoad = initialContent;
        try {
          // 检查是否是JSON字符串
          JSON.parse(initialContent);
        } catch (e) {
          // 如果不是JSON字符串，则尝试创建一个包含文本的简单editorState
          contentToLoad = JSON.stringify({
            root: {
              children: [
                {
                  children: [
                    {
                      detail: 0,
                      format: 0,
                      mode: "normal",
                      style: "",
                      text: initialContent,
                      type: "text",
                      version: 1
                    }
                  ],
                  direction: "ltr",
                  format: "",
                  indent: 0,
                  type: "paragraph",
                  version: 1
                }
              ],
              direction: "ltr",
              format: "",
              indent: 0,
              type: "root",
              version: 1
            }
          });
        }

        const newState = editor.parseEditorState(contentToLoad);
        editor.setEditorState(newState);
      } catch (error) {
        console.error('手动更新editorState失败:', error);

        // 如果解析失败，尝试创建一个包含纯文本的editorState
        try {
          editor.update(() => {
            const root = editor.getRootElement();
            if (root) {
              root.innerHTML = initialContent;
            }
          });
        } catch (e) {
          console.error('回退更新editorState也失败:', e);
        }
      }
    }
  }, [initialContent, editor]);

  return (
    <SharedHistoryContext>
      <TableContext>
        <ToolbarContext>
          <div className="editor-shell">
            <Editor debug={debug} showTableOfContent={showTableOfContent}>
              {children}
            </Editor>
          </div>
          <Settings />
        </ToolbarContext>
      </TableContext>
    </SharedHistoryContext>
  );
}

// 修改后的App组件
function App({
  initialContent,
  debug,
  showTableOfContent,
  readOnly,
  children,
}: AppProps) {
  const editorConfig = {
    namespace: 'Playground',
    nodes: [...PlaygroundNodes],
    onError: (error: Error) => {
      throw error;
    },
    theme: theme,
    editable: !readOnly,
    editorState: initialContent
      ? (editor: any) => {
          try {
            return editor.parseEditorState(initialContent);
          } catch (error) {
            console.error('初始化editorState失败:', error);
            return editor.getEditorState();
          }
        }
      : undefined,
  };

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <EditorWrapper
        initialContent={initialContent}
        debug={debug}
        showTableOfContent={showTableOfContent}
        readOnly={readOnly}
      >
        {children}
      </EditorWrapper>
    </LexicalComposer>
  );
}

export default function LexicalEditor({
  initialContent,
  debug = false,
  showTableOfContent = false,
  readOnly = false,
  children,
}: LexicalEditorProps): JSX.Element {
  return (
      <SettingsContext>
        <FlashMessageContext>
          <App
            initialContent={initialContent}
            debug={debug}
            showTableOfContent={showTableOfContent}
            readOnly={readOnly}
          >
            {children}
          </App>
        </FlashMessageContext>
      </SettingsContext>
  );
}
