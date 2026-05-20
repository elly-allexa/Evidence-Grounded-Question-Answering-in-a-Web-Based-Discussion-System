import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

type SafeMarkdownProps = {
  content: string;
};

export function SafeMarkdown({ content }: SafeMarkdownProps) {
  return (
    <div className="markdown-body">
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content}</ReactMarkdown>
    </div>
  );
}
