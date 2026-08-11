import React, { useState, useEffect } from 'react';
import { getApprovedPosts, type Post } from '../../services/firebase';
import { BlogSection } from './BlogSection';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const FeaturedPosts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await getApprovedPosts();
        if (res.success && res.posts) {
          // Take the first 3 posts for the featured section
          setPosts(res.posts.slice(0, 3));
        }
      } catch (err) {
        console.error('Error loading featured posts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <section className="w-full py-8 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto flex flex-col items-center">
      <div className="w-full">
        <BlogSection posts={posts} loading={loading} />
      </div>
      
      {!loading && posts.length > 0 && (
        <div className="mt-4 mb-16 flex justify-center">
          <Link
            to="/browse"
            className="group inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/5 px-8 py-3 text-sm font-medium uppercase tracking-[0.2em] text-white backdrop-blur-md transition-all hover:border-white/60 hover:bg-white/10 hover:scale-105"
          >
            View All Stories
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      )}
    </section>
  );
};
