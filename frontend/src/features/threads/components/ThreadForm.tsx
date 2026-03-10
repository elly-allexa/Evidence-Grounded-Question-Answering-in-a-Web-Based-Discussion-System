import { useState } from 'react';
import { createThread } from '../api/threadsApi';

type ThreadFormProps = {
    onThreadCreated: () => void;
};

export function ThreadForm({ onThreadCreated }: ThreadFormProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setError('');
            await createThread({ title, content });
            setTitle('');
            setContent('');
            onThreadCreated();
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Unknown error');
            }
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
            <h2>Create thread</h2>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div style={{ marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Thread title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    style={{ width: '100%', padding: '0.5rem' }}
                />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <textarea
                    placeholder="Thread body"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    rows={6}
                    style={{ width: '100%', padding: '0.5rem' }}
                />
            </div>

            <button type="submit">Create</button>
        </form>
    );
}