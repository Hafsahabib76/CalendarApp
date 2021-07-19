"use-strict";

//variable declaration
const menu = document.querySelector('#menu-navi');
const currentMonthYear = document.querySelector('#date');
const calendarSelection = document.querySelector('#calendarType');

let CalendarList = [];
var type = 'month';

//Constructor to display different types of calendars
function CalendarInfo() {
    this.id = null;
    this.name = null;
    this.checked = true;
    this.color = null;
    this.bgColor = null;
    this.borderColor = null;
    this.dragBgColor = null;
}

//Fucntion to Add Calendar in CalendarList
const addCalendar = function(calendar) {
    CalendarList.push(calendar);
}

//Function to Find Calendar in CalendarList
const findCalendar = function(id) {
    let found;

    CalendarList.forEach(function(calendar) {
        if (calendar.id === id) {
            found = calendar;
        }
    });

    return found || CalendarList[0];
}

function hexToRGBA(hex) {
    var radix = 16;
    var r = parseInt(hex.slice(1, 3), radix),
        g = parseInt(hex.slice(3, 5), radix),
        b = parseInt(hex.slice(5, 7), radix),
        a = parseInt(hex.slice(7, 9), radix) / 255 || 1;
    var rgba = 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';

    return rgba;
}


//Imediately Invoked Function Expression (IIFE)
(function() {
    let calendar;
    let id = 0;

    //Calendar 1 -> My Calendar (color Purple)
    calendar = new CalendarInfo();
    id += 1;
    calendar.id = String(id);
    calendar.name = 'My Calendar';
    calendar.color = '#ffffff';
    calendar.bgColor = '#9e5fff';
    calendar.dragBgColor = '#9e5fff';
    calendar.borderColor = '#9e5fff';
    addCalendar(calendar);

    //Calendar 2 -> Company (color Blue)
    calendar = new CalendarInfo();
    id += 1;
    calendar.id = String(id);
    calendar.name = 'Company';
    calendar.color = '#ffffff';
    calendar.bgColor = '#00a9ff';
    calendar.dragBgColor = '#00a9ff';
    calendar.borderColor = '#00a9ff';
    addCalendar(calendar);

    //Calendar 3 -> Events (color Orange)
    calendar = new CalendarInfo();
    id += 1;
    calendar.id = String(id);
    calendar.name = 'Events';
    calendar.color = '#ffffff';
    calendar.bgColor = '#FF6618';
    calendar.dragBgColor = '#FF6618';
    calendar.borderColor = '#FF6618';
    addCalendar(calendar);

})();



