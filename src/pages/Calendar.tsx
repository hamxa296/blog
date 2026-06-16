import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  db, 
  getEvents, 
  createEvent, 
  type CalendarEvent 
} from '../services/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

export const Calendar: React.FC = () => {
  const { user } = useAuth();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Selected Day Details Modal
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
  
  // Submit Event Form Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    eventName: '',
    eventDate: '',
    eventTime: '',
    eventType: 'General',
    eventLocation: '',
    eventDescription: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  // Load events
  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('eventDate', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: CalendarEvent[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as CalendarEvent);
      });
      setEvents(list);
    }, (err) => {
      console.error("Error subscribing to events:", err);
      // Fallback
      getEvents().then(res => {
        if (res.success && res.events) setEvents(res.events);
      });
    });

    return () => unsubscribe();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Helper date conversions
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Days in month calculation
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysGrid: (number | null)[] = [];
  // padding slots before day 1
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push(null);
  }
  // month days
  for (let i = 1; i <= totalDays; i++) {
    daysGrid.push(i);
  }

  // Get date key format: YYYY-MM-DD
  const getDateKey = (dayNum: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const handleDayClick = (dayNum: number) => {
    const dateKey = getDateKey(dayNum);
    const dayEvents = events.filter(e => e.eventDate === dateKey);
    setSelectedDateStr(dateKey);
    setSelectedDayEvents(dayEvents);
  };

  // Event submission handler
  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSubmitLoading(true);
    try {
      const res = await createEvent(formData);
      if (res.success) {
        alert("Event submitted successfully!");
        setIsSubmitModalOpen(false);
        setFormData({
          eventName: '',
          eventDate: '',
          eventTime: '',
          eventType: 'General',
          eventLocation: '',
          eventDescription: ''
        });
      } else {
        alert("Failed to submit event: " + res.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Calendar sync file generator links
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatICSDate = (d: Date) => {
    const y = d.getUTCFullYear();
    const m = pad(d.getUTCMonth() + 1);
    const day = pad(d.getUTCDate());
    const h = pad(d.getUTCHours());
    const mi = pad(d.getUTCMinutes());
    const s = pad(d.getUTCSeconds());
    return `${y}${m}${day}T${h}${mi}${s}Z`;
  };

  const getGoogleCalendarUrl = (ev: CalendarEvent) => {
    const timeStr = ev.eventTime || '09:00';
    const dateObj = new Date(`${ev.eventDate}T${timeStr}:00`);
    const start = formatICSDate(dateObj);
    const end = formatICSDate(new Date(dateObj.getTime() + 60 * 60 * 1000));
    
    const qs = new URLSearchParams({
      action: 'TEMPLATE',
      text: ev.eventName,
      dates: `${start}/${end}`,
      details: ev.eventDescription,
      location: ev.eventLocation
    });
    return `https://calendar.google.com/calendar/render?${qs.toString()}`;
  };

  const getICSFileUri = (ev: CalendarEvent) => {
    const timeStr = ev.eventTime || '09:00';
    const dateObj = new Date(`${ev.eventDate}T${timeStr}:00`);
    const start = formatICSDate(dateObj);
    const end = formatICSDate(new Date(dateObj.getTime() + 60 * 60 * 1000));
    
    const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@gikichronicles`;
    const esc = (s: string) => s.replace(/\r?\n/g, '\\n');
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//GIKI Chronicles//Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${esc(ev.eventName)}`,
      `DESCRIPTION:${esc(ev.eventDescription)}`,
      `LOCATION:${esc(ev.eventLocation)}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(icsContent);
  };

  const getBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'tech': return 'bg-[#1A3D63] text-white';
      case 'cultural': return 'bg-purple-600/30 text-purple-300';
      case 'academic': return 'bg-blue-600/30 text-blue-300';
      case 'sports': return 'bg-green-600/30 text-green-300';
      default: return 'bg-gray-600/30 text-gray-300';
    }
  };

  return (
    <main className="min-h-[calc(100vh-88px)] text-white py-12 relative z-10">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-bold font-serif mb-4 tracking-tight">
            Campus <span className="text-[#B3CFE5]">Calendar</span>
          </h1>
          <p className="text-[#B3CFE5] max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Discover society announcements, team competitions, and events.
          </p>
          {user && (
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="mt-6 px-6 py-2.5 rounded-full font-bold text-sm bg-[#4A7FA7] hover:bg-[#1A3D63] text-white border border-[#B3CFE5]/30 shadow-md cursor-pointer transition-all"
            >
              Submit Society Event
            </button>
          )}
        </div>

        {/* Calendar Core Box */}
        <div 
          className="rounded-[2rem] p-6 border border-[#B3CFE5]/25 shadow-2xl relative"
          style={{
            background: 'linear-gradient(135deg, rgba(10,25,49,0.85), rgba(26,61,99,0.85))',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Calendar Month Header */}
          <div className="flex justify-between items-center mb-8 border-b border-[#B3CFE5]/10 pb-4">
            <button 
              onClick={handlePrevMonth}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 text-xl font-bold cursor-pointer transition"
            >
              ‹
            </button>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#B3CFE5]">
              {monthNames[month]} {year}
            </h2>
            <button 
              onClick={handleNextMonth}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 text-xl font-bold cursor-pointer transition"
            >
              ›
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider text-[#B3CFE5]/60 mb-4">
            <div>Su</div>
            <div>Mo</div>
            <div>Tu</div>
            <div>We</div>
            <div>Th</div>
            <div>Fr</div>
            <div>Sa</div>
          </div>

          {/* Grid Slots */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {daysGrid.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-16 sm:h-20 bg-transparent"></div>;
              }

              const dateStr = getDateKey(day);
              const dayEventsList = events.filter(e => e.eventDate === dateStr);
              const hasEvents = dayEventsList.length > 0;

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => handleDayClick(day)}
                  className={`h-16 sm:h-20 rounded-2xl border flex flex-col justify-between p-2 text-left relative transition-all cursor-pointer ${
                    hasEvents 
                      ? 'bg-[#1A3D63]/50 border-[#4A7FA7]/50 hover:bg-[#4A7FA7]/15' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <span className="text-sm font-bold opacity-80">{day}</span>
                  {hasEvents && (
                    <div className="flex gap-1 flex-wrap">
                      {dayEventsList.slice(0, 3).map((_, evIdx) => (
                        <span key={evIdx} className="w-1.5 h-1.5 rounded-full bg-[#B3CFE5] block"></span>
                      ))}
                      {dayEventsList.length > 3 && (
                        <span className="text-[8px] text-white/50 font-bold block leading-none">+</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Events Modal */}
      {selectedDateStr && (
        <div 
          onClick={() => { setSelectedDateStr(null); setSelectedDayEvents([]); }}
          className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm z-[9999] animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-[#B3CFE5]/30 shadow-2xl relative text-white max-h-[85vh] overflow-y-auto"
            style={{
              background: 'linear-gradient(135deg, rgba(10,25,49,0.98), rgba(20,45,75,0.98))',
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-serif text-[#B3CFE5]">
                Events on {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <button 
                onClick={() => { setSelectedDateStr(null); setSelectedDayEvents([]); }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition text-white/60 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {selectedDayEvents.length === 0 ? (
                <p className="text-center py-6 text-[#B3CFE5]/60 text-sm">No campus events announced for this date.</p>
              ) : (
                selectedDayEvents.map(ev => (
                  <div key={ev.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h4 className="font-extrabold text-white text-lg">{ev.eventName}</h4>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${getBadgeColor(ev.eventType)}`}>
                        {ev.eventType}
                      </span>
                    </div>
                    
                    <p className="text-xs text-[#B3CFE5]/75 mb-3 leading-relaxed">{ev.eventDescription}</p>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#B3CFE5]/50 mb-4">
                      {ev.eventTime && <span>🕒 {ev.eventTime}</span>}
                      <span>📍 {ev.eventLocation}</span>
                    </div>

                    <div className="flex gap-2">
                      <a 
                        href={getGoogleCalendarUrl(ev)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 text-center text-xs font-bold bg-[#4A7FA7]/20 border border-[#4A7FA7]/30 hover:bg-[#4A7FA7]/40 rounded-lg transition"
                      >
                        Google Calendar
                      </a>
                      <a 
                        href={getICSFileUri(ev)}
                        download="event.ics"
                        className="flex-1 py-2 text-center text-xs font-bold bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg transition"
                      >
                        Outlook / Apple
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Event Modal */}
      {isSubmitModalOpen && (
        <div 
          onClick={() => setIsSubmitModalOpen(false)}
          className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm z-[9999] animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl p-8 border border-[#B3CFE5]/30 shadow-2xl relative text-white"
            style={{
              background: 'linear-gradient(135deg, rgba(10,25,49,0.98), rgba(20,45,75,0.98))',
            }}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold font-serif text-[#B3CFE5]">Submit Campus Event</h3>
                <p className="text-xs text-[#B3CFE5]/50 mt-0.5">Advertise your club activities on the calendar</p>
              </div>
              <button 
                onClick={() => setIsSubmitModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition text-white/60 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEventSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#B3CFE5] uppercase tracking-wider mb-2">Event Title</label>
                <input
                  type="text"
                  required
                  value={formData.eventName}
                  onChange={(e) => setFormData(prev => ({ ...prev, eventName: e.target.value }))}
                  placeholder="e.g. Netronix Workshop"
                  className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3 text-white focus:outline-none focus:border-white focus:ring-3 focus:ring-white/10 transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#B3CFE5] uppercase tracking-wider mb-2">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.eventDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                    className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3 text-white focus:outline-none focus:border-white transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#B3CFE5] uppercase tracking-wider mb-2">Time (Optional)</label>
                  <input
                    type="time"
                    value={formData.eventTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventTime: e.target.value }))}
                    className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3 text-white focus:outline-none focus:border-white transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#B3CFE5] uppercase tracking-wider mb-2">Event Type</label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventType: e.target.value }))}
                    className="w-full bg-[#0E223C] border border-[#B3CFE5]/30 text-white rounded-xl p-3 focus:outline-none focus:border-white transition-all text-sm"
                  >
                    <option value="General">General</option>
                    <option value="Tech">Tech</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Academic">Academic</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#B3CFE5] uppercase tracking-wider mb-2">Location</label>
                  <input
                    type="text"
                    required
                    value={formData.eventLocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventLocation: e.target.value }))}
                    placeholder="e.g. Seminar Hall"
                    className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3 text-white focus:outline-none focus:border-white transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#B3CFE5] uppercase tracking-wider mb-2">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.eventDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, eventDescription: e.target.value }))}
                  placeholder="Details about society organizers, registration links, etc..."
                  className="w-full bg-white/5 border border-[#B3CFE5]/30 rounded-xl p-3 text-white focus:outline-none focus:border-white transition-all resize-none text-sm"
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-full text-sm font-semibold border border-white/10 bg-white/5 hover:bg-white/10 text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2 rounded-full text-sm font-bold bg-[#4A7FA7] hover:bg-[#1A3D63] text-white border border-[#B3CFE5]/40 transition shadow cursor-pointer disabled:opacity-60"
                >
                  {submitLoading ? 'Submitting...' : 'Submit Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
