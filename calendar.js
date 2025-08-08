document.addEventListener('DOMContentLoaded', () => {
    // This will be populated from Firebase
    let events = {};
    let currentEvent = null; // To store the event for the Add to Calendar modal

    // --- Notification System ---
    function showNotification(title, message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationTitle = document.getElementById('notification-title');
        const notificationMessage = document.getElementById('notification-message');
        const notificationContainer = document.getElementById('notification-container');

        if (!notification || !notificationTitle || !notificationMessage || !notificationContainer) {
            console.error("Notification elements not found.");
            return;
        }

        notificationTitle.textContent = title;
        notificationMessage.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');

        setTimeout(() => {
            hideNotification();
        }, 4000);
    }

    function hideNotification() {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.classList.remove('show');
        }
    }

    const notificationCloseBtn = document.getElementById('notification-close');
    if (notificationCloseBtn) {
        notificationCloseBtn.addEventListener('click', hideNotification);
    }

    // --- Add to Calendar Modal Functions ---
    const addToCalendarModal = document.getElementById('add-to-calendar-modal');
    const addToCalendarCloseBtn = document.querySelector('.modal-close-add');
    const googleCalendarLink = document.getElementById('google-calendar-link');
    const outlookCalendarLink = document.getElementById('outlook-calendar-link');
    const appleCalendarLink = document.getElementById('apple-calendar-link');

    function showAddToCalendarModal(event) {
        currentEvent = event;
        if (addToCalendarModal) {
            addToCalendarModal.classList.remove('hidden');
        }
    }

    function hideAddToCalendarModal() {
        if (addToCalendarModal) {
            addToCalendarModal.classList.add('hidden');
        }
    }

    if (addToCalendarCloseBtn) {
        addToCalendarCloseBtn.addEventListener('click', hideAddToCalendarModal);
    }

    if (addToCalendarModal) {
        addToCalendarModal.addEventListener('click', (e) => {
            if (e.target === addToCalendarModal) {
                hideAddToCalendarModal();
            }
        });
    }

    function generateCalendarLinks(event) {
        // Google Calendar link
        const googleLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${formatDateForGoogleCalendar(event.date, event.time)}/${formatDateForGoogleCalendar(event.date, event.time, 60)}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
        googleCalendarLink.href = googleLink;

        // Outlook Calendar link
        const outlookLink = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(event.name)}&startdt=${formatDateForOutlook(event.date, event.time)}&enddt=${formatDateForOutlook(event.date, event.time, 60)}&body=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
        outlookCalendarLink.href = outlookLink;

        // Apple Calendar (.ics) link
        const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${formatUTCDateWithTime(event.date, event.time)}\nDTEND:${formatUTCDateWithTime(event.date, event.time, 60)}\nSUMMARY:${event.name}\nDESCRIPTION:${event.description}\nLOCATION:${event.location || ''}\nEND:VEVENT\nEND:VCALENDAR`;
        const appleLink = `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
        appleCalendarLink.href = appleLink;
        appleCalendarLink.download = `${event.name}.ics`;
    }

    if (googleCalendarLink) {
        googleCalendarLink.addEventListener('click', () => {
            if (currentEvent) generateCalendarLinks(currentEvent);
            hideAddToCalendarModal();
        });
    }

    if (outlookCalendarLink) {
        outlookCalendarLink.addEventListener('click', () => {
            if (currentEvent) generateCalendarLinks(currentEvent);
            hideAddToCalendarModal();
        });
    }

    if (appleCalendarLink) {
        appleCalendarLink.addEventListener('click', () => {
            if (currentEvent) generateCalendarLinks(currentEvent);
            hideAddToCalendarModal();
        });
    }

    // --- Backend Firebase Functions ---
    async function saveEvent(eventData) {
        try {
            const newEvent = {
                name: eventData.name,
                date: eventData.date,
                time: eventData.time || null,
                type: eventData.type,
                location: eventData.location,
                description: eventData.description,
                submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
                submittedBy: auth.currentUser ? auth.currentUser.uid : "Guest",
                status: "pending" // All new events start as pending
            };
            await db.collection("events").add(newEvent);
            return { success: true };
        } catch (error) {
            console.error("Error saving event:", error);
            return { success: false, error: "Failed to save event." };
        }
    }

    async function getAllEvents() {
        try {
            const querySnapshot = await db.collection("events")
                .where("status", "==", "approved")
                .get();
            const fetchedEvents = {};

            querySnapshot.forEach((doc) => {
                const event = doc.data();
                const eventId = doc.id;
                const eventDate = event.date;

                if (!fetchedEvents[eventDate]) {
                    fetchedEvents[eventDate] = [];
                }
                fetchedEvents[eventDate].push({
                    id: eventId,
                    name: event.name,
                    date: event.date,
                    time: event.time,
                    type: event.type,
                    location: event.location,
                    description: event.description
                });
            });

            return { success: true, events: fetchedEvents };
        } catch (error) {
            console.error("Error fetching events:", error);
            return { success: false, error: "Failed to fetch events." };
        }
    }

    // --- Date Formatting Functions ---
    function formatUTCDate(dateString) {
        const date = new Date(dateString);
        date.setHours(9, 0, 0, 0);
        return date.toISOString().replace(/-|:|\.\d+/g, "");
    }

    function formatUTCDateWithTime(dateString, timeString, addMinutes = 0) {
        const [year, month, day] = dateString.split('-').map(Number);
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date(year, month - 1, day, hours, minutes + addMinutes, 0, 0);
        return date.toISOString().replace(/-|:|\.\d+/g, "");
    }

    function formatEventDateTime(dateString, timeString = null) {
        const [year, month, day] = dateString.split('-').map(Number);
        const eventDate = new Date(year, month - 1, day);
        const formattedDate = eventDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        if (timeString) {
            const [hours, minutes] = timeString.split(':').map(Number);
            const timeDate = new Date();
            timeDate.setHours(hours, minutes, 0, 0);
            const formattedTime = timeDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            return `${formattedDate} at ${formattedTime}`;
        }

        return formattedDate;
    }

    function formatDateForGoogleCalendar(dateString, timeString = null, durationMinutes = 0) {
        const [year, month, day] = dateString.split('-').map(Number);
        const baseDate = new Date(year, month - 1, day);

        if (timeString) {
            const [hours, minutes] = timeString.split(':').map(Number);
            baseDate.setHours(hours, minutes);
            const endDate = new Date(baseDate.getTime() + durationMinutes * 60000);
            return `${baseDate.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`;
        }

        return `${baseDate.getFullYear()}${String(baseDate.getMonth() + 1).padStart(2, '0')}${String(baseDate.getDate()).padStart(2, '0')}`;
    }

    function formatDateForOutlook(dateString, timeString = null, durationMinutes = 0) {
        const [year, month, day] = dateString.split('-').map(Number);
        const baseDate = new Date(year, month - 1, day);
        if (timeString) {
            const [hours, minutes] = timeString.split(':').map(Number);
            baseDate.setHours(hours, minutes);
        } else {
            baseDate.setHours(9, 0, 0);
        }
        const endDate = new Date(baseDate.getTime() + durationMinutes * 60000);
        return baseDate.toISOString();
    }

    // --- Frontend UI Logic ---
    const navEvents = document.getElementById('nav-events');
    const navSubmit = document.getElementById('nav-submit');
    const navCalendar = document.getElementById('nav-calendar');
    const calendarView = document.getElementById('calendar-view');
    const submitEventView = document.getElementById('submit-event-view');
    const eventsView = document.getElementById('events-view');
    const mapView = document.getElementById('map-view');
    const monthYearEl = document.getElementById('month-year');
    const calendarGrid = document.getElementById('calendar-grid');
    const leftArrow = document.getElementById('left-arrow');
    const rightArrow = document.getElementById('right-arrow');
    const popup = document.getElementById('event-popup');
    const closeBtn = document.querySelector('.close-btn');
    const eventListContainer = document.getElementById('event-list-container');
    const eventForm = document.getElementById('event-form');
    const upcomingEventsContainer = document.getElementById('upcoming-events');
    const pastEventsContainer = document.getElementById('past-events');
    const signInBtn = document.querySelector('.sign-in-btn');

    let currentDate = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    function showPage(pageId) {
        if (calendarView) calendarView.style.display = 'none';
        if (submitEventView) submitEventView.style.display = 'none';
        if (eventsView) eventsView.style.display = 'none';
        if (mapView) mapView.style.display = 'none';

        let viewId;
        switch (pageId) {
            case 'home':
                viewId = 'calendar-view';
                break;
            case 'submit':
                viewId = 'submit-event-view';
                break;
            case 'events':
                viewId = 'events-view';
                break;
            case 'map':
                viewId = 'map-view';
                break;
            default:
                viewId = `${pageId}-view`;
        }

        const viewToShow = document.getElementById(viewId);
        if (viewToShow) {
            viewToShow.style.display = 'block';
        } else {
            console.error(`View ${viewId} not found`);
        }

        // Remove active class from all nav links
        if (navEvents) navEvents.classList.remove('active');
        if (navSubmit) navSubmit.classList.remove('active');
        
        // Add active class to current nav link
        const activeLink = document.getElementById(`nav-${pageId}`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        if (pageId === 'events') renderEventsPage();
    }

    function renderCalendar() {
        if (!monthYearEl || !calendarGrid) return; // Exit if elements don't exist
        
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        monthYearEl.textContent = `${monthNames[month]} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const lastMonthDays = new Date(year, month, 0).getDate();
        const prevMonth = new Date(year, month - 1);
        const nextMonth = new Date(year, month + 1);

        calendarGrid.innerHTML = `
            <div class="day-of-week">Su</div>
            <div class="day-of-week">Mo</div>
            <div class="day-of-week">Tu</div>
            <div class="day-of-week">We</div>
            <div class="day-of-week">Th</div>
            <div class="day-of-week">Fr</div>
            <div class="day-of-week">Sa</div>
        `;

        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            const dayEl = document.createElement('div');
            dayEl.className = 'day other-month';
            dayEl.textContent = lastMonthDays - i;
            dayEl.setAttribute('data-date', `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-${String(lastMonthDays - i).padStart(2, '0')}`);
            calendarGrid.appendChild(dayEl);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            const dayDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            dayEl.className = 'day';
            dayEl.textContent = i;
            dayEl.setAttribute('data-date', dayDate);

            if (events[dayDate] && events[dayDate].length > 0) {
                const eventDot = document.createElement('div');
                eventDot.className = 'event-dot';
                dayEl.appendChild(eventDot);
            }

            const today = new Date();
            if (new Date(dayDate).toDateString() === today.toDateString()) {
                dayEl.classList.add('active');
            }

            dayEl.addEventListener('click', () => {
                if (events[dayDate] && events[dayDate].length > 0) {
                    showEventPopup(dayDate);
                }
                document.querySelectorAll('.day').forEach(d => d.classList.remove('selected'));
                dayEl.classList.add('selected');
            });
            calendarGrid.appendChild(dayEl);
        }

        const totalCells = calendarGrid.children.length - 7;
        const remainingCells = 42 - totalCells;
        for (let i = 1; i <= remainingCells; i++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'day other-month';
            dayEl.textContent = i;
            dayEl.setAttribute('data-date', `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`);
            calendarGrid.appendChild(dayEl);
        }
    }

    async function loadEventsAndRender() {
        const result = await getAllEvents();
        if (result.success) {
            events = result.events;
            renderCalendar();
        } else {
            console.error("Failed to load events:", result.error);
        }
    }

    function createEventDetailsCard(event) {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-details-card';
        eventCard.innerHTML = `
            <h3 class="popup-title">${event.name}</h3>
            <p class="popup-date">${formatEventDateTime(event.date, event.time)}</p>
            <div class="popup-tags">
                <span class="event-tag tag-${event.type.toLowerCase()}">${event.type}</span>
            </div>
            <p class="popup-description">${event.description}</p>
            <div class="popup-location-container">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                    class="bi bi-geo-alt-fill" viewBox="0 0 16 16">
                    <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-1a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
                </svg>
                <span id="popup-location">${event.location}</span>
            </div>
            <div class="popup-buttons">
                <button class="add-to-calendar-btn">Add to Calendar</button>
            </div>
        `;

        eventCard.querySelector('.add-to-calendar-btn').addEventListener('click', () => {
            showAddToCalendarModal(event);
        });

        return eventCard;
    }

    function showEventPopup(eventKey) {
        const dayEvents = events[eventKey];
        if (!dayEvents || dayEvents.length === 0) return;

        const popup = document.getElementById('event-popup');
        eventListContainer.innerHTML = '';

        dayEvents.forEach(event => {
            eventListContainer.appendChild(createEventDetailsCard(event));
        });

        popup.classList.remove('hidden');
    }

    function hideEventPopup() {
        const popup = document.getElementById('event-popup');
        if (popup) {
            popup.classList.add('hidden');
        }
        document.querySelectorAll('.day').forEach(d => d.classList.remove('selected'));
    }

    function createEventCard(event) {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
            <div class="letter-card ${event.type.toLowerCase()}">${event.type.charAt(0)}</div>
            <div class="event-card-content">
                <h3 class="event-card-title">${event.name}</h3>
                <p class="event-card-date">${formatEventDateTime(event.date, event.time)}</p>
                <p class="event-card-description">${event.description}</p>
                <p class="event-card-location">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-geo-alt-fill" viewBox="0 0 16 16"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-1a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>
                    ${event.location}
                </p>
            </div>
        `;
        card.addEventListener('click', () => showEventPopupFromCard(event));
        return card;
    }

    function showEventPopupFromCard(event) {
        currentEvent = event;
        const popup = document.getElementById('event-popup');
        eventListContainer.innerHTML = '';
        eventListContainer.appendChild(createEventDetailsCard(event));
        popup.classList.remove('hidden');
    }

    function renderEventsPage() {
        upcomingEventsContainer.innerHTML = '';
        pastEventsContainer.innerHTML = '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        Object.keys(events).sort().forEach(eventKey => {
            const [year, month, day] = eventKey.split('-').map(Number);
            const eventDate = new Date(year, month - 1, day);

            const dayEvents = events[eventKey];
            if (dayEvents && dayEvents.length > 0) {
                dayEvents.forEach(event => {
                    const eventCard = createEventCard(event);
                    if (eventDate >= today) {
                        upcomingEventsContainer.appendChild(eventCard);
                    } else {
                        pastEventsContainer.appendChild(eventCard);
                    }
                });
            }
        });
    }

    // Event listeners
    if (leftArrow) {
        leftArrow.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }

    if (rightArrow) {
        rightArrow.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', hideEventPopup);
    }

    if (popup) {
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                hideEventPopup();
            }
        });
    }

    if (navEvents) {
        navEvents.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('events');
        });
    }

    if (navSubmit) {
        navSubmit.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('submit');
        });
    }

    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const eventName = document.getElementById('eventName').value;
            const eventDate = document.getElementById('eventDate').value;
            const eventTime = document.getElementById('eventTime').value;
            const eventType = document.getElementById('eventType').value;
            const eventLocation = document.getElementById('eventLocation').value;
            const eventDescription = document.getElementById('eventDescription').value;

            const eventData = {
                name: eventName,
                date: eventDate,
                time: eventTime,
                type: eventType,
                location: eventLocation,
                description: eventDescription
            };

            const result = await saveEvent(eventData);
            if (result.success) {
                showNotification('Success!', 'Event submitted successfully! It will be reviewed by an admin before appearing on the calendar.', 'success');
                eventForm.reset();
                showPage('home');
                await loadEventsAndRender();
            } else {
                showNotification('Error', 'Failed to submit event: ' + result.error, 'error');
            }
        });
    }

    // Initial render - only if we're on the calendar page
    if (calendarView && submitEventView && eventsView) {
        showPage('home');
        loadEventsAndRender();
        
        // Apply theme on page load to ensure consistency
        applyThemeToCalendar();
    }

    // Theme management is handled by theme-manager.js
    // But we need to apply theme when switching to calendar page
    function applyThemeToCalendar() {
        const savedTheme = localStorage.getItem('selected-theme') || 'basic-dark';
        const body = document.body;
        
        // Remove all existing theme classes
        body.classList.remove('theme-basic-light', 'theme-basic-dark', 'theme-giki');
        
        // Add the selected theme class
        body.classList.add(`theme-${savedTheme}`);
        
        // Update theme selector if it exists
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = savedTheme;
        }
    }
});

