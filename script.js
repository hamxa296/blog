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
    const editEventButton = document.getElementById('edit-event-button');
    const deleteEventButton = document.getElementById('delete-event-button');

    // Add Event Modal elements
    const addEventModal = document.getElementById('add-event-modal');
    const addEventButton = document.getElementById('add-event-button');
    const addEventModalClose = document.getElementById('add-event-modal-close');
    const addEventForm = document.getElementById('add-event-form');

    // Edit Event Modal elements
    const editEventModal = document.getElementById('edit-event-modal');
    const editEventModalClose = document.getElementById('edit-event-modal-close');
    const editEventForm = document.getElementById('edit-event-form');

    // Delete Confirmation Modal elements
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const confirmDeleteButton = document.getElementById('confirm-delete-button');
    const cancelDeleteButton = document.getElementById('cancel-delete-button');


    let calendarInstance = null;
    let currentOpenEvent = null;

    // --- Modal Functions ---
    function openEventModal(event) {
        currentOpenEvent = event; // Store the event for potential editing or deletion
        const startDate = new Date(event.date);
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
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
        currentOpenEvent = null;
    }

    function openAddEventModal() {
        if (addEventModal) addEventModal.classList.remove('hidden');
    }

    function closeAddEventModal() {
        if (addEventModal) addEventModal.classList.add('hidden');
    }

    function openEditEventModal(event) {
        if (!event) return;
        const eventDate = new Date(event.date);
        // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
        const localDateTime = new Date(eventDate.getTime() - (eventDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

        document.getElementById('edit-event-id').value = event.id;
        document.getElementById('edit-event-title').value = event.title;
        document.getElementById('edit-event-date').value = localDateTime;
        document.getElementById('edit-event-description').value = event.description;

        closeEventModal(); // Close the details modal first
        if (editEventModal) editEventModal.classList.remove('hidden');
    }

    function closeEditEventModal() {
        if (editEventModal) editEventModal.classList.add('hidden');
    }

    function openDeleteConfirmModal() {
        closeEventModal();
        if (deleteConfirmModal) deleteConfirmModal.classList.remove('hidden');
    }

    function closeDeleteConfirmModal() {
        if (deleteConfirmModal) deleteConfirmModal.classList.add('hidden');
    }

    // --- Calendar Initialization ---
    function initializeCalendar() {
        if (calendarInstance) {
            calendarInstance.render();
            return;
        }

        const calendarContainer = document.getElementById('calendar-container');
        const calendarTitle = document.getElementById('calendar-title');

        if (calendarContainer && calendarTitle && typeof Calendar !== 'undefined') {
            calendarInstance = new Calendar({
                container: calendarContainer,
                titleElement: calendarTitle,
                onEventClick: openEventModal
            });

            document.getElementById('prev-button').addEventListener('click', () => calendarInstance.previous());
            document.getElementById('next-button').addEventListener('click', () => calendarInstance.next());
            document.getElementById('year-view-button').addEventListener('click', () => calendarInstance.setView('year'));
            document.getElementById('month-view-button').addEventListener('click', () => calendarInstance.setView('month'));
            document.getElementById('week-view-button').addEventListener('click', () => calendarInstance.setView('week'));
            document.getElementById('day-view-button').addEventListener('click', () => calendarInstance.setView('day'));

            calendarInstance.render();
        } else {
            console.error("Calendar dependencies not found.");
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
    editEventButton.addEventListener('click', () => openEditEventModal(currentOpenEvent));
    deleteEventButton.addEventListener('click', openDeleteConfirmModal);


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

    // Edit Event Modal Listeners
    editEventModalClose.addEventListener('click', closeEditEventModal);
    editEventModal.addEventListener('click', (e) => { if (e.target === editEventModal) closeEditEventModal(); });

    editEventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(editEventForm);
        const updatedEvent = {
            id: parseInt(formData.get('id')),
            title: formData.get('title'),
            date: new Date(formData.get('date')).toISOString(),
            description: formData.get('description')
        };

        if (calendarInstance) {
            calendarInstance.editEvent(updatedEvent);
        }

        editEventForm.reset();
        closeEditEventModal();
    });

    // Delete Confirmation Modal Listeners
    cancelDeleteButton.addEventListener('click', closeDeleteConfirmModal);
    deleteConfirmModal.addEventListener('click', (e) => { if (e.target === deleteConfirmModal) closeDeleteConfirmModal(); });
    confirmDeleteButton.addEventListener('click', () => {
        if (calendarInstance && currentOpenEvent) {
            calendarInstance.deleteEvent(currentOpenEvent.id);
        }
        closeDeleteConfirmModal();
    });

    // --- Initial State ---
    switchPage('blog'); // Start on the blog view
});
