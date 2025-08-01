/*
    JavaScript for GIKI Chronicles Blog
    Handles interactive elements of the site.
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
    const calendarContainer = document.getElementById('calendar-container');
    const eventModal = document.getElementById('event-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDate = document.getElementById('modal-date');
    const modalDescription = document.getElementById('modal-description');
    const googleCalendarLink = document.getElementById('google-calendar-link');
    const modalClose = document.getElementById('modal-close');

    // --- Mock Event Data ---
    // In a real application, this would come from a database.
    const events = [
        {
            title: 'NASTP Guest Speaker Session',
            date: '2025-08-15T14:00:00',
            description: 'A talk on the future of aerospace technology by a leading expert from the National Aerospace Science and Technology Park.'
        },
        {
            title: 'All-Pakistan Programming Contest',
            date: '2025-09-05T09:00:00',
            description: 'The annual flagship programming competition hosted by the GIKI Computer Society. Teams from all over Pakistan will compete.'
        },
        {
            title: 'GIKI Convocation 2025',
            date: '2025-10-20T11:00:00',
            description: 'The formal ceremony to confer degrees upon the graduating batch of 2025.'
        },
        {
            title: 'International Culture Night',
            date: '2025-11-12T18:00:00',
            description: 'A celebration of diversity at GIKI, with food, music, and performances from around the world.'
        }
    ];

    // --- Functions ---

    /**
     * Toggles the visibility of the mobile menu.
     */
    function toggleMobileMenu() {
        if (mobileMenu) {
            mobileMenu.classList.toggle('hidden');
        }
    }

    /**
     * Switches the view between the blog and events sections.
     * @param {string} view - The view to show ('blog' or 'events').
     */
    function switchView(view) {
        if (view === 'events') {
            blogContent.classList.add('hidden');
            eventsContent.classList.remove('hidden');
            homeTab.classList.remove('text-blue-600', 'font-semibold');
            eventsTab.classList.add('text-blue-600', 'font-semibold');
            generateCalendar();
        } else { // 'blog'
            eventsContent.classList.add('hidden');
            blogContent.classList.remove('hidden');
            eventsTab.classList.remove('text-blue-600', 'font-semibold');
            homeTab.classList.add('text-blue-600', 'font-semibold');
        }
        // Close mobile menu after switching view
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
        }
    }

    /**
     * Generates and displays the events calendar.
     */
    function generateCalendar() {
        if (!calendarContainer) return;
        calendarContainer.innerHTML = ''; // Clear previous content
        if (events.length === 0) {
            calendarContainer.innerHTML = '<p class="text-center text-gray-500">No upcoming events.</p>';
            return;
        }

        const eventList = document.createElement('div');
        eventList.className = 'space-y-4';

        // Sort events by date
        const sortedEvents = events.sort((a, b) => new Date(a.date) - new Date(b.date));

        sortedEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'event-item p-4 border rounded-lg cursor-pointer flex items-center justify-between';

            const eventDate = new Date(event.date);
            const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const timeOptions = { hour: '2-digit', minute: '2-digit' };

            eventElement.innerHTML = `
                <div>
                    <h3 class="font-bold text-lg text-gray-800">${event.title}</h3>
                    <p class="text-gray-600">${eventDate.toLocaleDateString(undefined, dateOptions)} at ${eventDate.toLocaleTimeString([], timeOptions)}</p>
                </div>
                <div class="text-blue-600 font-semibold">
                    View Details &rarr;
                </div>
            `;

            eventElement.addEventListener('click', () => openEventModal(event));
            eventList.appendChild(eventElement);
        });

        calendarContainer.appendChild(eventList);
    }

    /**
     * Opens the modal with details for a specific event.
     * @param {object} event - The event object to display.
     */
    function openEventModal(event) {
        const startDate = new Date(event.date);
        // Assume event is 2 hours long for Google Calendar
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

        // Format dates for Google Calendar URL (YYYYMMDDTHHMMSSZ)
        const formatGoogleDate = (date) => date.toISOString().replace(/-|:|\.\d+/g, '');
        const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&details=${encodeURIComponent(event.description)}&location=GIK%20Institute,%20Topi,%20Pakistan`;

        modalTitle.textContent = event.title;
        modalDate.textContent = startDate.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' });
        modalDescription.textContent = event.description;
        googleCalendarLink.href = googleCalendarUrl;

        eventModal.classList.remove('hidden');
    }

    /**
     * Closes the event details modal.
     */
    function closeEventModal() {
        if (eventModal) {
            eventModal.classList.add('hidden');
        }
    }


    // --- Event Listeners ---
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', toggleMobileMenu);
    }

    if (homeTab) homeTab.addEventListener('click', (e) => { e.preventDefault(); switchView('blog'); });
    if (eventsTab) eventsTab.addEventListener('click', (e) => { e.preventDefault(); switchView('events'); });
    if (mobileHomeTab) mobileHomeTab.addEventListener('click', (e) => { e.preventDefault(); switchView('blog'); });
    if (mobileEventsTab) mobileEventsTab.addEventListener('click', (e) => { e.preventDefault(); switchView('events'); });

    if (modalClose) modalClose.addEventListener('click', closeEventModal);
    if (eventModal) {
        // Close modal if clicking outside the content
        eventModal.addEventListener('click', (e) => {
            if (e.target === eventModal) {
                closeEventModal();
            }
        });
    }

    // --- Initial State ---
    switchView('blog'); // Start on the blog view

});