// --- Admin Functions for Event Approval ---

/**
 * Fetches all pending events for admin review.
 * @returns {Promise<object>} A promise that resolves with pending events.
 */
async function getPendingEvents() {
    const user = auth.currentUser;
    if (!user) {
        console.log("No authenticated user");
        return { success: false, error: "Authentication required." };
    }

    console.log("Getting pending events for user:", user.uid);

    // Verify admin status server-side
    try {
        console.log("Checking admin status...");
        const isAdmin = await isUserAdmin();
        console.log("Admin check result:", isAdmin);
        
        if (!isAdmin) {
            console.error("Unauthorized access attempt to fetch pending events");
            return { success: false, error: "Admin privileges required." };
        }

        console.log("Admin verified, fetching pending events...");
        const snapshot = await db.collection("events")
            .where("status", "==", "pending")
            .get();

        const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sort by submittedAt on the client side (oldest first)
        events.sort((a, b) => {
            const aTime = a.submittedAt ? a.submittedAt.toDate ? a.submittedAt.toDate() : new Date(a.submittedAt) : new Date(0);
            const bTime = b.submittedAt ? b.submittedAt.toDate ? b.submittedAt.toDate() : new Date(b.submittedAt) : new Date(0);
            return aTime - bTime;
        });
        
        console.log("Found", events.length, "pending events");
        return { success: true, events: events };

    } catch (error) {
        console.error("Error fetching pending events:", error);
        return { success: false, error: "Failed to fetch pending events." };
    }
}

