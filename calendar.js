/**
 * calendar.js
 * This file contains all logic for the interactive events calendar.
 * It defines a `Calendar` class that encapsulates all functionality for
 * rendering views, handling navigation, and managing event data.
 */

class Calendar {
    /**
     * Initializes the Calendar instance.
     * @param {object} config - Configuration object for the calendar.
     * @param {HTMLElement} config.container - The main container element for the calendar grid.
     * @param {HTMLElement} config.titleElement - The element to display the current month/year/date range.
     * @param {function} config.onEventClick - Callback function to execute when an event is clicked.
     */
    constructor(config) {
        this.container = config.container;
        this.titleElement = config.titleElement;
        this.onEventClick = config.onEventClick;

        this.currentDate = new Date('2025-08-02T02:37:00');
        this.currentView = 'month'; // Default view

        // This is mock data. In a real application, this would be fetched from a database like Firestore.
        // A unique ID is assigned to each event to make editing and deleting possible.
        this.events = [
            { id: Date.now() + 1, title: 'NASTP Guest Speaker Session', date: '2025-08-15T14:00:00', description: 'A talk on the future of aerospace technology.' },
            { id: Date.now() + 2, title: 'All-Pakistan Programming Contest', date: '2025-09-05T09:00:00', description: 'The annual flagship programming competition.' },
            { id: Date.now() + 3, title: 'GIKI Convocation 2025', date: '2025-10-20T11:00:00', description: 'The formal ceremony to confer degrees.' },
            { id: Date.now() + 4, title: 'International Culture Night', date: '2025-11-12T18:00:00', description: 'A celebration of diversity at GIKI.' },
            { id: Date.now() + 5, title: 'Mid-term Exams Begin', date: '2025-10-13T09:00:00', description: 'The start of mid-term examinations for the fall semester.' },
            { id: Date.now() + 6, title: 'Same Day Event', date: '2025-08-15T18:00:00', description: 'Another event on the same day.' }
        ];
    }

    /**
     * The main render function. It acts as a router, calling the appropriate
     * rendering method based on the `currentView` state.
     */
    render() {
        switch (this.currentView) {
            case 'year': this.renderYearView(this.currentDate.getFullYear()); break;
            case 'month': this.renderMonthView(this.currentDate); break;
            case 'week': this.renderWeekView(this.currentDate); break;
            case 'day': this.renderDayView(this.currentDate); break;
        }
    }

    // --- View Renderers ---

    /**
     * Renders the high-level Year view, showing a grid of 12 mini-months.
     * @param {number} year - The full year to display.
     */
    renderYearView(year) {
        this.titleElement.textContent = year;
        this.container.innerHTML = '';
        const yearGrid = document.createElement('div');
        yearGrid.className = 'year-view-grid';
        for (let i = 0; i < 12; i++) {
            yearGrid.appendChild(this._createMiniMonthGrid(new Date(year, i, 1)));
        }
        this.container.appendChild(yearGrid);
    }

    /**
     * Renders the detailed Month view grid, showing all days in a month.
     * @param {Date} date - A date within the month to be rendered.
     */
    renderMonthView(date) {
        const year = date.getFullYear(), month = date.getMonth();
        this.titleElement.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;
        this.container.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-7';

        // Use abbreviated day names for better mobile responsiveness
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        weekdays.forEach(day => grid.appendChild(this._createHeaderCell(day)));

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();

        // Add days from the previous month to fill the grid
        for (let i = firstDay; i > 0; i--) grid.appendChild(this._createDayCell(prevMonthDays - i + 1, new Date(year, month - 1, prevMonthDays - i + 1), true));
        // Add days for the current month
        for (let i = 1; i <= daysInMonth; i++) grid.appendChild(this._createDayCell(i, new Date(year, month, i), false));
        // Add days from the next month to fill the grid
        const lastDayIndex = new Date(year, month, daysInMonth).getDay();
        for (let i = 1; i < 7 - lastDayIndex; i++) grid.appendChild(this._createDayCell(i, new Date(year, month + 1, i), true));

        this.container.appendChild(grid);
    }

