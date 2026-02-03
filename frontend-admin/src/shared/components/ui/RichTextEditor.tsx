import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const RichTextEditor = ({ value, onChange, placeholder, className }: RichTextEditorProps) => {
    const modules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'clean'],
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list',
        'link',
    ];

    return (
        <div className={`rich-text-editor ${className}`}>
            <ReactQuill
                theme="snow"
                value={value || ''}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                className="bg-white rounded-xl overflow-hidden"
            />
            <style>{`
                .rich-text-editor .ql-toolbar.ql-snow {
                    border-color: #e5e7eb;
                    border-top-left-radius: 0.75rem;
                    border-top-right-radius: 0.75rem;
                    background: #f9fafb;
                }
                .rich-text-editor .ql-container.ql-snow {
                    border-color: #e5e7eb;
                    border-bottom-left-radius: 0.75rem;
                    border-bottom-right-radius: 0.75rem;
                    min-height: 150px;
                    font-size: 0.875rem;
                }
                .rich-text-editor .ql-editor {
                    min-height: 150px;
                }
                .rich-text-editor .ql-editor.ql-blank::before {
                    color: #9ca3af;
                    font-style: normal;
                }
            `}</style>
        </div>
    );
};

export default RichTextEditor;
