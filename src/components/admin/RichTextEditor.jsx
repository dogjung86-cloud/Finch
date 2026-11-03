'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { adminErrorMessage, uploadAdminImage } from '../../lib/adminEditor';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

const FORMATS = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'align',
  'list',
  'blockquote',
  'link', 'image',
];

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

// 칼럼과 일상이 함께 쓰는 본문 에디터.
// 이미지는 어떤 길로 넣든(툴바, 끌어다 놓기, 붙여넣기) 줄여서 올린 뒤 주소로만 본문에 넣는다.
// onChange(값, source): source 가 'user' 일 때만 사람이 고친 것이다.
export default function RichTextEditor({ value, onChange, placeholder, image, onError, onUploadingChange }) {
  const quillRef = useRef(null);
  const [pending, setPending] = useState(0);

  const callbacks = useRef(null);
  callbacks.current = { image, onError };

  useEffect(() => {
    onUploadingChange?.(pending > 0);
  }, [pending, onUploadingChange]);

  const insertImages = useCallback(async (files, atIndex) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    callbacks.current.onError('');
    // 올리는 동안 글을 계속 써도 이미지가 처음 자리에 들어가도록 위치를 따라간다
    let index = atIndex;
    let inserting = false;
    let edited = false;
    const follow = (delta) => {
      index = delta.transformPosition(index);
      if (!inserting) edited = true;
    };
    editor.on('text-change', follow);
    setPending((n) => n + files.length);
    for (const file of files) {
      try {
        const url = await uploadAdminImage(file, callbacks.current.image);
        inserting = true;
        editor.insertEmbed(index, 'image', url, 'user');
        inserting = false;
        if (!edited && editor.hasFocus()) editor.setSelection(index);
      } catch (err) {
        callbacks.current.onError(`이미지를 올리지 못했습니다: ${adminErrorMessage(err)}`);
      }
      setPending((n) => n - 1);
    }
    editor.off('text-change', follow);
  }, []);

  const imageHandler = useCallback(() => {
    const editor = quillRef.current?.getEditor();
    const range = editor?.getSelection(true);
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', IMAGE_TYPES.join(','));
    input.click();
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) insertImages([file], range ? range.index : editor.getLength() - 1);
    };
  }, [insertImages]);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        [{ font: [] }],
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote'],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: imageHandler,
      },
    },
    clipboard: { matchVisual: false },
    // Quill 기본 동작은 끌어다 놓거나 붙여넣은 이미지를 글자 데이터로 본문에 넣는다
    uploader: {
      mimetypes: IMAGE_TYPES,
      handler: (range, files) => {
        const editor = quillRef.current?.getEditor();
        if (range.length > 0) editor?.deleteText(range.index, range.length, 'user');
        insertImages(files, range.index);
      },
    },
  }), [imageHandler, insertImages]);

  const handleDrop = (e) => {
    const dropped = [...(e.dataTransfer?.files || [])];
    const images = dropped.filter((f) => IMAGE_TYPES.includes(f.type));
    if (dropped.length > 0 && images.length === 0) {
      callbacks.current.onError('JPG, PNG, WebP, GIF 이미지만 넣을 수 있습니다.');
    }
    // 본문 위에 놓은 것은 위의 uploader 가 처리한다. 툴바 위에 놓으면 본문 끝에 넣는다.
    if (e.target.closest('.ql-editor')) return;
    e.preventDefault();
    const editor = quillRef.current?.getEditor();
    if (images.length > 0 && editor) insertImages(images, editor.getLength() - 1);
  };

  return (
    <>
      <div
        className="admin-editor-wrap"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={(val, _delta, source) => onChange(val, source)}
          modules={modules}
          formats={FORMATS}
          placeholder={placeholder}
        />
      </div>
      {pending > 0 && (
        <p className="admin-form__hint admin-editor-status" role="status">
          이미지 올리는 중... {pending}장 남음
        </p>
      )}
    </>
  );
}
