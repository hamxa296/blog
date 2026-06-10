import React, { useState, useRef, useEffect } from 'react';

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
    <main className="min-h-screen text-[#1A3D63]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0A1931]/70 to-[#1A3D63]/60 border-b border-white/10 relative py-12 md:py-20">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-left text-white">
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
                Let's<br />
                <span className="bg-gradient-to-r from-[#77c9ff] to-[#c78bff] bg-clip-text text-transparent">
                  Connect
                </span>
              </h1>
              <p className="text-lg md:text-xl opacity-90 max-w-xl mb-6 leading-relaxed">
                Have a story to share? Want to be featured? We're here to listen and amplify your voice.
              </p>
            </div>

            {/* Right Semicircular Arch Image */}
            <div className="flex justify-center lg:justify-end">
              <div 
                className="w-full max-w-md overflow-hidden border-4 border-[#B3CFE5]/80 shadow-2xl cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                style={{ borderRadius: '48% 48% 12px 12px' }}
                onClick={() => setIsPhotoModalOpen(true)}
              >
                <img src="/contact-hero.jpeg" alt="GIKI Campus View" className="w-full h-[320px] object-cover block" />
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
            <img src="/contact-hero.jpeg" alt="GIKI Campus Enlarged" className="w-full h-auto max-h-[80vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}

      {/* Form Content Section */}
      <section className="container mx-auto px-6 py-12 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Section Heading */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#F6FAFD]">Get in Touch</h2>
            <p className="text-base md:text-lg opacity-80 max-w-2xl mx-auto text-[#B3CFE5]">
              Got something to share? We'd love to hear from you! Drop us a message and we'll get back to you soon.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12 items-stretch">
            {/* Form Column */}
            <div className="lg:col-span-2">
              <div
                className="rounded-3xl p-6 md:p-8 border border-[#B3CFE5]/25 shadow-2xl text-white relative"
                style={{
                  background: 'linear-gradient(135deg, rgba(10,25,49,0.85), rgba(26,61,99,0.85))',
                }}
              >
                {/* Visual Texture */}
                <div 
                  className="absolute inset-0 opacity-[0.05] pointer-events-none rounded-3xl"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 2px)',
                    mixBlendMode: 'overlay',
                  }}
                />

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="relative">
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder=" "
                        className="peer w-full bg-white/5 border border-[#B3CFE5]/30 text-white rounded-xl p-4 pt-6 pb-2 text-lg focus:outline-none focus:border-[#4A7FA7] focus:ring-3 focus:ring-[#4A7FA7]/20 transition-all"
                      />
                      <label
                        htmlFor="name"
                        className="absolute left-4 top-4 text-[#B3CFE5]/70 text-base pointer-events-none transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#4A7FA7] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-xs"
                      >
                        Full Name
                      </label>
                    </div>

                    {/* Email */}
                    <div className="relative">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder=" "
                        className="peer w-full bg-white/5 border border-[#B3CFE5]/30 text-white rounded-xl p-4 pt-6 pb-2 text-lg focus:outline-none focus:border-[#4A7FA7] focus:ring-3 focus:ring-[#4A7FA7]/20 transition-all"
                      />
                      <label
                        htmlFor="email"
                        className="absolute left-4 top-4 text-[#B3CFE5]/70 text-base pointer-events-none transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#4A7FA7] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-xs"
                      >
                        Email Address
                      </label>
                    </div>
                  </div>

                  {/* Subject Dropdown */}
                  <div className="relative">
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full bg-white/5 border border-[#B3CFE5]/30 text-white rounded-xl p-4 pt-6 pb-2 text-lg focus:outline-none focus:border-[#4A7FA7] focus:ring-3 focus:ring-[#4A7FA7]/20 transition-all appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23B3CFE5' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 16px center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '16px',
                        paddingRight: '48px',
                      }}
                    >
                      <option value="" disabled className="bg-[#0A1931] text-[#B3CFE5]/50">
                        Select Subject
                      </option>
                      <option value="general" className="bg-[#0A1931] text-white">General Suggestion</option>
                      <option value="featured" className="bg-[#0A1931] text-white">Apply to be a Featured Post</option>
                      <option value="issue" className="bg-[#0A1931] text-white">Report an Issue</option>
                      <option value="other" className="bg-[#0A1931] text-white">Other</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div className="relative">
                    <textarea
                      id="message"
                      name="message"
                      ref={textareaRef}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      placeholder=" "
                      rows={4}
                      className="peer w-full bg-white/5 border border-[#B3CFE5]/30 text-white rounded-xl p-4 pt-6 pb-2 text-lg focus:outline-none focus:border-[#4A7FA7] focus:ring-3 focus:ring-[#4A7FA7]/20 transition-all resize-none"
                    />
                    <label
                      htmlFor="message"
                      className="absolute left-4 top-4 text-[#B3CFE5]/70 text-base pointer-events-none transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#4A7FA7] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-xs"
                    >
                      Your Message
                    </label>
                  </div>

                  {/* Message Status */}
                  {statusMsg.text && (
                    <div
                      className={`text-center py-2 text-base font-semibold ${
                        statusMsg.type === 'success'
                          ? 'text-green-400'
                          : statusMsg.type === 'error'
                          ? 'text-red-400'
                          : 'text-[#B3CFE5]'
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
                      className="w-full p-4 rounded-xl font-bold text-lg bg-gradient-to-r from-[#1A3D63] to-[#0A1931] hover:from-[#4A7FA7] hover:to-[#1A3D63] text-white shadow-lg cursor-pointer transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
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
              <div
                className="rounded-3xl p-6 md:p-8 border border-[#B3CFE5]/20 shadow-2xl text-[#EAF6FF] h-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(10,25,49,0.92), rgba(26,61,99,0.90))',
                }}
              >
                <h3 className="text-xl font-bold mb-6 text-[#B3CFE5]">Response Standards</h3>
                
                <div className="space-y-6">
                  {/* Priority */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover-lift">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-[#9fd8ff]">Priority Issues</span>
                      <span className="time-pill px-2.5 py-0.5 rounded-full text-xs bg-gradient-to-r from-[#4A7FA7]/20 to-[#1A3D63]/30 text-white font-semibold">
                        24-48 Hours
                      </span>
                    </div>
                    <p className="text-sm text-[#B3CFE5]/80">
                      Vulnerabilities, site downtime, or login issues receive rapid, high-priority review.
                    </p>
                  </div>

                  {/* Standard */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover-lift">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-[#9fffbf]">Standard Feedback</span>
                      <span className="time-pill px-2.5 py-0.5 rounded-full text-xs bg-gradient-to-r from-green-500/10 to-emerald-600/20 text-white font-semibold">
                        3-5 Days
                      </span>
                    </div>
                    <p className="text-sm text-[#B3CFE5]/80">
                      Apply to be a featured poster, suggest new features, or send custom article requests.
                    </p>
                  </div>

                  {/* Other */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover-lift">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-[#ffd37a]">General Queries</span>
                      <span className="time-pill px-2.5 py-0.5 rounded-full text-xs bg-gradient-to-r from-amber-500/10 to-yellow-600/20 text-white font-semibold">
                        Within a week
                      </span>
                    </div>
                    <p className="text-sm text-[#B3CFE5]/80">
                      General campus suggestions, archives corrections, or queries regarding freshmen guide details.
                    </p>
                  </div>
                </div>

                {/* Instagram button */}
                <div className="mt-8">
                  <a
                    href="https://www.instagram.com/giki.chronicles?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full p-4 rounded-xl font-bold text-center inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#c78bff] to-[#77c9ff] text-white hover:opacity-95 shadow-lg transition-opacity"
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
