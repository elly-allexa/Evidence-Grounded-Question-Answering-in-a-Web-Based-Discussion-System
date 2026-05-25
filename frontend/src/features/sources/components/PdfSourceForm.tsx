import { useState } from 'react';
import { uploadPdfSource } from '../api/sourcesApi';
import type { SourceDocument } from '../types/source.types';

type PdfSourceFormProps = {
  threadId: string;
  onSourceCreated: (source: SourceDocument) => void;
};

export function PdfSourceForm({ threadId, onSourceCreated }: PdfSourceFormProps) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError('Choose a PDF file first.');
      return;
    }

    try {
      setError('');
      setIsUploading(true);

      const source = await uploadPdfSource(threadId, file, title);

      setTitle('');
      setFile(null);
      onSourceCreated(source);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="thread-form" onSubmit={handleSubmit}>
      <h3>Upload PDF source</h3>

      {error && <p className="error-banner">{error}</p>}

      <div className="thread-form__field">
        <label htmlFor="pdf-source-title">PDF title optional</label>
        <input
          id="pdf-source-title"
          className="thread-form__input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Leave empty to use filename"
          disabled={isUploading}
        />
      </div>

      <div className="thread-form__field">
        <label htmlFor="pdf-source-file">PDF file</label>
        <input
          id="pdf-source-file"
          type="file"
          accept="application/pdf"
          disabled={isUploading}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </div>

      <button type="submit" disabled={isUploading}>
        {isUploading ? 'Uploading PDF...' : 'Upload PDF'}
      </button>
    </form>
  );
}
