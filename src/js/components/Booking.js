import {templates} from '../settings.js';

class Booking {
  constructor(element) {
    const thisBooking = this;
    thisBooking.render(element);
    // thisBooking.initWidgets();
  }
  render(element) {
    const thisBooking = this;
    const bookingHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = bookingHTML;
  }
}

export default Booking;