/**
 * Updates the status of an event (e.g., to "approved" or "rejected").
 * @param {string} eventId - The ID of the event to update.
 * @param {string} newStatus - The new status ("approved" or "rejected").
 * @returns {Promise<object>} A promise that resolves on success.
 */
async function updateEventStatus(eventId, newStatus) {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: "Authentication required." };
    }

    // Verify admin status server-side
    try {
        const isAdmin = await isUserAdmin();
        if (!isAdmin) {
            console.error("Unauthorized access attempt to update event status");
            return { success: false, error: "Admin privileges required." };
        }

        const docRef = db.collection("events").doc(eventId);
        await docRef.update({ 
            status: newStatus,
            reviewedBy: user.uid,
            reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating event status:", error);
        return { success: false, error: "Failed to update status." };
    }
}

/**
 * Fetches all events by status (pending, approved, rejected, all).
 * @param {string} status - The status to filter by ("pending", "approved", "rejected", "all").
 * @returns {Promise<object>} A promise that resolves with events.
 */
async function getEventsByStatus(status = "all") {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: "Authentication required." };
    }

    try {
        const isAdmin = await isUserAdmin();
        if (!isAdmin) {
            console.error("Unauthorized access attempt to fetch events");
            return { success: false, error: "Admin privileges required." };
        }

        let query = db.collection("events").orderBy("createdAt", "desc");
        
        if (status !== "all") {
            query = query.where("status", "==", status);
        }

        const snapshot = await query.get();
        const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        return { success: true, events: events };
    } catch (error) {
        console.error("Error fetching events by status:", error);
        return { success: false, error: "Failed to fetch events." };
    }
}

