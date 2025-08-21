class FamilyCalendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.events = [];
        this.editingEventId = null;
        this.db = null;
        this.isOnline = navigator.onLine;
        
        // まずローカルデータを読み込み
        this.events = this.loadEventsFromLocal();
        
        this.initializeFirebase();
        this.initializeElements();
        this.bindEvents();
        this.renderCalendar();
        this.updateCurrentMonthDisplay();
        this.updateConnectionStatus();
        
        // オンライン/オフライン状態の監視
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateConnectionStatus();
            this.syncWithFirebase();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateConnectionStatus();
        });
        
        // ページの再読み込み時にもデータを維持
        window.addEventListener('beforeunload', () => {
            this.saveEventsToLocal();
        });
    }
    
    initializeFirebase() {
        // Firebase機能を無効化（LocalStorageのみで動作）
        console.log('LocalStorageモードで動作します');
        this.db = null;
        this.fallbackToLocalStorage();
        
        // Firebase使用する場合は以下のコメントを解除して実際の設定を記入
        /*
        const firebaseConfig = {
            apiKey: "your-actual-api-key",
            authDomain: "your-project.firebaseapp.com",
            databaseURL: "https://your-project-default-rtdb.firebaseio.com",
            projectId: "your-project-id"
        };
        
        try {
            if (typeof firebase !== 'undefined' && !firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
                this.db = firebase.database();
                this.setupFirebaseListeners();
                console.log('Firebase初期化成功');
            }
        } catch (error) {
            console.warn('Firebase初期化に失敗しました。LocalStorageモードで動作します:', error);
            this.db = null;
            this.fallbackToLocalStorage();
        }
        */
    }
    
    fallbackToLocalStorage() {
        // 初期化時に既にloadEventsFromLocalが呼ばれているので、ここでは監視のみ設定
        
        // LocalStorageの変更を監視
        window.addEventListener('storage', (e) => {
            if (e.key === 'familyCalendarEvents') {
                this.events = this.loadEventsFromLocal();
                this.renderCalendar();
            }
        });
        
        // 定期的にLocalStorageをチェック（同一タブ内の変更検知）
        setInterval(() => {
            const newEvents = this.loadEventsFromLocal();
            if (JSON.stringify(newEvents) !== JSON.stringify(this.events)) {
                this.events = newEvents;
                this.renderCalendar();
            }
        }, 1000);
    }
    
    setupFirebaseListeners() {
        if (!this.db) return;
        
        const eventsRef = this.db.ref('events');
        eventsRef.on('value', (snapshot) => {
            const data = snapshot.val();
            this.events = data ? Object.values(data) : [];
            this.renderCalendar();
        });
        
        eventsRef.on('child_added', () => {
            this.showToast('新しいイベントが追加されました');
        });
        
        eventsRef.on('child_changed', () => {
            this.showToast('イベントが更新されました');
        });
        
        eventsRef.on('child_removed', () => {
            this.showToast('イベントが削除されました');
        });
    }
    
    syncWithFirebase() {
        if (!this.db || !this.isOnline) return;
        
        const localEvents = this.loadEventsFromLocal();
        if (localEvents.length > 0) {
            localEvents.forEach(event => {
                this.db.ref('events/' + event.id).set(event);
            });
            localStorage.removeItem('familyCalendarEvents');
        }
    }
    
    initializeElements() {
        this.calendarGrid = document.getElementById('calendarGrid');
        this.currentMonthElement = document.getElementById('currentMonth');
        this.prevMonthBtn = document.getElementById('prevMonth');
        this.nextMonthBtn = document.getElementById('nextMonth');
        this.eventForm = document.getElementById('eventForm');
        this.overlay = document.getElementById('overlay');
        this.eventFormData = document.getElementById('eventFormData');
        this.formTitle = document.getElementById('formTitle');
        this.eventId = document.getElementById('eventId');
        this.eventTitle = document.getElementById('eventTitle');
        this.eventDate = document.getElementById('eventDate');
        this.eventTime = document.getElementById('eventTime');
        this.eventDescription = document.getElementById('eventDescription');
        this.eventMember = document.getElementById('eventMember');
        this.saveEventBtn = document.getElementById('saveEvent');
        this.deleteEventBtn = document.getElementById('deleteEvent');
        this.addEventFab = document.getElementById('addEventFab');
        this.closeBtn = document.getElementById('closeBtn');
        this.eventDetails = document.getElementById('eventDetails');
        this.detailContent = document.getElementById('detailContent');
        this.editEventBtn = document.getElementById('editEventBtn');
        this.closeDetailBtn = document.getElementById('closeDetailBtn');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
    }
    
    bindEvents() {
        this.prevMonthBtn.addEventListener('click', () => this.previousMonth());
        this.nextMonthBtn.addEventListener('click', () => this.nextMonth());
        this.eventFormData.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.closeBtn.addEventListener('click', () => this.hideEventForm());
        this.deleteEventBtn.addEventListener('click', () => this.deleteEvent());
        this.overlay.addEventListener('click', () => this.hideEventForm());
        this.addEventFab.addEventListener('click', () => this.showEventForm());
        this.editEventBtn.addEventListener('click', () => this.editCurrentEvent());
        this.closeDetailBtn.addEventListener('click', () => this.hideEventDetails());
        
        // タッチイベントの最適化
        this.addTouchSupport();
    }
    
    addTouchSupport() {
        // FABのタッチフィードバック
        this.addEventFab.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.addEventFab.style.transform = 'scale(0.9)';
        });
        
        this.addEventFab.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.addEventFab.style.transform = 'scale(1)';
            this.showEventForm();
        });
        
        // ボタンのタッチフィードバック
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('touchstart', () => {
                btn.style.opacity = '0.7';
            });
            
            btn.addEventListener('touchend', () => {
                btn.style.opacity = '1';
            });
        });
    }
    
    updateConnectionStatus() {
        if (this.isOnline && this.db) {
            this.statusIndicator.className = 'status-indicator connected';
            this.statusText.textContent = '同期中';
        } else if (this.isOnline) {
            this.statusIndicator.className = 'status-indicator connected';
            this.statusText.textContent = 'ローカル保存';
        } else {
            this.statusIndicator.className = 'status-indicator disconnected';
            this.statusText.textContent = 'オフライン';
        }
    }
    
    loadEventsFromLocal() {
        const stored = localStorage.getItem('familyCalendarEvents');
        const events = stored ? JSON.parse(stored) : [];
        console.log('LocalStorageから読み込まれたイベント:', events);
        return events;
    }
    
    saveEventsToLocal() {
        console.log('LocalStorageに保存するイベント:', this.events);
        localStorage.setItem('familyCalendarEvents', JSON.stringify(this.events));
    }
    
    saveEvent(eventData) {
        if (this.db && this.isOnline) {
            this.db.ref('events/' + eventData.id).set(eventData);
        } else {
            // オフライン時はローカルに保存
            if (this.editingEventId) {
                const index = this.events.findIndex(e => e.id === this.editingEventId);
                if (index !== -1) {
                    this.events[index] = eventData;
                }
            } else {
                this.events.push(eventData);
            }
        }
        // 常にローカルにも保存（Firebase使用時も）
        this.saveEventsToLocal();
        this.renderCalendar();
    }
    
    deleteEventById(eventId) {
        if (this.db && this.isOnline) {
            this.db.ref('events/' + eventId).remove();
        }
        // 常にローカルからも削除
        this.events = this.events.filter(e => e.id !== eventId);
        this.saveEventsToLocal();
        this.renderCalendar();
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
        this.updateCurrentMonthDisplay();
        this.addHapticFeedback();
    }
    
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
        this.updateCurrentMonthDisplay();
        this.addHapticFeedback();
    }
    
    addHapticFeedback() {
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
    
    updateCurrentMonthDisplay() {
        const monthNames = [
            '1月', '2月', '3月', '4月', '5月', '6月',
            '7月', '8月', '9月', '10月', '11月', '12月'
        ];
        this.currentMonthElement.textContent = 
            `${this.currentDate.getFullYear()}年 ${monthNames[this.currentDate.getMonth()]}`;
    }
    
    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay();
        
        this.calendarGrid.innerHTML = '';
        
        // 前月の日付
        const prevMonth = new Date(year, month - 1, 0);
        for (let i = startDay - 1; i >= 0; i--) {
            const dayElement = this.createDayElement(
                new Date(year, month - 1, prevMonth.getDate() - i),
                true
            );
            this.calendarGrid.appendChild(dayElement);
        }
        
        // 当月の日付
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayElement = this.createDayElement(new Date(year, month, day), false);
            this.calendarGrid.appendChild(dayElement);
        }
        
        // 次月の日付
        const totalCells = this.calendarGrid.children.length;
        const remainingCells = 42 - totalCells;
        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = this.createDayElement(
                new Date(year, month + 1, day),
                true
            );
            this.calendarGrid.appendChild(dayElement);
        }
    }
    
    createDayElement(date, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }
        
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        dayElement.appendChild(dayNumber);
        
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'events';
        
        const dayEvents = this.getEventsForDate(date);
        dayEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = `event member-${event.member}`;
            eventElement.textContent = event.time ? `${event.time} ${event.title}` : event.title;
            eventElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showEventDetails(event);
            });
            eventsContainer.appendChild(eventElement);
        });
        
        dayElement.appendChild(eventsContainer);
        
        // タッチイベントの追加
        dayElement.addEventListener('click', () => {
            this.selectDate(date);
            this.addHapticFeedback();
        });
        
        return dayElement;
    }
    
    getEventsForDate(date) {
        const dateString = this.formatDate(date);
        return this.events.filter(event => event.date === dateString);
    }
    
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    selectDate(date) {
        document.querySelectorAll('.calendar-day.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        this.selectedDate = date;
        event.currentTarget.classList.add('selected');
        this.showEventForm();
        this.eventDate.value = this.formatDate(date);
    }
    
    showEventForm(event = null) {
        this.editingEventId = event ? event.id : null;
        
        if (event) {
            this.formTitle.textContent = 'イベント編集';
            this.eventId.value = event.id;
            this.eventTitle.value = event.title;
            this.eventDate.value = event.date;
            this.eventTime.value = event.time || '';
            this.eventDescription.value = event.description || '';
            this.eventMember.value = event.member;
            this.deleteEventBtn.style.display = 'inline-block';
        } else {
            this.formTitle.textContent = 'イベント追加';
            this.eventFormData.reset();
            this.eventId.value = '';
            if (this.selectedDate) {
                this.eventDate.value = this.formatDate(this.selectedDate);
            }
            this.deleteEventBtn.style.display = 'none';
        }
        
        this.eventForm.style.display = 'block';
        this.overlay.style.display = 'block';
        setTimeout(() => {
            this.eventTitle.focus();
        }, 100);
    }
    
    hideEventForm() {
        this.eventForm.style.display = 'none';
        this.overlay.style.display = 'none';
        this.editingEventId = null;
        
        document.querySelectorAll('.calendar-day.selected').forEach(el => {
            el.classList.remove('selected');
        });
    }
    
    showEventDetails(event) {
        this.currentEvent = event;
        
        const memberEmojis = {
            'けんじ': '👨',
            'あい': '👩',
            '二人': '💑'
        };
        
        const eventDate = new Date(event.date);
        const dateStr = eventDate.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        
        let detailHTML = `
            <div style="margin-bottom: 15px;">
                <h4 style="font-size: 1.2rem; margin-bottom: 10px; color: #4a5568;">${event.title}</h4>
                <p style="color: #666; margin-bottom: 5px;">📅 ${dateStr}</p>
                ${event.time ? `<p style="color: #666; margin-bottom: 5px;">🕐 ${event.time}</p>` : ''}
                <p style="color: #666; margin-bottom: 10px;">${memberEmojis[event.member]} ${event.member}</p>
                ${event.description ? `<p style="color: #333; line-height: 1.6;">${event.description}</p>` : ''}
            </div>
        `;
        
        this.detailContent.innerHTML = detailHTML;
        this.eventDetails.style.display = 'block';
        this.overlay.style.display = 'block';
    }
    
    hideEventDetails() {
        this.eventDetails.style.display = 'none';
        this.overlay.style.display = 'none';
        this.currentEvent = null;
    }
    
    editCurrentEvent() {
        this.hideEventDetails();
        this.showEventForm(this.currentEvent);
    }
    
    handleFormSubmit(e) {
        e.preventDefault();
        
        const eventData = {
            id: this.editingEventId || this.generateId(),
            title: this.eventTitle.value.trim(),
            date: this.eventDate.value,
            time: this.eventTime.value,
            description: this.eventDescription.value.trim(),
            member: this.eventMember.value,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.saveEvent(eventData);
        this.hideEventForm();
        this.showToast(this.editingEventId ? 'イベントを更新しました' : 'イベントを追加しました');
        this.addHapticFeedback();
    }
    
    deleteEvent() {
        if (this.editingEventId && confirm('このイベントを削除しますか？')) {
            this.deleteEventById(this.editingEventId);
            this.hideEventForm();
            this.showToast('イベントを削除しました');
            this.addHapticFeedback();
        }
    }
    
    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            font-size: 14px;
            z-index: 2000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.style.opacity = '1', 100);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
}

// カレンダーを初期化
document.addEventListener('DOMContentLoaded', () => {
    new FamilyCalendar();
});