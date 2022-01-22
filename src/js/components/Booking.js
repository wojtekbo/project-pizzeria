import {templates, select, settings} from '../settings.js';
import {utils} from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element) {
    const thisBooking = this;
    thisBooking.render(element);
    thisBooking.getElements();
    thisBooking.initAmountWidget();
    thisBooking.initDatePicker();
    thisBooking.initHourPicker();
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

    // console.log(urls);

    Promise.all([fetch(urls.booking), fetch(urls.eventsCurrent), fetch(urls.eventsRepeat)])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([bookingsResponse.json(), eventsCurrentResponse.json(), eventsRepeatResponse.json()]);
      })
      .then(function ([bookings, eventsCurrentResponse, eventsRepeatResponse]) {
        console.log(bookings, eventsCurrentResponse, eventsRepeatResponse);
      });
  }

  getElements() {
    const thisBooking = this;
    thisBooking.dom.peopleAmountElem = document.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmountElem = document.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePickerElm = document.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPickerElm = document.querySelector(select.widgets.hourPicker.wrapper);
  }
  render(element) {
    const thisBooking = this;
    const bookingHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = bookingHTML;
  }
  initAmountWidget() {
    const thisBooking = this;
    thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmountElem, settings.amountWidget.defaultValue);
    thisBooking.dom.peopleAmountElem.addEventListener('updated', () => console.log('test 1'));
    thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmountElem, settings.amountWidget.defaultValue);
    thisBooking.dom.hoursAmountElem.addEventListener('updated', () => console.log('test 2'));
  }
  initDatePicker() {
    const thisBooking = this;
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePickerElm);
  }
  initHourPicker() {
    const thisBooking = this;
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPickerElm);
  }
}

export default Booking;