/**
 * Fetches upcoming events (approved events with dates in the future).
 * @returns {Promise<object>} A promise that resolves with upcoming events.
 */
async function getUpcomingEvents() {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: "Authentication required." };
    }

    try {
        const isAdmin = await isUserAdmin();
        if (!isAdmin) {
            return { success: false, error: "Admin privileges required." };
        }

        const now = new Date();
        const snapshot = await db.collection("events")
            .where("status", "==", "approved")
            .where("date", ">=", now.toISOString().split('T')[0])
            .orderBy("date", "asc")
            .get();

        const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { success: true, events: events };
    } catch (error) {
        console.error("Error fetching upcoming events:", error);
        return { success: false, error: "Failed to fetch upcoming events." };
    }
}

/**
 * Fetches past events (approved events with dates in the past).
 * @returns {Promise<object>} A promise that resolves with past events.
 */
async function getPastEvents() {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: "Authentication required." };
    }

    try {
        const isAdmin = await isUserAdmin();
        if (!isAdmin) {
            return { success: false, error: "Admin privileges required." };
        }

        const now = new Date();
        const snapshot = await db.collection("events")
            .where("status", "==", "approved")
            .where("date", "<", now.toISOString().split('T')[0])
            .orderBy("date", "desc")
            .get();

        const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { success: true, events: events };
    } catch (error) {
        console.error("Error fetching past events:", error);
        return { success: false, error: "Failed to fetch past events." };
    }
}

