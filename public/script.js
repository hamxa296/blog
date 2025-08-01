/*
    JavaScript for GIKI Chronicles Blog
    Handles main page logic, view switching, and initializes modules.
*/

document.addEventListener('DOMContentLoaded', () => {

    // --- Element Selections ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const homeTab = document.getElementById('home-tab');
    const eventsTab = document.getElementById('events-tab');
    const mobileHomeTab = document.getElementById('mobile-home-tab');
    const mobileEventsTab = document.getElementById('mobile-events-tab');
    const blogContent = document.getElementById('blog-content');
    const eventsContent = document.getElementById('events-content');

    // Event Details Modal elements
    const eventModal = document.getElementById('event-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDate = document.getElementById('modal-date');
    const modalDescription = document.getElementById('modal-description');
    const googleCalendarLink = document.getElementById('google-calendar-link');
    const modalClose = document.getElementById('modal-close');

    // Add Event Modal elements
    const addEventModal = document.getElementById('add-event-modal');
    const addEventButton = document.getElementById('add-event-button');
    const addEventModalClose = document.getElementById('add-event-modal-close');
    const addEventForm = document.getElementById('add-event-form');

    let calendarInstance = null;

    // --- Modal Functions ---
    function openEventModal(event) {
        const startDate = new Date(event.date);
        // Assume event is 2 hours long for Google Calendar
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
        // Format dates for Google Calendar URL (YYYYMMDDTHHMMSSZ)
        const formatGoogleDate = (date) => date.toISOString().replace(/-|:|\.\d+/g, '');
        const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&details=${encodeURIComponent(event.description)}&location=GIK%20Institute,%20Topi,%20Pakistan`;

        modalTitle.textContent = event.title;
        modalDate.textContent = startDate.toLocaleString('default', { dateStyle: 'full', timeStyle: 'short' });
        modalDescription.textContent = event.description;
        googleCalendarLink.href = googleCalendarUrl;

        eventModal.classList.remove('hidden');
    }

    function closeEventModal() {
        if (eventModal) eventModal.classList.add('hidden');
    }

    function openAddEventModal() {
        if (addEventModal) addEventModal.classList.remove('hidden');
    }

    function closeAddEventModal() {
        if (addEventModal) addEventModal.classList.add('hidden');
    }

    // --- Calendar Initialization ---
    function initializeCalendar() {
        if (calendarInstance) {
            calendarInstance.render(); // Re-render if already initialized
            return;
        }

        const calendarContainer = document.getElementById('calendar-container');
        const calendarTitle = document.getElementById('calendar-title');

        // Ensure the Calendar class from calendar.js is loaded
        if (calendarContainer && calendarTitle && typeof Calendar !== 'undefined') {
            calendarInstance = new Calendar({
                container: calendarContainer,
                titleElement: calendarTitle,
                onEventClick: openEventModal
            });

            // Set up event listeners for calendar controls
            document.getElementById('prev-button').addEventListener('click', () => calendarInstance.previous());
            document.getElementById('next-button').addEventListener('click', () => calendarInstance.next());
            document.getElementById('year-view-button').addEventListener('click', () => calendarInstance.setView('year'));
            document.getElementById('month-view-button').addEventListener('click', () => calendarInstance.setView('month'));
            document.getElementById('week-view-button').addEventListener('click', () => calendarInstance.setView('week'));
            document.getElementById('day-view-button').addEventListener('click', () => calendarInstance.setView('day'));

            calendarInstance.render();
        } else {
            console.error("Calendar dependencies not found. Make sure calendar.js is loaded and HTML elements exist.");
        }
    }


    // --- Page View Switching ---
    function switchPage(view) {
        const showEvents = view === 'events';
        blogContent.classList.toggle('hidden', showEvents);
        eventsContent.classList.toggle('hidden', !showEvents);

        document.querySelectorAll('#home-tab, #mobile-home-tab').forEach(tab => {
            tab.classList.toggle('text-blue-600', !showEvents);
            tab.classList.toggle('font-semibold', !showEvents);
        });
        document.querySelectorAll('#events-tab, #mobile-events-tab').forEach(tab => {
            tab.classList.toggle('text-blue-600', showEvents);
            tab.classList.toggle('font-semibold', showEvents);
        });

        if (showEvents) {
            initializeCalendar();
        }

        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
        }
    }

    // --- Event Listeners ---
    if (mobileMenuButton) mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));

    homeTab.addEventListener('click', (e) => { e.preventDefault(); switchPage('blog'); });
    eventsTab.addEventListener('click', (e) => { e.preventDefault(); switchPage('events'); });
    mobileHomeTab.addEventListener('click', (e) => { e.preventDefault(); switchPage('blog'); });
    mobileEventsTab.addEventListener('click', (e) => { e.preventDefault(); switchPage('events'); });

    // Event Details Modal Listeners
    modalClose.addEventListener('click', closeEventModal);
    eventModal.addEventListener('click', (e) => { if (e.target === eventModal) closeEventModal(); });

    // Add Event Modal Listeners
    addEventButton.addEventListener('click', openAddEventModal);
    addEventModalClose.addEventListener('click', closeAddEventModal);
    addEventModal.addEventListener('click', (e) => { if (e.target === addEventModal) closeAddEventModal(); });

    addEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(addEventForm);
        const newEvent = {
            title: formData.get('title'),
            date: new Date(formData.get('date')).toISOString(),
            description: formData.get('description')
        };

        if (calendarInstance) {
            calendarInstance.addEvent(newEvent);
        }

        addEventForm.reset();
        closeAddEventModal();
    });

    // --- Initial State ---
    switchPage('blog'); // Start on the blog view
});
