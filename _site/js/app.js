class PayTimer {
    constructor() {
        try {
            console.log('PayTimer constructor started');
            
            // DOM Elements
            const elements = {
                wageInput: document.getElementById('wage'),
                shiftStartInput: document.getElementById('shift-start'),
                shiftHoursInput: document.getElementById('shift-hours'),
                shiftMinutesInput: document.getElementById('shift-minutes'),
                breakStartInput: document.getElementById('break-start'),
                breakHoursInput: document.getElementById('break-hours'),
                breakMinutesInput: document.getElementById('break-minutes'),
                startBtn: document.getElementById('start-btn'),
                endBtn: document.getElementById('end-btn'),
                countdownEl: document.getElementById('countdown'),
                shiftTimerEl: document.getElementById('shift-timer'),
                breakStatusEl: document.getElementById('break-status'),
                currentEarningsEl: document.getElementById('current-earnings'),
                weeklyEarningsEl: document.getElementById('weekly-earnings'),
                shiftHistoryEl: document.getElementById('shift-history')
            };

            // Check if all elements were found
            const missingElements = Object.entries(elements)
                .filter(([key, element]) => !element)
                .map(([key]) => key);

            if (missingElements.length > 0) {
                throw new Error(`Missing DOM elements: ${missingElements.join(', ')}`);
            }

            // Assign elements to class properties
            Object.assign(this, elements);

            console.log('All DOM elements found successfully');

            // State
            try {
                console.log('Loading weekly earnings from localStorage');
                this.weeklyEarnings = this.loadWeeklyEarnings();
                console.log('Weekly earnings loaded:', this.weeklyEarnings);
            } catch (e) {
                console.error('Error loading weekly earnings:', e);
                this.weeklyEarnings = 0;
            }
            try {
                console.log('Loading shift history from localStorage');
                this.shiftHistory = this.loadShiftHistory();
                console.log('Shift history loaded:', this.shiftHistory);
            } catch (e) {
                console.error('Error loading shift history:', e);
                this.shiftHistory = [];
            }
            this.isRunning = false;
            this.isBreak = false;
            this.currentEarnings = 0;
            this.timerInterval = null;
            this.countdownInterval = null;
            this.earningsInterval = null;
            this.shiftStartTime = null;
            this.shiftActualStartTime = null;

            // Bind methods
            this.startShift = this.startShift.bind(this);
            this.endShift = this.endShift.bind(this);
            this.updateEarnings = this.updateEarnings.bind(this);
            this.checkBreak = this.checkBreak.bind(this);

            // Event listeners
            console.log('Adding event listeners');
            this.startBtn.addEventListener('click', (e) => {
                console.log('Start button clicked');
                e.preventDefault();
                e.stopPropagation();
                try {
                    this.startShift();
                } catch (error) {
                    console.error('Error in start button click handler:', error);
                    alert('An error occurred while starting the shift. Please check the console for details.');
                }
            });

            this.endBtn.addEventListener('click', (e) => {
                console.log('End button clicked');
                e.preventDefault();
                e.stopPropagation();
                try {
                    this.endShift();
                } catch (error) {
                    console.error('Error in end button click handler:', error);
                    alert('An error occurred while ending the shift. Please check the console for details.');
                }
            });

            // Initialize display
            try {
                console.log('Updating weekly earnings display');
                this.updateWeeklyEarningsDisplay();
                console.log('Rendering shift history');
                this.renderShiftHistory();
            } catch (e) {
                console.error('Error updating display:', e);
            }
            
            console.log('PayTimer initialized successfully');

            // Restore active shift if present
            const activeShift = localStorage.getItem('activeShift');
            if (activeShift) {
                this.shiftData = JSON.parse(activeShift);
                this.isRunning = true;
                this.startBtn.disabled = true;
                this.endBtn.disabled = false;
            }

            // Start interval to check shift state every second
            this.timerInterval = setInterval(() => {
                if (this.isRunning && this.shiftData) {
                    this.handleShiftState();
                }
            }, 1000);

            // Listen for page visibility change
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible' && this.isRunning && this.shiftData) {
                    this.handleShiftState();
                }
            });
        } catch (error) {
            console.error('Error initializing PayTimer:', error);
            alert('Failed to initialize the timer. Please check the console for details.');
        }
    }

    loadWeeklyEarnings() {
        try {
            const saved = localStorage.getItem('weeklyEarnings');
            console.log('loadWeeklyEarnings raw:', saved);
            if (!saved || isNaN(Number(saved))) return 0;
            return parseFloat(saved);
        } catch (e) {
            console.error('Error in loadWeeklyEarnings:', e);
            return 0;
        }
    }

    loadShiftHistory() {
        try {
            const saved = localStorage.getItem('shiftHistory');
            console.log('loadShiftHistory raw:', saved);
            if (!saved) return [];
            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) return [];
            return parsed;
        } catch (e) {
            console.error('Error in loadShiftHistory:', e);
            return [];
        }
    }

    saveWeeklyEarnings() {
        localStorage.setItem('weeklyEarnings', this.weeklyEarnings.toString());
    }

    saveShiftHistory() {
        localStorage.setItem('shiftHistory', JSON.stringify(this.shiftHistory));
    }

    updateWeeklyEarningsDisplay() {
        try {
            console.log('In updateWeeklyEarningsDisplay, weeklyEarnings:', this.weeklyEarnings);
            if (!this.weeklyEarningsEl) {
                console.error('weeklyEarningsEl is missing!');
                return;
            }
            this.weeklyEarningsEl.textContent = `£${this.weeklyEarnings.toFixed(2)}`;
            console.log('Weekly earnings display updated');
        } catch (e) {
            console.error('Error in updateWeeklyEarningsDisplay:', e);
            throw e;
        }
    }

    formatTime(ms) {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    calculateTimeUntil(targetTime) {
        const now = new Date();
        const [hours, minutes] = targetTime.split(':').map(Number);
        const target = new Date(now);
        target.setHours(hours, minutes, 0, 0);
        
        if (target < now) {
            target.setDate(target.getDate() + 1);
        }
        
        return target - now;
    }

    validateInputs() {
        try {
            console.log('Validating inputs');
            const inputs = [
                { name: 'wage', value: this.wageInput.value, type: 'number' },
                { name: 'shift start', value: this.shiftStartInput.value, type: 'string' },
                { name: 'shift hours', value: this.shiftHoursInput.value, type: 'number' },
                { name: 'shift minutes', value: this.shiftMinutesInput.value, type: 'number' },
                { name: 'break start', value: this.breakStartInput.value, type: 'string' },
                { name: 'break hours', value: this.breakHoursInput.value, type: 'number' },
                { name: 'break minutes', value: this.breakMinutesInput.value, type: 'number' }
            ];

            const invalidInputs = inputs.filter(input => {
                if (input.type === 'number') {
                    // Allow 0 as valid, but not empty string or non-numeric
                    return input.value === '' || isNaN(Number(input.value));
                } else {
                    // For string fields, just check for empty string
                    return input.value === '';
                }
            });

            if (invalidInputs.length > 0) {
                console.log('Invalid inputs:', invalidInputs);
                return false;
            }

            console.log('All inputs are valid');
            return true;
        } catch (error) {
            console.error('Error validating inputs:', error);
            return false;
        }
    }

    startShift() {
        try {
            console.log('startShift called');
            
            if (!this.validateInputs()) {
                console.log('Input validation failed');
                alert('Please fill in all fields with valid values');
                return;
            }

            console.log('Input validation passed');

            const wage = parseFloat(this.wageInput.value);
            const shiftStart = this.shiftStartInput.value;
            const shiftDuration = (parseInt(this.shiftHoursInput.value) * 60 + parseInt(this.shiftMinutesInput.value)) * 60 * 1000;
            const breakStart = this.breakStartInput.value;
            const breakDuration = (parseInt(this.breakHoursInput.value) * 60 + parseInt(this.breakMinutesInput.value)) * 60 * 1000;

            // Calculate the scheduled shift start Date object
            const [startHours, startMinutes] = shiftStart.split(':').map(Number);
            const now = new Date();
            let scheduledStart = new Date(now);
            scheduledStart.setHours(startHours, startMinutes, 0, 0);
            if (scheduledStart < now) {
                scheduledStart.setDate(scheduledStart.getDate() + 1);
            }

            this.shiftData = {
                wage,
                shiftStart,
                shiftDuration,
                breakStart,
                breakDuration,
                scheduledStart: scheduledStart.toISOString(),
                started: false
            };

            // Persist shiftData in localStorage
            localStorage.setItem('activeShift', JSON.stringify(this.shiftData));

            this.isRunning = true;
            this.startBtn.disabled = true;
            this.endBtn.disabled = false;

            this.handleShiftState();
        } catch (error) {
            console.error('Error in startShift:', error);
            alert('An error occurred while starting the shift. Please check the console for details.');
            this.isRunning = false;
            this.startBtn.disabled = false;
            this.endBtn.disabled = true;
        }
    }

    handleShiftState() {
        // Called on interval and on visibilitychange
        const now = new Date();
        if (!this.shiftData) return;
        const scheduledStart = new Date(this.shiftData.scheduledStart);
        const shiftEnd = new Date(scheduledStart.getTime() + this.shiftData.shiftDuration);

        if (now < scheduledStart) {
            // Still waiting for shift to start
            this.countdownEl.textContent = `Starting in: ${this.formatTime(scheduledStart - now)}`;
            this.shiftTimerEl.textContent = '--:--:--';
            this.breakStatusEl.textContent = '';
            this.updateEarnings();
        } else if (now >= scheduledStart && now < shiftEnd) {
            // Shift is running
            this.countdownEl.textContent = '';
            this.shiftStartTime = scheduledStart;
            this.shiftTimerEl.textContent = this.formatTime(shiftEnd - now);
            this.updateEarnings();
            this.checkBreak();
        } else if (now >= shiftEnd) {
            // Shift is over
            this.endShift();
        }
    }

    startShiftTimer() {
        // Not used anymore, replaced by handleShiftState
    }

    checkBreak() {
        const now = new Date();
        const [breakHours, breakMinutes] = this.shiftData.breakStart.split(':').map(Number);
        const breakTime = new Date(now);
        breakTime.setHours(breakHours, breakMinutes, 0, 0);
        
        const breakEnd = new Date(breakTime.getTime() + this.shiftData.breakDuration);
        
        if (now >= breakTime && now < breakEnd && !this.isBreak) {
            this.isBreak = true;
            this.breakStatusEl.textContent = 'Break Time';
            this.breakStatusEl.style.color = 'var(--break-color)';
        } else if (now >= breakEnd && this.isBreak) {
            this.isBreak = false;
            this.breakStatusEl.textContent = '';
        }
    }

    updateEarnings() {
        if (!this.shiftData || !this.shiftData.scheduledStart) return;
        const now = new Date();
        const scheduledStart = new Date(this.shiftData.scheduledStart);
        let elapsedMs = 0;
        if (now > scheduledStart) {
            elapsedMs = Math.min(now - scheduledStart, this.shiftData.shiftDuration);
        }
        // Calculate break time elapsed so far
        let breakElapsedMs = 0;
        if (this.shiftData.breakStart && this.shiftData.breakDuration) {
            const [breakHours, breakMinutes] = this.shiftData.breakStart.split(':').map(Number);
            const breakStart = new Date(scheduledStart);
            breakStart.setHours(breakHours, breakMinutes, 0, 0);
            const breakEnd = new Date(breakStart.getTime() + this.shiftData.breakDuration);
            if (now > breakStart) {
                if (now < breakEnd) {
                    breakElapsedMs = now - breakStart;
                } else {
                    breakElapsedMs = this.shiftData.breakDuration;
                }
            }
        }
        let effectiveElapsedMs = elapsedMs - breakElapsedMs;
        if (effectiveElapsedMs < 0) effectiveElapsedMs = 0;
        const wagePerMs = this.shiftData.wage / 3600 / 1000;
        this.currentEarnings = effectiveElapsedMs * wagePerMs;
        this.currentEarningsEl.textContent = `£${this.currentEarnings.toFixed(2)}`;
        console.log('Earnings updated:', this.currentEarnings);
    }

    endShift() {
        console.log('Ending shift');
        // Remove active shift from localStorage
        localStorage.removeItem('activeShift');
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        if (this.earningsInterval) {
            clearInterval(this.earningsInterval);
            this.earningsInterval = null;
        }

        // Add to weekly earnings and history
        this.weeklyEarnings += this.currentEarnings;
        // Calculate shift start and end time strings
        const shiftStartDate = this.shiftStartTime ? new Date(this.shiftStartTime) : new Date();
        const shiftEndDate = new Date(shiftStartDate.getTime() + this.shiftData.shiftDuration);
        const formatTime = d => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.shiftHistory.unshift({
            date: new Date().toLocaleDateString(),
            shiftStart: formatTime(shiftStartDate),
            shiftEnd: formatTime(shiftEndDate),
            earnings: this.currentEarnings,
            duration: this.formatTime(this.shiftData.shiftDuration),
            wage: this.shiftData.wage
        });

        // Save and update display
        this.saveWeeklyEarnings();
        this.saveShiftHistory();
        this.updateWeeklyEarningsDisplay();
        this.renderShiftHistory();

        // Reset state
        this.isRunning = false;
        this.isBreak = false;
        this.currentEarnings = 0;
        this.currentEarningsEl.textContent = '£0.00';
        this.shiftTimerEl.textContent = '--:--:--';
        this.breakStatusEl.textContent = '';
        this.countdownEl.textContent = 'Waiting to start...';
        this.startBtn.disabled = false;
        this.endBtn.disabled = true;
        this.shiftStartTime = null;

        console.log('Shift ended successfully');
    }

    renderShiftHistory() {
        try {
            console.log('In renderShiftHistory, shiftHistory:', this.shiftHistory);
            if (!this.shiftHistoryEl) {
                console.error('shiftHistoryEl is missing!');
                return;
            }
            this.shiftHistoryEl.innerHTML = this.shiftHistory
                .map((shift, idx) => {
                    try {
                        return `<div class="shift-history-item">
                            <button class="delete-shift-btn" data-idx="${idx}" title="Delete shift">✕</button>
                            <div class="shift-info">
                                <div>Date: ${shift.date}</div>
                                <div>Start: ${shift.shiftStart || '--:--'}</div>
                                <div>End: ${shift.shiftEnd || '--:--'}</div>
                                <div>Earnings: £${Number(shift.earnings).toFixed(2)}</div>
                                <div>Duration: ${shift.duration}</div>
                                <div>Wage: £${shift.wage}/hr</div>
                            </div>
                        </div>`;
                    } catch (itemErr) {
                        console.error('Error rendering shift at index', idx, shift, itemErr);
                        return `<div class="shift-history-item error">Error rendering shift</div>`;
                    }
                })
                .join('');
            console.log('Shift history rendered');

            // Add event listeners for delete buttons
            const deleteBtns = this.shiftHistoryEl.querySelectorAll('.delete-shift-btn');
            deleteBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(btn.getAttribute('data-idx'));
                    this.deleteShift(idx);
                });
            });
        } catch (e) {
            console.error('Error in renderShiftHistory:', e);
            throw e;
        }
    }

    deleteShift(idx) {
        if (typeof idx !== 'number' || idx < 0 || idx >= this.shiftHistory.length) return;
        this.shiftHistory.splice(idx, 1);
        this.saveShiftHistory();
        this.renderShiftHistory();
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('DOM Content Loaded - Initializing PayTimer');
        // Small delay to ensure all DOM elements are fully rendered
        setTimeout(() => {
            try {
                window.payTimer = new PayTimer();
                console.log('PayTimer instance created and assigned to window.payTimer');
            } catch (error) {
                console.error('Error creating PayTimer instance:', error);
                alert('Failed to initialize the timer. Please check the console for details.');
            }
        }, 100);
    } catch (error) {
        console.error('Error in DOMContentLoaded handler:', error);
        alert('Failed to initialize the timer. Please check the console for details.');
    }
}); 