(function(window, Calendar) {

    //variable initialization and declaration
    let calendarTUI, resizeThrottled;
    let useCreationPopup = true;
    let useDetailPopup = true;
    let datePicker, selectedCalendar;
    //Display TUI calendar

    calendarTUI = new Calendar('#calendar', {

        defaultView: 'month',
        useCreationPopup: useCreationPopup,
        useDetailPopup: useDetailPopup,
        calendars: CalendarList,
        template: {
            milestone: function(model) {
                return '<span class="calendar-font-icon ic-milestone-b"></span> <span style="background-color: ' + model.color + '">' + model.title + '</span>';
            },
            allday: function(schedule) {
                return getTimeTemplate(schedule, true);
            },
            time: function(schedule) {
                return getTimeTemplate(schedule, false);
            }


        }
    });


    // event handlers
    calendarTUI.on({
        'clickMore': function(e) {
            console.log('clickMore', e);
        },
        'clickSchedule': function(e) {},
        'clickDayname': function(date) {
            console.log('clickDayname', date);
        },
        'beforeCreateSchedule': function(e) {
            saveNewSchedule(e);
        },
        'beforeUpdateSchedule': function(e) {
            const schedule = e.schedule;
            const changes = e.changes;

            console.log('beforeUpdateSchedule', e);

            calendarTUI.updateSchedule(schedule.id, schedule.calendarId, changes);
            refreshScheduleVisibility();
        },
        'beforeDeleteSchedule': function(e) {
            console.log('beforeDeleteSchedule', e);
            calendarTUI.deleteSchedule(e.schedule.id, e.schedule.calendarId);
        },
        'afterRenderSchedule': function(e) {
            var schedule = e.schedule;
            // var element = cal.getElement(schedule.id, schedule.calendarId);
            // console.log('afterRenderSchedule', element);
        },
        'clickTimezonesCollapseBtn': function(timezonesCollapsed) {
            console.log('timezonesCollapsed', timezonesCollapsed);

            if (timezonesCollapsed) {
                calendarTUI.setTheme({
                    'week.daygridLeft.width': '77px',
                    'week.timegridLeft.width': '77px'
                });
            } else {
                calendarTUI.setTheme({
                    'week.daygridLeft.width': '60px',
                    'week.timegridLeft.width': '60px'
                });
            }

            return true;
        }
    });

    function getTimeTemplate(schedule, isAllDay) {
        let html = [];
        let start = moment(schedule.start.toUTCString());
        if (!isAllDay) {
            html.push('<strong>' + start.format('HH:mm') + '</strong> ');
        }
        if (schedule.isPrivate) {
            html.push('<span class="calendar-font-icon ic-lock-b"></span>');
            html.push(' Private');
        } else {
            if (schedule.isReadOnly) {
                html.push('<span class="calendar-font-icon ic-readonly-b"></span>');
            } else if (schedule.recurrenceRule) {
                html.push('<span class="calendar-font-icon ic-repeat-b"></span>');
            } else if (schedule.attendees.length) {
                html.push('<span class="calendar-font-icon ic-user-b"></span>');
            } else if (schedule.location) {
                html.push('<span class="calendar-font-icon ic-location-b"></span>');
            } else { html.push(' ' + schedule.title); }
        }

        return html.join('');
    }

    // for events to view months - today, previous month, next month
    const onClickNavigation = function(e) {
        const action = getDataAction(e.target);

        switch (action) {
            case 'move-prev':
                calendarTUI.prev();
                break;
            case 'move-next':
                calendarTUI.next();
                break;
            case 'move-today':
                calendarTUI.today();
                break;
            case 'month':
                defaultView = type;
                break;
            case 'week':
                defaultView = type;
                break;
            default:
                return;
        }

        //call function to display month and year.
        MonthYearDisplay(type);

        //call function to set Schedules
        setSchedules();
    }


    //Function to create new Schedule
    const onNewSchedule = function() {
        const title = document.querySelector('#new-schedule-title').value;
        const location = document.querySelector('#new-schedule-location').value;
        const isAllDay = document.querySelector('#new-schedule-allday').checked;
        const start = datePicker.getStartDate();
        const end = datePicker.getEndDate();
        const calendar = selectedCalendar ? selectedCalendar : CalendarList[0];

        if (!title) {
            return;
        }

        console.log('calendar.id ', calendar.id);

        calendarTUI.createSchedules([{
            id: '1',
            calendarId: calendar.id,
            title: title,
            isAllDay: isAllDay,
            start: start,
            end: end,
            category: isAllDay ? 'allday' : 'time',
            dueDateClass: '',
            color: calendar.color,
            bgColor: calendar.bgColor,
            dragBgColor: calendar.bgColor,
            borderColor: calendar.borderColor,
            raw: {
                location: location
            },
            state: 'Busy'
        }]);

        $('#modal-new-schedule').modal('hide');
    }

    const onChangeNewScheduleCalendar = function(e) {
        const target = document.querySelector(e.target).closest('a[role="menuitem"]')[0];
        const calendarId = getDataAction(target);
        changeNewScheduleCalendar(calendarId);
    }

    const changeNewScheduleCalendar = function(calendarId) {
        const calendarNameElement = document.querySelector('#calendarName');
        const calendar = findCalendar(calendarId);
        let html = [];

        html.push('<span class="calendar-bar" style="background-color: ' + calendar.bgColor + '; border-color:' + calendar.borderColor + ';"></span>');
        html.push('<span class="calendar-name">' + calendar.name + '</span>');

        calendarNameElement.innerHTML = html.join('');

        selectedCalendar = calendar;
    }

    const createNewSchedule = function(e) {
        const start = e.start ? new Date(e.start.getTime()) : new Date();
        const end = e.end ? new Date(e.end.getTime()) : moment().add(1, 'hours').toDate();

        if (useCreationPopup) {
            cal.openCreationPopup({
                start: start,
                end: end
            });
        }
    }

    const saveNewSchedule = function(scheduleData) {
        console.log('scheduleData ', scheduleData)
        const calendar = scheduleData.calendar || findCalendar(scheduleData.calendarId);
        const schedule = {
            id: '1',
            title: scheduleData.title,
            start: scheduleData.start,
            end: scheduleData.end,
            category: 'allday',
            color: calendar.color,
            bgColor: calendar.bgColor,
            dragBgColor: calendar.bgColor,
            borderColor: calendar.borderColor,
            location: scheduleData.location
        };
        if (calendar) {
            schedule.calendarId = calendar.id;
            schedule.color = calendar.color;
            schedule.bgColor = calendar.bgColor;
            schedule.borderColor = calendar.borderColor;
        }

        calendarTUI.createSchedules([schedule]);

        refreshScheduleVisibility();
    }

    //To display current month and year in header
    const MonthYearDisplay = function(type) {

        let date;
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        //if type == day calendar then display the current day, month and year. i.e. 7 July, 2021
        if (type === 'day') {
            date = new Date(calendarTUI.getDate().getTime());
            currentMonthYear.textContent = date.getDate() + ' ' + monthNames[date.getMonth()] + ', ' + date.getFullYear();
        }
        //if type == month then display month and year i.e. July, 2021
        else if (type === 'month') {
            date = new Date(calendarTUI.getDate().getTime());
            currentMonthYear.textContent = monthNames[date.getMonth()] + ' ' + date.getFullYear();
        }

        //else type == week then display week date range i.e. 18 _ 24 July 2021
        else {
            dateRangeStart = calendarTUI.getDateRangeStart()._date;
            dateRangeEnd = calendarTUI.getDateRangeEnd()._date;
            currentMonthYear.textContent = dateRangeStart.getDate() + ' ~ ' + dateRangeEnd.getDate() + ' ' + monthNames[dateRangeEnd.getMonth()] + ' ' + dateRangeStart.getFullYear();
        }


    }

    const refreshScheduleVisibility = function() {
        const calendarElements = Array.prototype.slice.call(document.querySelectorAll('#calendarList input'));

        CalendarList.forEach(function(calendar) {
            calendarTUI.toggleSchedules(calendar.id, !calendar.checked, false);
        });

        calendarTUI.render(true);

        calendarElements.forEach(function(input) {
            const span = input.nextElementSibling;
            span.style.backgroundColor = input.checked ? span.style.borderColor : 'transparent';
        });
    }

    const setSchedules = function() {
        calendarTUI.clear();
        let schedules = [{
                id: 489273,
                title: 'Eid al Adha Holiday',
                isAllDay: false,
                start: '2021-07-21T11:30:00+09:00',
                end: '2021-07-21T12:00:00+09:00',
                color: '#ffffff',
                isVisible: true,
                bgColor: '#FF6618',
                dragBgColor: '#FF6618',
                borderColor: '#FF6618',
                calendarId: '3',
                category: 'allday',
                dueDateClass: '',
                customStyle: 'cursor: default;',
                isPending: false,
                isFocused: false,
                isReadOnly: false,
                isPrivate: false,
                location: '',
                attendees: '',
                recurrenceRule: '',
                state: ''
            }, {
                id: 489274,
                title: 'Eid Day 2 Holiday',
                isAllDay: false,
                start: '2021-07-22T11:30:00+09:00',
                end: '2021-07-22T12:00:00+09:00',
                color: '#ffffff',
                isVisible: true,
                bgColor: '#FF6618',
                dragBgColor: '#FF6618',
                borderColor: '#FF6618',
                calendarId: '3',
                category: 'allday',
                dueDateClass: '',
                customStyle: 'cursor: default;',
                isPending: false,
                isFocused: false,
                isReadOnly: false,
                isPrivate: false,
                location: '',
                attendees: '',
                recurrenceRule: '',
                state: ''
            }, {
                id: 489275,
                title: 'Eid al Day 3 Holiday',
                isAllDay: false,
                start: '2021-07-23T11:30:00+09:00',
                end: '2021-07-23T12:00:00+09:00',
                color: '#ffffff',
                isVisible: true,
                bgColor: '#FF6618',
                dragBgColor: '#FF6618',
                borderColor: '#FF6618',
                calendarId: '3',
                category: 'allday',
                dueDateClass: '',
                customStyle: 'cursor: default;',
                isPending: false,
                isFocused: false,
                isReadOnly: false,
                isPrivate: false,
                location: '',
                attendees: '',
                recurrenceRule: '',
                state: ''
            },

        ];

        calendarTUI.createSchedules(schedules);
        refreshScheduleVisibility();
    }

    function setEventListener() {
        menu.addEventListener('click', onClickNavigation);

        $('#btn-save-schedule').on('click', onNewSchedule);
        $('#btn-new-schedule').on('click', createNewSchedule);

        $('#dropdownMenu-calendars-list').on('click', onChangeNewScheduleCalendar);

        window.addEventListener('resize', resizeThrottled);

        //Calendar Type dropdown click listner to get weekly or monthly calendar
        calendarSelection.addEventListener("change", (e) => {
            const value = calendarSelection.value;
            if (value === 'week') {
                type = 'week';
                calendarTUI.changeView(type, true);
                MonthYearDisplay(type);
            } else {
                type = 'month';
                calendarTUI.changeView(type, true);
                MonthYearDisplay(type);

            }
        });

    }

    //Function to get the target element data action
    const getDataAction = function(target) {
        return target.dataset ? target.dataset.action : target.getAttribute('data-action');
    }

    resizeThrottled = tui.util.throttle(function() {
        calendarTUI.render();
    }, 50);

    window.calendarTUI = calendarTUI;

    // setDropdownCalendarType();
    MonthYearDisplay(type);
    setSchedules();
    setEventListener();


})(window, tui.Calendar)