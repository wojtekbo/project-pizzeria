import {templates, select, settings} from '../settings.js';
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
    // thisBooking.initPeopleAmountWidget();
    // thisBooking.initWidgets();
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