/**
 * Deletes an event permanently from the database.
 * @param {string} eventId - The ID of the event to delete.
 * @returns {Promise<object>} A promise that resolves on success.
 */
async function deleteEvent(eventId) {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: "Authentication required." };
    }

    try {
        const isAdmin = await isUserAdmin();
        if (!isAdmin) {
            console.error("Unauthorized access attempt to delete event");
            return { success: false, error: "Admin privileges required." };
        }

        await db.collection("events").doc(eventId).delete();
        console.log("Event deleted successfully:", eventId);
        return { success: true, message: "Event deleted successfully." };
    } catch (error) {
        console.error("Error deleting event:", error);
        return { success: false, error: "Failed to delete event." };
    }
}

/**
 * Gets event statistics for admin dashboard.
 * @returns {Promise<object>} A promise that resolves with event statistics.
 */
async function getEventStats() {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: "Authentication required." };
    }

    try {
        const isAdmin = await isUserAdmin();
        if (!isAdmin) {
            return { success: false, error: "Admin privileges required." };
        }

        const [pending, approved, rejected] = await Promise.all([
            db.collection("events").where("status", "==", "pending").get(),
            db.collection("events").where("status", "==", "approved").get(),
            db.collection("events").where("status", "==", "rejected").get()
        ]);

        return {
            success: true,
            stats: {
                pending: pending.size,
                approved: approved.size,
                rejected: rejected.size,
                total: pending.size + approved.size + rejected.size
            }
        };
    } catch (error) {
        console.error("Error fetching event stats:", error);
        return { success: false, error: "Failed to fetch event statistics." };
    }
}