import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import writebg from "../assets/bgblog.webp"
import {
  createPost,
  updatePost,
  savePostAsDraft,
  getPostForEditing,
  deletePostPermanently,
  type Post,
} from '../services/firebase';
import { uploadImageToCloudinary } from '../services/cloudinary';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import {
  ArrowUpIcon,
  Paperclip,
  ImageIcon,
} from 'lucide-react';

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: {
  minHeight: number;
  maxHeight?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Infinity),
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight],
  );

  useEffect(() => {
    if (textareaRef.current)
      textareaRef.current.style.height = `${minHeight}px`;
  }, [minHeight]);

  return { textareaRef, adjustHeight };
}

export const WritePost: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const postIdToEdit = searchParams.get('edit');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [genre, setGenre] = useState('General');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [showFullForm, setShowFullForm] = useState(false);
  const [postStatus, setPostStatus] = useState<string>('');

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 200,
  });

  useEffect(() => {
    if (postIdToEdit) {
      const loadPost = async () => {
        setLoading(true);
        setShowFullForm(true);
        setStatusMsg({ text: 'Loading post details...', type: 'info' });
        try {
          const res = await getPostForEditing(postIdToEdit);
          if (res.success && res.post) {
            const p = res.post as Post;
            setTitle(p.title);
            setDescription(p.description || '');
            setPhotoUrl(p.photoUrl || '');
            setGenre(p.genre || 'General');
            setTags(p.tags ? p.tags.join(', ') : '');
            setContent(p.content || '');
            setPostStatus(p.status || '');
            setStatusMsg({ text: '', type: '' });
          } else {
            setStatusMsg({
              text: res.error || 'Failed to load post for editing.',
              type: 'error',
            });
          }
        } catch (err: unknown) {
          setStatusMsg({
            text:
              err instanceof Error
                ? err.message
                : 'Error occurred while loading post.',
            type: 'error',
          });
        } finally {
          setLoading(false);
        }
      };

      loadPost();
    }
  }, [postIdToEdit]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() === '' || content.trim() === '') {
      setStatusMsg({ text: 'Title and Content are required.', type: 'error' });
      setShowFullForm(true);
      return;
    }

    setLoading(true);
    setStatusMsg({ text: 'Submitting article for review...', type: 'info' });

    try {
      let finalPhotoUrl = photoUrl;
      if (imageFile) {
        const uploadRes = await uploadImageToCloudinary(imageFile);
        if (uploadRes.success && uploadRes.imageUrl) {
          finalPhotoUrl = uploadRes.imageUrl;
        } else {
          setStatusMsg({ text: 'Failed to upload image: ' + uploadRes.error, type: 'error' });
          setLoading(false);
          return;
        }
      }

      let res;
      if (postIdToEdit) {
        res = await updatePost(postIdToEdit, {
          title,
          content,
          description,
          photoUrl: finalPhotoUrl,
          genre,
          tags,
        });
      } else {
        res = await createPost({
          title,
          content,
          description,
          photoUrl: finalPhotoUrl,
          genre,
          tags,
        });
      }

      if (res.success) {
        setStatusMsg({
          text: 'Article submitted successfully! It is now pending administrator approval.',
          type: 'success',
        });
        setTimeout(() => navigate('/profile'), 2000);
      } else {
        setStatusMsg({
          text: res.error || 'Failed to submit post.',
          type: 'error',
        });
      }
    } catch (err: unknown) {
      setStatusMsg({
        text: err instanceof Error ? err.message : 'An error occurred.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async (shouldPreview: boolean = false) => {
    if (title.trim() === '') {
      setStatusMsg({ text: 'Title is required to save a draft.', type: 'error' });
      setShowFullForm(true);
      return;
    }

    setLoading(true);
    setStatusMsg({ text: 'Saving draft...', type: 'info' });

    try {
      let finalPhotoUrl = photoUrl;
      if (imageFile) {
        const uploadRes = await uploadImageToCloudinary(imageFile);
        if (uploadRes.success && uploadRes.imageUrl) {
          finalPhotoUrl = uploadRes.imageUrl;
        } else {
          setStatusMsg({ text: 'Failed to upload image: ' + uploadRes.error, type: 'error' });
          setLoading(false);
          return;
        }
      }

      const res = await savePostAsDraft(
        { title, content, description, photoUrl: finalPhotoUrl, genre, tags },
        postIdToEdit,
      );

      if (res.success) {
        if (shouldPreview) {
          setStatusMsg({ text: 'Draft saved. Redirecting to preview...', type: 'success' });
          navigate(`/posts/${res.postId || postIdToEdit}`);
        } else {
          setStatusMsg({ text: 'Draft saved successfully!', type: 'success' });
          if (!postIdToEdit && res.postId) {
            navigate(`/write?edit=${res.postId}`);
          }
        }
      } else {
        setStatusMsg({
          text: res.error || 'Failed to save draft.',
          type: 'error',
        });
      }
    } catch (err: unknown) {
      setStatusMsg({
        text: err instanceof Error ? err.message : 'An error occurred.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!postIdToEdit) return;
    if (!window.confirm("Are you sure you want to permanently delete this draft?")) return;

    setLoading(true);
    setStatusMsg({ text: 'Deleting draft...', type: 'info' });

    try {
      const res = await deletePostPermanently(postIdToEdit);
      if (res.success) {
        setStatusMsg({ text: 'Draft deleted successfully.', type: 'success' });
        setTimeout(() => navigate('/profile'), 1500);
      } else {
        setStatusMsg({ text: res.error || 'Failed to delete draft.', type: 'error' });
      }
    } catch (err: unknown) {
      setStatusMsg({
        text: err instanceof Error ? err.message : 'An error occurred.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <main
      className="relative min-h-[100dvh] w-full bg-cover bg-center flex flex-col items-center pb-24"
      style={{
        backgroundImage: `url(${writebg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="flex-1 w-full flex flex-col items-center justify-center px-4 pt-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-white drop-shadow-sm">
            {postIdToEdit ? 'Edit Article' : 'Write a Chronicle'}
          </h1>
          <p className="mt-2 text-neutral-200">
            Build something amazing — start typing below.
          </p>
        </div>

        {statusMsg.text && (
          <div
            className={cn(
              'mb-4 max-w-3xl w-full text-center py-3 px-4 rounded-xl text-sm border',
              statusMsg.type === 'success' &&
                'text-green-300 bg-green-950/40 border-green-500/30',
              statusMsg.type === 'error' &&
                'text-red-300 bg-red-950/40 border-red-500/30',
              statusMsg.type === 'info' &&
                'text-neutral-200 bg-black/40 border-neutral-700',
            )}
          >
            {statusMsg.text}
          </div>
        )}

        <div className="w-full max-w-3xl mb-8">
          {!showFullForm ? (
            <div className="relative bg-black/60 backdrop-blur-md rounded-xl border border-neutral-700">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  adjustHeight();
                }}
                onFocus={() => setShowFullForm(true)}
                placeholder="Type your story idea..."
                className={cn(
                  'w-full px-4 py-3 resize-none border-none',
                  'bg-transparent text-white text-sm',
                  'focus-visible:ring-0 focus-visible:ring-offset-0',
                  'placeholder:text-neutral-400 min-h-[48px]',
                )}
                style={{ overflow: 'hidden' }}
              />

              <div className="flex items-center justify-between p-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-neutral-700"
                  onClick={() => setShowFullForm(true)}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>

                <Button
                  type="button"
                  onClick={() => setShowFullForm(true)}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-neutral-700 text-white hover:bg-neutral-600"
                >
                  <ArrowUpIcon className="w-4 h-4" />
                  <span className="sr-only">Expand</span>
                </Button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handlePublish}
              className="relative bg-black/60 backdrop-blur-md rounded-xl border border-neutral-700 p-5 space-y-4"
            >
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Article title..."
                className="w-full bg-transparent border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500"
              />

              <div className="grid sm:grid-cols-2 gap-3">
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-black/50 border border-neutral-700 text-white rounded-lg px-4 py-3 focus:outline-none"
                >
                  <option value="General">General</option>
                  <option value="Academic">Academic</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Sports">Sports</option>
                  <option value="Campus Life">Campus Life</option>
                  <option value="Freshman Tips">Freshman Tips</option>
                  <option value="Societies">Societies</option>
                  <option value="Culture">Culture</option>
                  <option value="Profiles">Profiles</option>
                  <option value="Events">Events</option>
                  <option value="Guides">Guides</option>
                  <option value="Photo Story">Photo Story</option>
                </select>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Tags (comma-separated)"
                  className="w-full bg-transparent border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder:text-neutral-400 focus:outline-none"
                />
              </div>

              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short summary..."
                className="w-full bg-transparent border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder:text-neutral-400 focus:outline-none"
              />

              <div className="grid sm:grid-cols-[1fr_auto] gap-3">
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="Header image URL..."
                  className="w-full bg-transparent border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder:text-neutral-400 focus:outline-none"
                />
                <div className="relative flex items-center justify-center bg-black/50 border border-neutral-700 rounded-lg px-4 hover:bg-neutral-800 transition-colors cursor-pointer group overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <div className="flex items-center gap-2 text-sm text-neutral-300 group-hover:text-white">
                    <ImageIcon className="w-4 h-4" />
                    <span className="truncate max-w-[120px]">
                      {imageFile ? imageFile.name : 'Upload Image'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-transparent border border-neutral-700 rounded-lg overflow-hidden [&_.ql-toolbar]:bg-neutral-900 [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-neutral-700 [&_.ql-container]:border-none [&_.ql-editor]:min-h-[250px] [&_.ql-editor]:text-white [&_.ql-editor.ql-blank::before]:text-neutral-400 [&_.ql-picker-label]:text-white [&_.ql-stroke]:stroke-white [&_.ql-fill]:fill-white mt-4">
                <ReactQuill 
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  placeholder="Write your story here..."
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
                      ['link', 'image'],
                      ['clean']
                    ],
                  }}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-between pt-2">
                <div className="flex gap-2">
                  <Link
                    to="/profile"
                    className="inline-flex items-center justify-center rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700"
                  >
                    Cancel
                  </Link>
                  {postIdToEdit && postStatus === 'draft' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDeleteDraft}
                      disabled={loading}
                      className="border-red-900/50 bg-red-950/30 text-red-400 hover:text-red-300 hover:bg-red-900/50"
                    >
                      Delete Draft
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSaveDraft(true)}
                    disabled={loading}
                    className="border-neutral-700 bg-neutral-800/80 text-white hover:text-white hover:bg-neutral-700"
                  >
                    Preview
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSaveDraft(false)}
                    disabled={loading}
                    className="border-neutral-700 bg-black/50 text-neutral-300 hover:text-white hover:bg-neutral-700"
                  >
                    Save Draft
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-white text-black hover:bg-neutral-200"
                  >
                    {loading
                      ? 'Submitting...'
                      : postIdToEdit
                        ? 'Update Post'
                        : 'Submit for Review'}
                  </Button>
                </div>
              </div>
            </form>
          )}

        </div>
      </div>
    </main>
  );
};


