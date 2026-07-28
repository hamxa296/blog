import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { uploadImageToCloudinary } from '@/services/cloudinary';
import { uploadGalleryPhoto } from '@/services/firebase';
import { Button } from '@/components/ui/button';

const CATEGORIES = [
  'Academic Blocks',
  'Hostels',
  'Sports Complex',
  'General',
] as const;

interface PhotoSubmitModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function PhotoSubmitModal({
  open,
  onClose,
  onSubmitted,
}: PhotoSubmitModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const reset = () => {
    setCaption('');
    setCategory('');
    setFile(null);
    setMessage(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!user) {
      handleClose();
      navigate('/login');
      return;
    }

    if (!caption.trim() || !category || !file) {
      setMessage({ type: 'err', text: 'Please fill in all fields.' });
      return;
    }

    setSubmitting(true);
    try {
      const upload = await uploadImageToCloudinary(file);
      if (!upload.success || !upload.imageUrl) {
        setMessage({ type: 'err', text: upload.error || 'Upload failed.' });
        return;
      }

      const result = await uploadGalleryPhoto({
        imageUrl: upload.imageUrl,
        fullSizeUrl: upload.imageUrl,
        caption: caption.trim(),
        category,
        cloudinaryId: upload.cloudinaryId,
      });

      if (!result.success) {
        setMessage({ type: 'err', text: result.error || 'Could not save photo.' });
        return;
      }

      setMessage({ type: 'ok', text: 'Photo submitted for review!' });
      onSubmitted?.();
      setTimeout(() => handleClose(), 1200);
    } catch {
      setMessage({ type: 'err', text: 'Failed to submit photo.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-submit-title"
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-background p-6 text-foreground shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 id="photo-submit-title" className="mb-4 text-xl font-bold tracking-tight">
          Add Your Photo to Gallery
        </h2>

        {!user ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You must be logged in to submit a photo.
            </p>
            <Button
              className="w-full"
              onClick={() => {
                handleClose();
                navigate('/login');
              }}
            >
              Log in to continue
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="caption" className="mb-1.5 block text-sm font-semibold">
                Caption
              </label>
              <input
                id="caption"
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
            </div>

            <div>
              <label htmlFor="photo-category" className="mb-1.5 block text-sm font-semibold">
                Category
              </label>
              <select
                id="photo-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="photo-upload" className="mb-1.5 block text-sm font-semibold">
                Photo
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Max file size: 10MB. Images will be optimized automatically.
              </p>
            </div>

            <div className="min-h-5 text-center text-sm">
              {message && (
                <p className={message.type === 'ok' ? 'text-green-600' : 'text-destructive'}>
                  {message.text}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Add to Gallery'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
