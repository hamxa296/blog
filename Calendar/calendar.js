document.addEventListener('DOMContentLoaded', () => {
    // This will be populated from Firebase
    let events = {};
    let currentEventId = null;

    // --- Notification System ---
    
    /**
     * Shows a custom notification
     * @param {string} title - The notification title
     * @param {string} message - The notification message
     * @param {string} type - The notification type ('success' or 'error')
     */
    function showNotification(title, message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationTitle = document.getElementById('notification-title');
        const notificationMessage = document.getElementById('notification-message');
        
        // Set content
        notificationTitle.textContent = title;
        notificationMessage.textContent = message;
        
        // Set type (success/error)
        notification.className = `notification ${type}`;
        
        // Show notification
        notification.classList.add('show');
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
            hideNotification();
        }, 4000);
    }
    
    /**
     * Hides the notification
     */
    function hideNotification() {
        const notification = document.getElementById('notification');
        notification.classList.remove('show');
    }
    
    // Add event listener for close button
    const notificationCloseBtn = document.getElementById('notification-close');
    if (notificationCloseBtn) {
        notificationCloseBtn.addEventListener('click', hideNotification);
    }

    // --- Delete Confirmation Modal Functions ---
    /**
     * Shows the custom delete confirmation modal
     */
    function showDeleteConfirmModal() {
        const modal = document.getElementById('delete-confirm-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('show');
        }
    }

    /**
     * Hides the custom delete confirmation modal
     */
    function hideDeleteConfirmModal() {
        const modal = document.getElementById('delete-confirm-modal');
        if (modal) {
            modal.classList.remove('show');
            modal.classList.add('hidden');
        }
    }

    /**
     * Handles the delete confirmation action
     */
    async function handleDeleteConfirm() {
        if (currentEventId) {
            const result = await deleteEvent(currentEventId);
            if (result.success) {
                showNotification('Success!', 'Event deleted successfully!', 'success');
                hideEventPopup();
                hideDeleteConfirmModal();
                await loadEventsAndRender();
            } else {
                showNotification('Error', 'Error deleting event: ' + result.error, 'error');
                hideDeleteConfirmModal();
            }
        }
    }

    // Add event listeners for delete confirmation modal
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const deleteConfirmCancel = document.getElementById('delete-confirm-cancel');
    const deleteConfirmDelete = document.getElementById('delete-confirm-delete');

    if (deleteConfirmModal) {
        deleteConfirmModal.addEventListener('click', (e) => {
            if (e.target === deleteConfirmModal) {
                hideDeleteConfirmModal();
            }
        });
    }

    if (deleteConfirmCancel) {
        deleteConfirmCancel.addEventListener('click', hideDeleteConfirmModal);
    }

    if (deleteConfirmDelete) {
        deleteConfirmDelete.addEventListener('click', handleDeleteConfirm);
    }

    // --- Backend Firebase Functions ---

    /**
     * Saves a new event to the Firestore database.
     * @param {object} eventData - An object containing the event details from the form.
     * @returns {Promise<object>} A promise that resolves on success.
     */
    async function saveEvent(eventData) {
        try {
            const user = auth.currentUser;
            const newEvent = {
                name: eventData.name,
                date: eventData.date,
                time: eventData.time || null, // Include time field
                type: eventData.type,
                location: eventData.location,
                description: eventData.description,
                submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
                submittedBy: user ? user.uid : "Guest"
            };
            await db.collection("events").add(newEvent);
            return { success: true };
        } catch (error) {
            console.error("Error saving event:", error);
            return { success: false, error: "Failed to save event." };
        }
    }
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
        const formattedDate = eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        if (timeString) {
            // Format time (e.g., "14:30" to "2:30 PM")
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
    /**
     * Fetches all events from the Firestore database.
     * @returns {Promise<object>} A promise that resolves with an object of events grouped by date.
     */
    async function getAllEvents() {
        try {
            const snapshot = await db.collection("events").get();
            if (snapshot.empty) {
                return { success: true, events: {} };
            }
            const fetchedEvents = {};
            snapshot.forEach(doc => {
                const eventData = doc.data();
                if (eventData.date) {
                    // Initialize array for this date if it doesn't exist
                    if (!fetchedEvents[eventData.date]) {
                        fetchedEvents[eventData.date] = [];
                    }
                    // Add event to the array for this date
                    fetchedEvents[eventData.date].push({ id: doc.id, ...eventData });
                }
            });
            return { success: true, events: fetchedEvents };
        } catch (error) {
            console.error("Error fetching events:", error);
            return { success: false, error: "Failed to fetch events." };
        }
    }

    /**
     * Deletes an event from the Firestore database.
     * @param {string} eventId - The unique ID of the event to delete.
     * @returns {Promise<object>} A promise that resolves on success.
     */
    async function deleteEvent(eventId) {
        try {
            await db.collection("events").doc(eventId).delete();
            return { success: true };
        } catch (error) {
            console.error("Error deleting event:", error);
            return { success: false, error: "Failed to delete event." };
        }
    }

    // --- Frontend UI Logic ---

    // Element Selections
    console.log("Initializing calendar elements...");
    const navLinks = document.querySelectorAll('.nav-link');
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
    const addToCalendarBtn = document.getElementById('add-to-calendar-btn');
    const deleteEventBtn = document.getElementById('delete-event-btn');
    const eventForm = document.getElementById('event-form');
    const upcomingEventsContainer = document.getElementById('upcoming-events');
    const pastEventsContainer = document.getElementById('past-events');
    const signInBtn = document.querySelector('.sign-in-btn');
    const calendarDropdownBtn = document.getElementById('calendar-dropdown-btn');
    const calendarDropdownContent = document.getElementById('calendar-dropdown-content');

    // Debug element selection
    console.log("Calendar elements found:", {
        calendarView: !!calendarView,
        calendarGrid: !!calendarGrid,
        monthYearEl: !!monthYearEl,
        leftArrow: !!leftArrow,
        rightArrow: !!rightArrow
    });

    let currentDate = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    function showPage(pageId) {
        calendarView.style.display = 'none';
        submitEventView.style.display = 'none';
        eventsView.style.display = 'none';
        mapView.style.display = 'none';

        // Map pageId to the correct view ID
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
            // Remove debug border
            viewToShow.style.border = '';
        } else {
            console.error(`View ${viewId} not found`);
        }

        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.getElementById(`nav-${pageId}`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        if (pageId === 'events') renderEventsPage();
    }

    function createEventCard(event, eventDate) {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.style.cursor = 'pointer';
        
        // Create the event key for the modal using the event's date
        const eventKey = event.date;
        
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
        
        // Add click event listener to show modal
        card.addEventListener('click', () => {
            showEventPopupFromCard(event, eventKey);
        });
        
        return card;
    }

    function renderEventsPage() {
        upcomingEventsContainer.innerHTML = '';
        pastEventsContainer.innerHTML = '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        Object.keys(events).sort().forEach(eventKey => {
            // Create date in local timezone to avoid timezone issues
            const [year, month, day] = eventKey.split('-').map(Number);
            const eventDate = new Date(year, month - 1, day); // month is 0-indexed

            // Create a card for each event on this day
            const dayEvents = events[eventKey];
            if (dayEvents && dayEvents.length > 0) {
                dayEvents.forEach(event => {
                    const eventCard = createEventCard(event, eventDate);
                    
                    if (eventDate >= today) {
                        upcomingEventsContainer.appendChild(eventCard);
                    } else {
                        pastEventsContainer.appendChild(eventCard);
                    }
                });
            }
        });
    }

    function formatDateForGoogleCalendar(dateString, timeString = null) {
        const date = new Date(dateString);
        const baseDate = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        
        if (timeString) {
            // Add time to the date string (Google Calendar format: YYYYMMDDTHHMMSSZ)
            const [hours, minutes] = timeString.split(':').map(Number);
            return `${baseDate}T${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}00Z`;
        }
        
        return baseDate;
    }

    function showEventPopup(eventKey) {
        const dayEvents = events[eventKey];
        
        if (!dayEvents || dayEvents.length === 0) {
            // Show "No events" message
            const formattedDate = formatEventDateTime(eventKey);
            document.getElementById('event-name').textContent = 'No Events';
            document.getElementById('event-date').textContent = formattedDate;
            document.getElementById('event-description').textContent = `No events scheduled for ${formattedDate}.`;
            
            // Clear tags
            const tagsContainer = document.getElementById('event-tags');
            tagsContainer.innerHTML = '';
            
            // Hide action buttons for days with no events
            const addToCalendarBtn = document.getElementById('add-to-calendar-btn');
            const deleteEventBtn = document.getElementById('delete-event-btn');
            if (addToCalendarBtn) addToCalendarBtn.style.display = 'none';
            if (deleteEventBtn) deleteEventBtn.style.display = 'none';
            
            currentEventId = null;
        } else if (dayEvents.length === 1) {
            // Show single event details
            const event = dayEvents[0];
            currentEventId = event.id;
            
            document.getElementById('event-name').textContent = event.name;
            document.getElementById('event-date').textContent = formatEventDateTime(event.date, event.time);
            document.getElementById('event-description').textContent = event.description;

            const tagsContainer = document.getElementById('event-tags');
            tagsContainer.innerHTML = `<span class="event-tag tag-${event.type.toLowerCase()}">${event.type}</span>`;

            const eventTitle = encodeURIComponent(event.name);
            const eventDesc = encodeURIComponent(event.description);
            const eventLocation = encodeURIComponent(event.location || '');

            const googleStartDate = formatDateForGoogleCalendar(eventKey, event.time);
            const googleEndDate = event.time ? 
                formatDateForGoogleCalendar(eventKey, event.time) : // For events with time, end time is same as start time (1 hour duration)
                formatDateForGoogleCalendar(eventKey); // For events without time, use same date
            const googleLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${googleStartDate}/${googleEndDate}&details=${eventDesc}&location=${eventLocation}`;
            document.getElementById('google-link').href = googleLink;

            const icsStartDate = event.time ? 
                formatUTCDateWithTime(eventKey, event.time) : 
                formatUTCDate(eventKey);
            const icsEndDate = event.time ? 
                formatUTCDateWithTime(eventKey, event.time, 60) : // Add 1 hour for events with time
                formatUTCDate(new Date(new Date(eventKey).getTime() + (60 * 60 * 1000)));
            const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${icsStartDate}\nDTEND:${icsEndDate}\nSUMMARY:${event.name}\nDESCRIPTION:${event.description}\nLOCATION:${event.location || ''}\nEND:VEVENT\nEND:VCALENDAR`;
            const appleLink = `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
            document.getElementById('apple-link').href = appleLink;
            document.getElementById('apple-link').download = `${event.name}.ics`;

            const outlookStartDate = new Date(eventKey);
            if (event.time) {
                const [hours, minutes] = event.time.split(':').map(Number);
                outlookStartDate.setHours(hours, minutes, 0, 0);
            } else {
                outlookStartDate.setHours(9, 0, 0, 0);
            }
            const outlookEndDate = new Date(outlookStartDate.getTime() + (60 * 60 * 1000));
            const outlookLink = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${eventTitle}&startdt=${outlookStartDate.toISOString()}&enddt=${outlookEndDate.toISOString()}&body=${eventDesc}&location=${eventLocation}`;
            document.getElementById('outlook-link').href = outlookLink;
            
            // Show action buttons for days with events
            const addToCalendarBtn = document.getElementById('add-to-calendar-btn');
            const deleteEventBtn = document.getElementById('delete-event-btn');
            if (addToCalendarBtn) addToCalendarBtn.style.display = 'block';
            if (deleteEventBtn) deleteEventBtn.style.display = 'block';
        } else {
            // Show multiple events
            document.getElementById('event-name').textContent = `${dayEvents.length} Events`;
            document.getElementById('event-date').textContent = formatEventDateTime(eventKey);
            
            // Create list of events
            let eventsList = '';
            dayEvents.forEach((event, index) => {
                const eventDateTime = formatEventDateTime(event.date, event.time);
                eventsList += `<div class="event-item">
                    <h4>${event.name}</h4>
                    <p class="event-time">${eventDateTime}</p>
                    <p>${event.description}</p>
                    <span class="event-tag tag-${event.type.toLowerCase()}">${event.type}</span>
                </div>`;
                if (index < dayEvents.length - 1) eventsList += '<hr>';
            });
            document.getElementById('event-description').innerHTML = eventsList;

            // Clear tags container since we're showing multiple events
            const tagsContainer = document.getElementById('event-tags');
            tagsContainer.innerHTML = '';
            
            // Hide action buttons for multiple events (too complex to handle)
            const addToCalendarBtn = document.getElementById('add-to-calendar-btn');
            const deleteEventBtn = document.getElementById('delete-event-btn');
            if (addToCalendarBtn) addToCalendarBtn.style.display = 'none';
            if (deleteEventBtn) deleteEventBtn.style.display = 'none';
            
            currentEventId = null;
        }

        popup.classList.remove('hidden');
    }
    
    function showEventPopupFromCard(event, eventKey) {
        // Show event details
        currentEventId = event.id;
        
        document.getElementById('event-name').textContent = event.name;
        document.getElementById('event-date').textContent = formatEventDateTime(event.date, event.time);
        document.getElementById('event-description').textContent = event.description;

        const tagsContainer = document.getElementById('event-tags');
        tagsContainer.innerHTML = `<span class="event-tag tag-${event.type.toLowerCase()}">${event.type}</span>`;

        const eventTitle = encodeURIComponent(event.name);
        const eventDesc = encodeURIComponent(event.description);
        const eventLocation = encodeURIComponent(event.location || '');

        const googleStartDate = formatDateForGoogleCalendar(eventKey, event.time);
        const googleEndDate = event.time ? 
            formatDateForGoogleCalendar(eventKey, event.time) : // For events with time, end time is same as start time (1 hour duration)
            formatDateForGoogleCalendar(eventKey); // For events without time, use same date
        const googleLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${googleStartDate}/${googleEndDate}&details=${eventDesc}&location=${eventLocation}`;
        document.getElementById('google-link').href = googleLink;

        const icsStartDate = event.time ? 
            formatUTCDateWithTime(eventKey, event.time) : 
            formatUTCDate(eventKey);
        const icsEndDate = event.time ? 
            formatUTCDateWithTime(eventKey, event.time, 60) : // Add 1 hour for events with time
            formatUTCDate(new Date(new Date(eventKey).getTime() + (60 * 60 * 1000)));
        const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${icsStartDate}\nDTEND:${icsEndDate}\nSUMMARY:${event.name}\nDESCRIPTION:${event.description}\nLOCATION:${event.location || ''}\nEND:VEVENT\nEND:VCALENDAR`;
        const appleLink = `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
        document.getElementById('apple-link').href = appleLink;
        document.getElementById('apple-link').download = `${event.name}.ics`;

        const outlookStartDate = new Date(eventKey);
        if (event.time) {
            const [hours, minutes] = event.time.split(':').map(Number);
            outlookStartDate.setHours(hours, minutes, 0, 0);
        } else {
            outlookStartDate.setHours(9, 0, 0, 0);
        }
        const outlookEndDate = new Date(outlookStartDate.getTime() + (60 * 60 * 1000));
        const outlookLink = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${eventTitle}&startdt=${outlookStartDate.toISOString()}&enddt=${outlookEndDate.toISOString()}&body=${eventDesc}&location=${eventLocation}`;
        document.getElementById('outlook-link').href = outlookLink;
        
        // Show only add to calendar button, hide delete button for events tab
        const addToCalendarBtn = document.getElementById('add-to-calendar-btn');
        const deleteEventBtn = document.getElementById('delete-event-btn');
        if (addToCalendarBtn) addToCalendarBtn.style.display = 'block';
        if (deleteEventBtn) deleteEventBtn.style.display = 'none';

        popup.classList.remove('hidden');
    }

    function hideEventPopup() {
        popup.classList.add('hidden');
        currentEventId = null;
    }
    
    // Skeleton loading functions
    function showSkeletonLoading() {
        // Add skeleton class to calendar container
        const calendarContainer = document.querySelector('.calendar-container');
        if (calendarContainer) {
            calendarContainer.classList.add('skeleton-loading');
        }
    }
    
    function hideSkeletonLoading() {
        // Remove skeleton class from calendar container
        const calendarContainer = document.querySelector('.calendar-container');
        if (calendarContainer) {
            calendarContainer.classList.remove('skeleton-loading');
        }
    }
    
    function renderCalendarSkeleton() {
        const today = new Date();
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        
        if (monthYearEl) {
            monthYearEl.textContent = `${monthNames[month]} ${year}`;
        }
        
        if (calendarGrid) {
            // Clear and add day headers
            calendarGrid.innerHTML = '<div class="day-of-week">Su</div><div class="day-of-week">Mo</div><div class="day-of-week">Tu</div><div class="day-of-week">We</div><div class="day-of-week">Th</div><div class="day-of-week">Fr</div><div class="day-of-week">Sa</div>';
            
            const firstDay = new Date(year, month, 1).getDay();
            const lastDate = new Date(year, month + 1, 0).getDate();
            const prevLastDate = new Date(year, month, 0).getDate();
            
            // Add skeleton days
            for (let i = firstDay; i > 0; i--) {
                calendarGrid.innerHTML += `<div class="day other-month skeleton-day">${prevLastDate - i + 1}</div>`;
            }
            
            for (let i = 1; i <= lastDate; i++) {
                const dayDate = new Date(year, month, i);
                // Create dayKey in local timezone to avoid UTC conversion issues
                const dayKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                let dayClass = 'day skeleton-day';
                if (dayDate.toDateString() === today.toDateString()) dayClass += ' selected';
                calendarGrid.innerHTML += `<div class="${dayClass}" data-date="${dayKey}">${i}</div>`;
            }
            
            // Make days clickable even in skeleton state
            document.querySelectorAll('.day').forEach(day => {
                day.addEventListener('click', () => {
                    showEventPopup(day.dataset.date);
                });
            });
        }
    }

    function renderCalendar() {
        const today = new Date();
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        if (monthYearEl) {
            monthYearEl.textContent = `${monthNames[month]} ${year}`;
        }
        if (calendarGrid) {
            // Remove debug styles
            calendarGrid.style.border = '';
            calendarGrid.style.backgroundColor = '';
            calendarGrid.style.padding = '';
            // Clear and add day headers
            calendarGrid.innerHTML = '<div class="day-of-week">Su</div><div class="day-of-week">Mo</div><div class="day-of-week">Tu</div><div class="day-of-week">We</div><div class="day-of-week">Th</div><div class="day-of-week">Fr</div><div class="day-of-week">Sa</div>';
            const firstDay = new Date(year, month, 1).getDay();
            const lastDate = new Date(year, month + 1, 0).getDate();
            const prevLastDate = new Date(year, month, 0).getDate();
            for (let i = firstDay; i > 0; i--) {
                calendarGrid.innerHTML += `<div class="day other-month">${prevLastDate - i + 1}</div>`;
            }
            for (let i = 1; i <= lastDate; i++) {
                const dayDate = new Date(year, month, i);
                // Create dayKey in local timezone to avoid UTC conversion issues
                const dayKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                let dayClass = 'day';
                if (events[dayKey] && events[dayKey].length > 0) dayClass += ' event';
                if (dayDate.toDateString() === today.toDateString()) dayClass += ' selected';
                let dayHTML = `<div class="${dayClass}" data-date="${dayKey}">${i}`;
                if (events[dayKey] && events[dayKey].length > 0) {
                    // Show multiple dots for multiple events
                    const eventCount = Math.min(events[dayKey].length, 3); // Max 3 dots
                    for (let j = 0; j < eventCount; j++) {
                        dayHTML += `<span class="event-dot" style="left: ${40 + (j * 10)}%;"></span>`;
                    }
                }
                dayHTML += '</div>';
                calendarGrid.innerHTML += dayHTML;
            }
            // Make ALL days clickable
            document.querySelectorAll('.day').forEach(day => {
                day.addEventListener('click', () => {
                    showEventPopup(day.dataset.date);
                });
            });
        }
    }

    async function loadEventsAndRender() {
        console.log("Loading events and rendering...");
        const result = await getAllEvents();
        if (result.success) {
            events = result.events;
            console.log("Events loaded:", events);
            hideSkeletonLoading();
            renderCalendar();
            renderEventsPage();
        } else {
            console.error("Could not load events:", result.error);
            // Still render calendar even if no events
            hideSkeletonLoading();
            renderCalendar();
        }
    }

    // --- Event Listeners ---

    leftArrow.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    rightArrow.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    closeBtn.addEventListener('click', hideEventPopup);
    window.addEventListener('click', (e) => { if (e.target === popup) hideEventPopup(); });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(link.id.replace('nav-', ''));
        });
    });

    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newEvent = {
            name: document.getElementById('eventName').value,
            date: document.getElementById('eventDate').value,
            time: document.getElementById('eventTime').value || null,
            type: document.getElementById('eventType').value,
            location: document.getElementById('eventLocation').value,
            description: document.getElementById('eventDescription').value
        };

        const result = await saveEvent(newEvent);
        if (result.success) {
            showNotification('Success!', 'Event submitted successfully!', 'success');
            eventForm.reset();
            await loadEventsAndRender();
            showPage('home');
        } else {
            showNotification('Error', 'Error submitting event: ' + result.error, 'error');
        }
    });
    if (calendarDropdownBtn) {
        calendarDropdownBtn.addEventListener('click', () => {
            calendarDropdownContent.classList.toggle('show');
        });
    }

    window.addEventListener('click', (e) => {
        if (!e.target.matches('#calendar-dropdown-btn')) {
            if (calendarDropdownContent.classList.contains('show')) {
                calendarDropdownContent.classList.remove('show');
            }
        }
    });
    function hideEventPopup() {
        popup.classList.add('hidden');
        if (calendarDropdownContent) {
            calendarDropdownContent.classList.remove('show');
        }
        currentEventId = null;
    }
    deleteEventBtn.addEventListener('click', async () => {
        if (currentEventId) {
            showDeleteConfirmModal();
        }
    });

    // Sign-in button event listener
    signInBtn.addEventListener('click', async () => {
        try {
            const result = await signInWithGoogle();
            if (result.success) {
                signInBtn.textContent = 'Signed In';
                signInBtn.style.backgroundColor = '#4CAF50';
                showNotification('Success!', 'Signed in successfully!', 'success');
            } else {
                showNotification('Error', 'Sign-in failed: ' + result.error, 'error');
            }
        } catch (error) {
            console.error("Sign-in error:", error);
            showNotification('Error', 'Sign-in failed. Please try again.', 'error');
        }
    });

    // --- Initial Load ---
    console.log("Starting initial load...");
    showPage('home');
    
    // Show skeleton loading immediately
    showSkeletonLoading();
    
    // Render calendar immediately with skeleton
    renderCalendarSkeleton();
    
    // Then load events in background
    onAuthStateChanged(user => {
        if (user) {
            console.log("User is signed in. Loading events.");
            signInBtn.textContent = 'Signed In';
            signInBtn.style.backgroundColor = '#4CAF50';
            loadEventsAndRender();
        } else {
            console.log("User is not signed in. Loading events for guest.");
            signInBtn.textContent = 'Sign In with Google';
            signInBtn.style.backgroundColor = '';
            loadEventsAndRender();
        }
    });
});

