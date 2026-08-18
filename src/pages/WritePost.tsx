import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import writebg from "../assets/bgblog.webp";
import {
  createPost,
  updatePost,
  savePostAsDraft,
  getPostForEditing,
  deletePostPermanently,
  type Post,
} from '../services/firebase';
import { uploadImageToCloudinary } from '../services/cloudinary';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { ImageIcon } from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { BlockEditor } from '../components/editor/BlockEditor';
import {
  type Block,
  serializeBlocks,
  deserializeContent,
  createBlock,
} from '../types/blockTypes';
import { sanitizeBlocks } from '../utils/sanitize';

export const WritePost: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const postIdToEdit = searchParams.get('edit');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [genre, setGenre] = useState('General');
  const [tags, setTags] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([createBlock('paragraph')]);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; variant: 'primary' | 'danger' | 'warning'; onConfirm: () => void }>({ isOpen: false, title: '', message: '', variant: 'primary', onConfirm: () => {} });
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [postStatus, setPostStatus] = useState<string>('');

  // Auto-save state
  const storageKey = postIdToEdit ? `giki_draft_${postIdToEdit}` : 'giki_draft_new';
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const loadLocalDraft = () => {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            if (parsed.title) setTitle(parsed.title);
            if (parsed.description) setDescription(parsed.description);
            if (parsed.genre) setGenre(parsed.genre);
            if (parsed.tags) setTags(parsed.tags);
            if (parsed.blocks && Array.isArray(parsed.blocks)) {
              setBlocks(parsed.blocks.length > 0 ? parsed.blocks : [createBlock('paragraph')]);
            }
            setStatusMsg({ text: 'Restored from local draft.', type: 'info' });
            setTimeout(() => setStatusMsg({ text: '', type: '' }), 3000);
          }
        } catch (err) {
          console.error("Failed to parse local draft", err);
        }
      }
    };

    if (postIdToEdit) {
      const loadPost = async () => {
        setLoading(true);
        setStatusMsg({ text: 'Loading post...', type: 'info' });
        try {
          const res = await getPostForEditing(postIdToEdit);
          if (res.success && res.post) {
            const p = res.post as Post;
            setTitle(p.title);
            setDescription(p.description || '');
            setPhotoUrl(p.photoUrl || '');
            setGenre(p.genre || 'General');
            setTags(p.tags ? p.tags.join(', ') : '');
            setPostStatus(p.status || '');
            // Deserialize content — handles both block JSON and legacy HTML
            const { blocks: loaded, isLegacy } = deserializeContent(p.content || '');
            if (isLegacy && p.content) {
              // Wrap legacy HTML in a single paragraph block for editing
              setBlocks([{ id: 'legacy', type: 'paragraph', data: { html: p.content } }]);
            } else {
              setBlocks(loaded.length > 0 ? loaded : [createBlock('paragraph')]);
            }
            setStatusMsg({ text: '', type: '' });

            // After loading from Firebase, check if there's a local draft to restore
            loadLocalDraft();
          } else {
            setStatusMsg({ text: res.error || 'Failed to load post.', type: 'error' });
          }
        } catch (err: unknown) {
          setStatusMsg({
            text: err instanceof Error ? err.message : 'Error loading post.',
            type: 'error',
          });
        } finally {
          setLoading(false);
        }
      };
      loadPost();
    } else {
      // New post: immediately try to load local draft
      loadLocalDraft();
    }
  }, [postIdToEdit, storageKey]);

  // Auto-save effect
  useEffect(() => {
    // Prevent saving default empty state
    if (!title && blocks.length === 1 && blocks[0].type === 'paragraph' && !blocks[0].data.html) {
      return;
    }

    const handler = setTimeout(() => {
      setIsAutoSaving(true);
      const draft = {
        title,
        description,
        genre,
        tags,
        blocks: blocks.map(b => {
          // Do not attempt to stringify File objects
          if (b.type === 'image' && b.data._file) {
            const { _file, ...rest } = b.data;
            return { ...b, data: rest };
          }
          return b;
        }),
        updatedAt: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(draft));
      setLastSaved(new Date());
      setIsAutoSaving(false);
    }, 3000); // 3-second debounce

    return () => clearTimeout(handler);
  }, [title, description, genre, tags, blocks, storageKey]);

  const getContentString = async (): Promise<string | null> => {
    // Upload any image blocks that have a pending _file
    const uploadedBlocks: Block[] = await Promise.all(
      blocks.map(async (b) => {
        if (b.type === 'image' && b.data._file) {
          const res = await uploadImageToCloudinary(b.data._file);
          if (res.success && res.imageUrl) {
            return { ...b, data: { url: res.imageUrl, caption: b.data.caption } };
          }
        }
        return b;
      }),
    );
    const cleanBlocks = sanitizeBlocks(uploadedBlocks);
    setBlocks(cleanBlocks);
    return serializeBlocks(cleanBlocks);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (title.trim() === '') {
      setStatusMsg({ text: 'Title is required.', type: 'error' });
      return;
    }

    setLoading(true);
    setStatusMsg({ text: 'Uploading and submitting...', type: 'info' });

    try {
      let finalPhotoUrl = photoUrl;
      if (imageFile) {
        const uploadRes = await uploadImageToCloudinary(imageFile);
        if (uploadRes.success && uploadRes.imageUrl) {
          finalPhotoUrl = uploadRes.imageUrl;
        } else {
          setStatusMsg({ text: 'Failed to upload header image: ' + uploadRes.error, type: 'error' });
          setLoading(false);
          return;
        }
      }

      const content = await getContentString();
      if (!content) { setLoading(false); return; }

      let res;
      if (postIdToEdit) {
        res = await updatePost(postIdToEdit, { title, content, description, photoUrl: finalPhotoUrl, genre, tags });
      } else {
        res = await createPost({ title, content, description, photoUrl: finalPhotoUrl, genre, tags });
      }

      if (res.success) {
        localStorage.removeItem(storageKey);
        setStatusMsg({ text: 'Article submitted! Pending administrator approval.', type: 'success' });
        setTimeout(() => navigate('/profile'), 2000);
      } else {
        setStatusMsg({ text: res.error || 'Failed to submit post.', type: 'error' });
      }
    } catch (err: unknown) {
      setStatusMsg({ text: err instanceof Error ? err.message : 'An error occurred.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async (shouldPreview: boolean = false) => {
    if (loading) return;
    if (title.trim() === '') {
      setStatusMsg({ text: 'Title is required to save a draft.', type: 'error' });
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
          setStatusMsg({ text: 'Failed to upload header image: ' + uploadRes.error, type: 'error' });
          setLoading(false);
          return;
        }
      }

      const content = await getContentString();
      if (!content) { setLoading(false); return; }

      const res = await savePostAsDraft(
        { title, content, description, photoUrl: finalPhotoUrl, genre, tags },
        postIdToEdit,
      );

      if (res.success) {
        localStorage.removeItem(storageKey);
        if (shouldPreview) {
          setStatusMsg({ text: 'Draft saved. Redirecting to preview...', type: 'success' });
          navigate(`/posts/${res.postId || postIdToEdit}`);
        } else {
          setStatusMsg({ text: 'Draft saved!', type: 'success' });
          if (!postIdToEdit && res.postId) navigate(`/write?edit=${res.postId}`);
        }
      } else {
        setStatusMsg({ text: res.error || 'Failed to save draft.', type: 'error' });
      }
    } catch (err: unknown) {
      setStatusMsg({ text: err instanceof Error ? err.message : 'An error occurred.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

    const handleDeleteDraft = () => {
    if (!postIdToEdit || loading) return;
    
    setModalConfig({
      isOpen: true,
      title: "Delete Draft",
      message: "Are you sure you want to permanently delete this draft?",
      variant: 'danger',
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        try {
          const res = await deletePostPermanently(postIdToEdit);
          if (res.success) {
            localStorage.removeItem(storageKey);
            setStatusMsg({ text: 'Draft deleted.', type: 'success' });
            setTimeout(() => navigate('/profile'), 1500);
          } else {
            setStatusMsg({ text: res.error || 'Failed to delete.', type: 'error' });
          }
        } catch (err: unknown) {
          setStatusMsg({ text: err instanceof Error ? err.message : 'An error occurred.', type: 'error' });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <main className="relative min-h-[100dvh] w-full flex flex-col items-center pb-24">
      <ConfirmModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        variant={modalConfig.variant}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
      {/* Fixed background layer: perfectly immune to scroll-zoom bugs and works flawlessly now that Framer Motion filter is cleared in App.tsx */}
      <div 
        className="fixed inset-0 w-full h-full -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${writebg})` }}
      />

      <div className="flex-1 w-full flex flex-col items-center px-4 pt-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-white drop-shadow-sm">
            {postIdToEdit ? 'Edit Article' : 'Write a Chronicle'}
          </h1>
          <p className="mt-2 text-neutral-300 text-sm">
            Build your story block by block — paragraphs, quotes, callouts, CTAs & more.
          </p>
        </div>

        {/* Status message */}
        {statusMsg.text && (
          <div
            className={cn(
              'mb-4 w-full max-w-[95vw] md:max-w-[85vw] lg:max-w-[75vw] xl:max-w-5xl text-center py-3 px-4 rounded-xl text-sm border',
              statusMsg.type === 'success' && 'text-green-300 bg-green-950/40 border-green-500/30',
              statusMsg.type === 'error' && 'text-red-300 bg-red-950/40 border-red-500/30',
              statusMsg.type === 'info' && 'text-neutral-200 bg-black/40 border-neutral-700',
            )}
          >
            {statusMsg.text}
          </div>
        )}

        <form
          onSubmit={handlePublish}
          onKeyDown={(e) => {
            // Prevent accidental form submission when pressing Enter inside text inputs
            if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
              e.preventDefault();
            }
          }}
          className="w-full max-w-[95vw] md:max-w-[85vw] lg:max-w-[75vw] xl:max-w-5xl bg-black/80 backdrop-blur-md rounded-2xl border border-neutral-700 p-5 space-y-4"
        >
          {/* Title and Autosave Status */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-neutral-700 pb-3 gap-2">
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title..."
              className="w-full bg-transparent text-2xl font-bold text-white placeholder:text-neutral-600 focus:outline-none transition-colors"
            />
            <div className="text-xs text-neutral-500 whitespace-nowrap">
              {isAutoSaving ? 'Autosaving to device...' : (lastSaved ? `Saved to device at ${lastSaved.toLocaleTimeString()}` : '')}
            </div>
          </div>

          {/* Meta row */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="relative w-full">
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full appearance-none bg-black/50 border border-neutral-700 text-white rounded-lg px-4 py-2.5 pr-10 focus:outline-none text-sm"
              >
                {['General','Academic','Cultural','Sports','Campus Life','Freshman Tips','Societies','Culture','Profiles','Events','Guides','Photo Story'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (comma-separated)"
              className="w-full bg-transparent border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder:text-neutral-500 focus:outline-none text-sm"
            />
          </div>

          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short summary (shown in cards)..."
            className="w-full bg-transparent border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder:text-neutral-500 focus:outline-none text-sm"
          />

          {/* Header image */}
          <div className="grid sm:grid-cols-[1fr_auto] gap-3">
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="Header image URL..."
              className="w-full bg-transparent border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder:text-neutral-500 focus:outline-none text-sm"
            />
            <div className="relative flex items-center justify-center bg-black/50 border border-neutral-700 rounded-lg px-4 py-2.5 hover:bg-neutral-800 transition-colors cursor-pointer group overflow-hidden">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => { if (e.target.files?.[0]) setImageFile(e.target.files[0]); }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <div className="flex items-center gap-2 text-sm text-neutral-300 group-hover:text-white">
                <ImageIcon className="w-4 h-4" />
                <span className="truncate max-w-[120px]">{imageFile ? imageFile.name : 'Upload Image'}</span>
              </div>
            </div>
          </div>

          {/* ── Block Editor ── */}
          <div className="border border-neutral-700 rounded-xl p-3 bg-black/30 min-h-[280px]">
            {loading && blocks.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-neutral-500 text-sm">Loading content...</div>
            ) : (
              <BlockEditor blocks={blocks} onChange={setBlocks} />
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 justify-between pt-1">
            <div className="flex gap-2">
              <Link
                to="/profile"
                className="inline-flex items-center justify-center rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700 transition-colors"
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
                {loading ? 'Submitting...' : postIdToEdit ? 'Update Post' : 'Submit for Review'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
};
