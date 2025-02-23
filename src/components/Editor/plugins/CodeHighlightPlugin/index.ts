import type { JSX } from 'react';
import { useEffect } from 'react';
import { registerCodeHighlighting } from '@lexical/code';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Tokenizer } from '@lexical/code/CodeHighlighter';
import hljs from 'highlight.js';
import '/public/highlight.js-11.5.1/styles/atom-one-dark.css';

interface Token {
  content: string;
  type: string;
}

const CustomHighlightTokenizer: Tokenizer = {
  tokenize(text: string, language?: string): Token[] {
    console.log('come in ' + language);
    if (!language || language === 'plaintext') {
      return [{ content: text, type: 'text' }];
    }

    try {
      const result = hljs.highlight(text, {
        language,
        ignoreIllegals: true,
      });

      // Parse the HTML string to extract tokens
      const tokens: Token[] = [];
      const parser = new DOMParser();
      const doc = parser.parseFromString(result.value, 'text/html');

      function processNode(node: Node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const content = node.textContent;
          if (content && content.trim()) {
            tokens.push({
              content,
              type: 'text',
            });
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const className = element.className;
          const content = element.textContent;

          if (content && className.startsWith('hljs-')) {
            tokens.push({
              content,
              type: className.replace('hljs-', ''),
            });
          } else {
            // Process child nodes recursively
            node.childNodes.forEach(processNode);
          }
        }
      }

      doc.body.childNodes.forEach(processNode);
      return tokens;
    } catch (error) {
      console.error('Highlight.js error:', error);
      return [{ content: text, type: 'text' }];
    }
  },
  defaultLanguage: 'plaintext',
};

export default function CodeHighlightPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return registerCodeHighlighting(editor, CustomHighlightTokenizer);
  }, [editor]);

  return null;
}
