import React, { useState, useRef, useEffect } from 'react';
import newBg from '../assets/homepc.webp';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textarea height based on content length
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [formData.message]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: 'Sending your message...', type: 'info' });

    // Mock API call to simulate message delivery
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStatusMsg({
        text: 'Thank you! Your message has been sent successfully.',
        type: 'success',
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setStatusMsg({
        text: 'Failed to send message. Please try again later.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="relative min-h-screen text-foreground pb-24 bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `url(${newBg})`,
      }}
    >
      <section className="border-b border-border relative py-16 md:py-24">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="text-left">
              <p className="text-[10px] tracking-[0.2em] uppercase font-bold text-muted-foreground mb-4">Contact</p>
              <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6 leading-tight">
                Let's<br />
                <span className="italic font-light text-muted-foreground">Connect</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-6 leading-relaxed font-light">
                Have a story to share? Want to be featured? We're here to listen and amplify your voice.
              </p>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div
                className="w-full max-w-md overflow-hidden border border-border/50 shadow-sm cursor-pointer hover:border-primary/50 transition-colors duration-700"
                style={{ borderRadius: '48% 48% 12px 12px' }}
                onClick={() => setIsPhotoModalOpen(true)}
              >
                <img src="/contact-hero.webp" alt="GIKI Campus View" className="w-full h-[320px] object-cover block grayscale hover:grayscale-0 transition-all duration-1000" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enlarged Image Lightbox Modal */}
      {isPhotoModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 transition-opacity"
          onClick={() => setIsPhotoModalOpen(false)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[85vh] bg-[#0A1931] border-2 border-white/20 p-2 shadow-2xl"
            style={{ borderRadius: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 cursor-pointer transition-colors"
              onClick={() => setIsPhotoModalOpen(false)}
              aria-label="Close image modal"
            >
              ✕
            </button>
            <img src="/contact-hero.webp" alt="GIKI Campus Enlarged" className="w-full h-auto max-h-[80vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}

      {/* Form Content Section */}
      <section className="container mx-auto px-6 py-12 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Section Heading */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 text-foreground">Get in Touch</h2>
            <p className="text-base md:text-lg max-w-2xl mx-auto text-muted-foreground font-light">
              Got something to share? We'd love to hear from you! Drop us a message and we'll get back to you soon.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12 items-stretch">
            {/* Form Column */}
            <div className="lg:col-span-2">
              <div className="rounded-3xl p-6 md:p-8 border border-border shadow-sm text-foreground relative bg-background">
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2">Full Name</label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full bg-muted/50 border border-border text-foreground rounded-xl p-4 text-base focus:outline-none focus:border-primary transition-all font-light"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2">Email Address</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full bg-muted/50 border border-border text-foreground rounded-xl p-4 text-base focus:outline-none focus:border-primary transition-all font-light"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2">Subject</label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full bg-muted/50 border border-border text-foreground rounded-xl p-4 text-base focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer font-light"
                    >
                      <option value="" disabled>Select Subject</option>
                      <option value="general">General Suggestion</option>
                      <option value="featured">Apply to be a Featured Post</option>
                      <option value="issue">Report an Issue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2">Your Message</label>
                    <textarea
                      id="message"
                      name="message"
                      ref={textareaRef}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full bg-muted/50 border border-border text-foreground rounded-xl p-4 text-base focus:outline-none focus:border-primary transition-all resize-none font-light"
                    />
                  </div>

                  {/* Message Status */}
                  {statusMsg.text && (
                    <div
                      className={`text-center py-2 text-base font-semibold ${
                        statusMsg.type === 'success'
                          ? 'text-green-400'
                          : statusMsg.type === 'error'
                          ? 'text-red-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {statusMsg.text}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full p-4 rounded-full font-medium text-sm bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed uppercase tracking-widest"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Sending...
                        </span>
                      ) : (
                        'Send Message'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Sidebar Details / Info Panel */}
            <div className="lg:col-span-1 flex flex-col justify-between">
              <div className="rounded-3xl p-6 md:p-8 border border-border shadow-sm text-foreground h-full bg-muted/30">
                <h3 className="text-xl font-semibold mb-6 tracking-tight">Response Standards</h3>
                
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-background border border-border/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">Priority Issues</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-primary text-primary-foreground font-medium uppercase tracking-wider">
                        24-48 Hours
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-light">
                      Vulnerabilities, site downtime, or login issues receive rapid, high-priority review.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-background border border-border/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">Standard Feedback</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] border border-border text-muted-foreground font-medium uppercase tracking-wider">
                        3-5 Days
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-light">
                      Apply to be a featured poster, suggest new features, or send custom article requests.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-background border border-border/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">General Queries</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] border border-border text-muted-foreground font-medium uppercase tracking-wider">
                        Within a week
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-light">
                      General campus suggestions, archives corrections, or queries regarding freshmen guide details.
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <a
                    href="https://www.instagram.com/giki.chronicles?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full p-4 rounded-full font-medium text-center inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs uppercase tracking-widest"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    <span>Follow Chronicles</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
