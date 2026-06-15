import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  createPost, 
  updatePost, 
  savePostAsDraft, 
  getPostForEditing,
  type Post 
} from '../services/firebase';

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

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  // Load post details if in edit mode
  useEffect(() => {
    if (postIdToEdit) {
      const loadPost = async () => {
        setLoading(true);
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
            setStatusMsg({ text: '', type: '' });
          } else {
            setStatusMsg({ text: res.error || 'Failed to load post for editing.', type: 'error' });
          }
        } catch (err: any) {
          setStatusMsg({ text: err.message || 'Error occurred while loading post.', type: 'error' });
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
      return;
    }

    setLoading(true);
    setStatusMsg({ text: 'Submitting article for review...', type: 'info' });

    try {
      let res;
      if (postIdToEdit) {
        res = await updatePost(postIdToEdit, { title, content, description, photoUrl, genre, tags });
      } else {
        res = await createPost({ title, content, description, photoUrl, genre, tags });
      }

      if (res.success) {
        setStatusMsg({ 
          text: 'Article submitted successfully! It is now pending administrator approval.', 
          type: 'success' 
        });
        setTimeout(() => navigate('/profile'), 2000);
      } else {
        setStatusMsg({ text: res.error || 'Failed to submit post.', type: 'error' });
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'An error occurred.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (title.trim() === '') {
      setStatusMsg({ text: 'Title is required to save a draft.', type: 'error' });
      return;
    }

    setLoading(true);
    setStatusMsg({ text: 'Saving draft...', type: 'info' });

    try {
      const res = await savePostAsDraft(
        { title, content, description, photoUrl, genre, tags },
        postIdToEdit
      );

      if (res.success) {
        setStatusMsg({ text: 'Draft saved successfully!', type: 'success' });
        if (!postIdToEdit && res.postId) {
          // Redirect to edit url for the new draft
          navigate(`/write?edit=${res.postId}`);
        }
      } else {
        setStatusMsg({ text: res.error || 'Failed to save draft.', type: 'error' });
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'An error occurred.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-88px)] text-white py-12 relative z-10">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <div 
          className="rounded-[2rem] p-6 sm:p-8 border border-[#B3CFE5]/25 shadow-2xl relative"
          style={{
            background: 'linear-gradient(135deg, rgba(10,25,49,0.85), rgba(26,61,99,0.85))',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* visual texture overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-3xl"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 2px)',
              mixBlendMode: 'overlay',
            }}
          />

          <div className="mb-8 relative z-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-white font-serif">
              {postIdToEdit ? 'Edit Your Post' : 'Write a New Article'}
            </h1>
            <p className="text-sm text-[#B3CFE5]/80">
              {postIdToEdit ? 'Make changes and resubmit for review.' : 'Share your story with the GIKI community.'}
            </p>
          </div>

          {statusMsg.text && (
            <div 
              className={`text-center py-3 px-4 rounded-xl text-sm font-semibold mb-6 border transition-all relative z-10 ${
                statusMsg.type === 'success' 
                  ? 'text-green-400 bg-green-950/20 border-green-500/20' 
                  : statusMsg.type === 'error'
                  ? 'text-red-400 bg-red-950/20 border-red-500/20'
                  : 'text-[#B3CFE5] bg-white/5 border-white/10'
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          <form onSubmit={handlePublish} className="space-y-6 relative z-10">
            {/* Title */}
            <div>
              <label htmlFor="post-title" className="block text-xs font-bold text-[#B3CFE5] uppercase tracking-wider mb-2">Title</label>
              <input
                type="text"
                id="post-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a catchy title..."
                className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3.5 text-white placeholder-white/30 focus:outline-none focus:border-white focus:ring-3 focus:ring-white/10 transition-all text-base"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Category Dropdown */}
              <div>
                <label htmlFor="post-genre" className="block text-xs font-bold text-[#B3CFE5] uppercase tracking-wider mb-2">Genre Category</label>
                <select
                  id="post-genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-[#0E223C] border border-[#B3CFE5]/30 text-white rounded-xl p-3.5 focus:outline-none focus:border-white focus:ring-3 focus:ring-white/10 transition-all text-sm appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23B3CFE5' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 16px center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '16px',
                  }}
                >
                  <option value="General">General</option>
                  <option value="Academic">Academic</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>

              {/* Tags Input */}
              <div>
                <label htmlFor="post-tags" className="block text-xs font-bold text-[#B3CFE5] uppercase tracking-wider mb-2">Tags (Comma-separated)</label>
                <input
                  type="text"
                  id="post-tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. survival, guides, hostels"
                  className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3.5 text-white placeholder-white/30 focus:outline-none focus:border-white focus:ring-3 focus:ring-white/10 transition-all text-sm"
                />
              </div>
            </div>

            {/* Description / Summary Excerpt */}
            <div>
              <label htmlFor="post-description" className="block text-xs font-bold text-[#B3CFE5] uppercase tracking-wider mb-2">Short Summary</label>
              <input
                type="text"
                id="post-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Give a brief summary of your article..."
                className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3.5 text-white placeholder-white/30 focus:outline-none focus:border-white focus:ring-3 focus:ring-white/10 transition-all text-sm"
              />
            </div>

            {/* Photo URL */}
            <div>
              <label htmlFor="post-photo-url" className="block text-xs font-bold text-[#B3CFE5] uppercase tracking-wider mb-2">Header Image URL</label>
              <input
                type="url"
                id="post-photo-url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3.5 text-white placeholder-white/30 focus:outline-none focus:border-white focus:ring-3 focus:ring-white/10 transition-all text-sm"
              />
              <p className="text-[10px] text-[#B3CFE5]/50 mt-1">Provide a web image URL to display as a cover photo.</p>
            </div>

            {/* Content Textarea */}
            <div>
              <label htmlFor="post-content" className="block text-xs font-bold text-[#B3CFE5] uppercase tracking-wider mb-2">Content (HTML allowed)</label>
              <textarea
                id="post-content"
                required
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your story here... HTML formatting elements are permitted."
                className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-4 text-white placeholder-white/30 focus:outline-none focus:border-white focus:ring-3 focus:ring-white/10 transition-all resize-y text-base font-sans"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
              <Link
                to="/profile"
                className="px-6 py-3 rounded-full text-sm font-semibold border border-white/10 bg-white/5 hover:bg-white/10 text-white text-center transition cursor-pointer"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={loading}
                className="px-6 py-3 rounded-full text-sm font-semibold bg-[#1A3D63] border border-[#B3CFE5]/30 text-white shadow-md hover:bg-[#4A7FA7]/10 transition cursor-pointer disabled:opacity-60"
              >
                Save as Draft
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-full text-sm font-bold bg-[#4A7FA7] hover:bg-[#1A3D63] border border-[#B3CFE5]/40 text-white shadow-lg transition cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Submitting...' : (postIdToEdit ? 'Update Post' : 'Submit for Review')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};
