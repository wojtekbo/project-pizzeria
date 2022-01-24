import {templates, select, settings, classNames} from '../settings.js';
import {utils} from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element) {
    const thisBooking = this;
    thisBooking.render(element);
    // thisBooking.getElements();
    thisBooking.initWidgets();
    // thisBooking.initAmountWidget();
    // thisBooking.initDatePicker();
    // thisBooking.initHourPicker();
    thisBooking.getData();
    // thisBooking.initPeopleAmountWidget();
    // thisBooking.initWidgets();
  }
  getData() {
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);
    const params = {
      booking: [startDateParam, endDateParam],
      eventsCurrent: [settings.db.notRepeatParam, startDateParam, endDateParam],
      eventsRepeat: [settings.db.repeatParam, endDateParam],
    };

    // console.log('params', params);

    const urls = {
      booking: settings.db.url + '/' + settings.db.bookings + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.events + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.events + '?' + params.eventsRepeat.join('&'),
    };
    console.log(urls);

    // console.log(urls);

    Promise.all([fetch(urls.booking), fetch(urls.eventsCurrent), fetch(urls.eventsRepeat)])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([bookingsResponse.json(), eventsCurrentResponse.json(), eventsRepeatResponse.json()]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        // console.log(bookings, eventsCurrent, eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;
    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.minDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }
    console.log('thisBooking.booked', thisBooking.booked);

    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      // console.log(hourBlock);
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;
    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;
    if (typeof thisBooking.booked[thisBooking.date] == 'undefined' || typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined') {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }
      if (!allAvailable && thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  // getElements() {
  //   const thisBooking = this;
  // }
  render(element) {
    const thisBooking = this;

    const bookingHTML = templates.bookingWidget();

    thisBooking.dom = {};

    thisBooking.dom.wrapper = element;

    thisBooking.dom.wrapper.innerHTML = bookingHTML;

    thisBooking.dom.peopleAmountElem = document.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmountElem = document.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePickerElm = document.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPickerElm = document.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
  }

  initWidgets() {
    const thisBooking = this;
    thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmountElem);
    thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmountElem);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePickerElm);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPickerElm);
    thisBooking.dom.wrapper.addEventListener('updated', () => {
      thisBooking.updateDOM();
    });
  }

  // initAmountWidget() {
  //   const thisBooking = this;
  //   thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmountElem, settings.amountWidget.defaultValue);
  //   thisBooking.dom.peopleAmountElem.addEventListener('updated', () => console.log('test 1'));
  //   thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmountElem, settings.amountWidget.defaultValue);
  //   thisBooking.dom.hoursAmountElem.addEventListener('updated', () => console.log('test 2'));
  // }
  // initDatePicker() {
  //   const thisBooking = this;
  //   thisBooking.datePicker = new DatePicker(thisBooking.dom.datePickerElm);
  // }
  // initHourPicker() {
  //   const thisBooking = this;
  //   thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPickerElm);
  // }
}

export default Booking;