    /**
     * Renders the Week view, showing a 7-day layout.
     * @param {Date} date - A date within the week to be displayed.
     */
    renderWeekView(date) {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        this.titleElement.textContent = `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
        this.container.innerHTML = '';
        const weekGrid = document.createElement('div');
        weekGrid.className = 'grid grid-cols-1 md:grid-cols-7';

        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(startOfWeek);
            currentDay.setDate(startOfWeek.getDate() + i);
            const dayContainer = document.createElement('div');
            dayContainer.className = 'border p-2 min-h-[200px]';
            const header = document.createElement('div');
            header.className = 'font-bold text-center mb-2';
            header.textContent = `${currentDay.toLocaleString('default', { weekday: 'short' })} ${currentDay.getDate()}`;
            dayContainer.appendChild(header);

            const eventsOnDay = this._getEventsForDay(currentDay);
            if (eventsOnDay.length > 0) {
                eventsOnDay.forEach(event => dayContainer.appendChild(this._createEventElement(event)));
            } else {
                dayContainer.innerHTML += '<p class="text-xs text-gray-400 text-center mt-4">No events</p>';
            }
            weekGrid.appendChild(dayContainer);
        }
        this.container.appendChild(weekGrid);
    }

    /**
     * Renders the Day view, showing a list of events for a single day.
     * @param {Date} date - The specific date to display.
     */
    renderDayView(date) {
        this.titleElement.textContent = date.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        this.container.innerHTML = '';
        const eventsOnDay = this._getEventsForDay(date);

        if (eventsOnDay.length > 0) {
            const eventList = document.createElement('div');
            eventList.className = 'space-y-4';
            eventsOnDay.forEach(event => eventList.appendChild(this._createEventElement(event)));
            this.container.appendChild(eventList);
        } else {
            this.container.innerHTML = '<p class="text-center text-gray-500 py-8">No events scheduled for this day.</p>';
        }
    }

    // --- Element Creators (Private Helper Methods) ---

    _createHeaderCell(text) { const el = document.createElement('div'); el.className = 'font-bold text-center text-gray-600 py-2 text-sm'; el.textContent = text; return el; }

    _createMiniMonthGrid(date) {
        const year = date.getFullYear(), month = date.getMonth();
        const monthContainer = document.createElement('div');
        monthContainer.className = 'month-grid-year-view';
        monthContainer.innerHTML = `<h4 class="font-semibold text-center text-sm mb-2 cursor-pointer hover:text-blue-600">${date.toLocaleString('default', { month: 'long' })}</h4>`;
        monthContainer.querySelector('h4').addEventListener('click', () => { this.currentDate = new Date(year, month, 1); this.setView('month'); });

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-7 gap-1';
        ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(day => { const el = document.createElement('div'); el.className = 'text-center font-bold text-xs text-gray-500'; el.textContent = day; grid.appendChild(el); });

        const firstDay = new Date(year, month, 1).getDay();
        for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement('div'));

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell relative';
            dayCell.textContent = i;
            if (this._hasEventOnDay(new Date(year, month, i))) {
                const dot = document.createElement('div');
                dot.className = 'event-dot-year';
                dayCell.appendChild(dot);
            }
            grid.appendChild(dayCell);
        }
        monthContainer.appendChild(grid);
        return monthContainer;
    }

    _createDayCell(day, date, isOtherMonth) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day border p-2 flex flex-col';
        if (isOtherMonth) dayCell.classList.add('other-month');
        if (this._isSameDay(date, new Date())) dayCell.classList.add('today');

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number font-semibold text-sm mb-1';
        dayNumber.textContent = day;
        dayCell.appendChild(dayNumber);

        // **FIX:** Create a wrapper for events to prevent overflow.
        // This container will grow to fill available space but hide any content that doesn't fit.
        const eventsWrapper = document.createElement('div');
        eventsWrapper.className = 'flex-grow overflow-hidden';

        this._getEventsForDay(date).forEach(event => {
            const eventEl = document.createElement('div');
            eventEl.className = 'event-in-cell';
            eventEl.textContent = event.title;
            eventEl.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent the day cell's click event from firing
                this.onEventClick(event);
            });
            eventsWrapper.appendChild(eventEl);
        });

        dayCell.appendChild(eventsWrapper);

        dayCell.addEventListener('click', () => {
            this.currentDate = date;
            this.setView('day');
        });
        return dayCell;
    }

    _createEventElement(event) {
        const eventEl = document.createElement('div');
        eventEl.className = 'event-item p-3 border rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100';
        const eventDate = new Date(event.date);
        const timeOptions = { hour: '2-digit', minute: '2-digit' };
        eventEl.innerHTML = `
            <h3 class="font-bold text-md text-gray-800">${event.title}</h3>
            <p class="text-sm text-gray-600">${eventDate.toLocaleTimeString([], timeOptions)}</p>
        `;
        eventEl.addEventListener('click', () => this.onEventClick(event));
        return eventEl;
    }

    // --- Public Methods (API for interacting with the calendar) ---

    addEvent(event) {
        const newEventWithId = { ...event, id: Date.now() };
        this.events.push(newEventWithId);
        this.render();
    }

    editEvent(updatedEvent) {
        const eventIndex = this.events.findIndex(e => e.id === updatedEvent.id);
        if (eventIndex > -1) {
            this.events[eventIndex] = updatedEvent;
            this.render();
        }
    }

    deleteEvent(eventId) {
        this.events = this.events.filter(e => e.id !== eventId);
        this.render();
    }

    next() {
        if (this.currentView === 'year') this.currentDate.setFullYear(this.currentDate.getFullYear() + 1);
        else if (this.currentView === 'month') this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        else if (this.currentView === 'week') this.currentDate.setDate(this.currentDate.getDate() + 7);
        else if (this.currentView === 'day') this.currentDate.setDate(this.currentDate.getDate() + 1);
        this.render();
    }
    previous() {
        if (this.currentView === 'year') this.currentDate.setFullYear(this.currentDate.getFullYear() - 1);
        else if (this.currentView === 'month') this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        else if (this.currentView === 'week') this.currentDate.setDate(this.currentDate.getDate() - 7);
        else if (this.currentView === 'day') this.currentDate.setDate(this.currentDate.getDate() - 1);
        this.render();
    }
    setView(view) {
        this.currentView = view;
        this.render();
    }

    // --- Utility Functions ---
    _getEventsForDay = (date) => this.events.filter(event => this._isSameDay(new Date(event.date), date)).sort((a, b) => new Date(a.date) - new Date(b.date));
    _hasEventOnDay = (date) => this.events.some(event => this._isSameDay(new Date(event.date), date));
    _isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}
