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

    googleCalendarLink.addEventListener('click', () => {
        if (currentEvent) generateCalendarLinks(currentEvent);
        hideAddToCalendarModal();
    });

    outlookCalendarLink.addEventListener('click', () => {
        if (currentEvent) generateCalendarLinks(currentEvent);
        hideAddToCalendarModal();
    });

    appleCalendarLink.addEventListener('click', () => {
        if (currentEvent) generateCalendarLinks(currentEvent);
        hideAddToCalendarModal();
    });

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
                submittedBy: auth.currentUser ? auth.currentUser.uid : "Guest"
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
            const querySnapshot = await db.collection("events").get();
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
    const eventListContainer = document.getElementById('event-list-container');
    const eventForm = document.getElementById('event-form');
    const upcomingEventsContainer = document.getElementById('upcoming-events');
    const pastEventsContainer = document.getElementById('past-events');
    const signInBtn = document.querySelector('.sign-in-btn');

    let currentDate = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    function showPage(pageId) {
        calendarView.style.display = 'none';
        submitEventView.style.display = 'none';
        eventsView.style.display = 'none';
        mapView.style.display = 'none';

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

        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.getElementById(`nav-${pageId}`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        if (pageId === 'events') renderEventsPage();
    }

    function renderCalendar() {
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
    leftArrow.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    rightArrow.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

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

    if (navLinks) {
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                showPage(link.id.replace('nav-', ''));
            });
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
                showNotification('Success!', 'Event submitted successfully!', 'success');
                eventForm.reset();
                showPage('home');
                await loadEventsAndRender();
            } else {
                showNotification('Error', 'Failed to submit event: ' + result.error, 'error');
            }
        });
    }

    // Initial render
    showPage('home');
    loadEventsAndRender();
});