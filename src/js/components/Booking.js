import {templates, select, settings} from '../settings.js';
import AmountWidget from './AmountWidget.js';

class Booking {
  constructor(element) {
    const thisBooking = this;
    thisBooking.render(element);
    thisBooking.getElements();
    thisBooking.initAmountWidget();
    // thisBooking.initPeopleAmountWidget();
    // thisBooking.initWidgets();
  }
  getElements() {
    const thisBooking = this;
    thisBooking.dom.peopleAmountElem = document.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmountElem = document.querySelector(select.booking.hoursAmount);
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
}

export default Booking;
