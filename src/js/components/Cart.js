import {settings, select, classNames, templates} from '../settings.js';
import {utils} from '../utils.js';
import CartProduct from './CartProduct.js';

class Cart {
  constructor(element) {
    const thisCart = this;
    thisCart.products = [];
    thisCart.getElements(element);
    thisCart.initActions();
    // console.log('   *** Stworzono koszk: ', thisCart, ' ***');
  }
  getElements(element) {
    const thisCart = this;
    thisCart.dom = {};
    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
    thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
    thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
    thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.dom.address = thisCart.dom.form.querySelector(select.cart.address);
    thisCart.dom.phone = thisCart.dom.form.querySelector(select.cart.phone);
    thisCart.dom.orderButton = thisCart.dom.form.querySelector(select.cart.formSubmit);
  }
  initActions() {
    const thisCart = this;
    thisCart.dom.toggleTrigger.addEventListener('click', () => thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive));
    thisCart.dom.productList.addEventListener('updated', () => thisCart.update());
    thisCart.dom.productList.addEventListener('remove', (event) => thisCart.remove(event.detail.cartProduct));
    thisCart.dom.form.addEventListener('submit', (event) => {
      event.preventDefault();
      thisCart.sendOrder();
    });
  }
  add(menuProduct) {
    // const thisCart = this;
    const thisCart = this;
    console.log('adding product: ', menuProduct);
    // generate HTML based on template
    const generatedHTML = templates.cartProduct(menuProduct);
    // create element using utils.createElementFromHTML
    thisCart.element = utils.createDOMFromHTML(generatedHTML);
    // add element to cart
    thisCart.dom.productList.appendChild(thisCart.element);
    thisCart.products.push(new CartProduct(menuProduct, thisCart.element));
    // console.log('thisCart.products', thisCart.products);
    thisCart.update();
  }
  remove(cartProduct) {
    const thisCart = this;
    const productIndex = thisCart.products.indexOf(cartProduct);
    thisCart.products.splice(productIndex, 1);
    cartProduct.dom.wrapper.remove();
    thisCart.update();
  }
  update() {
    const thisCart = this;
    const deliveryFee = settings.cart.defaultDeliveryFee;
    //całościowej liczbie sztuk,
    thisCart.totalNumber = 0;
    //zsumowanej cenie za wszystko (chociaż bez kosztu dostawy)
    thisCart.subtotalPrice = 0;
    for (let cartProduct of thisCart.products) {
      thisCart.totalNumber = thisCart.totalNumber + cartProduct.amount;
      thisCart.subtotalPrice = thisCart.subtotalPrice + cartProduct.price;
    }
    if (thisCart.subtotalPrice) {
      thisCart.totalPrice = thisCart.subtotalPrice + deliveryFee;
    } else thisCart.totalPrice = thisCart.subtotalPrice;

    thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
    thisCart.dom.deliveryFee.innerHTML = deliveryFee;
    for (let totalPrice of thisCart.dom.totalPrice) {
      totalPrice.innerHTML = thisCart.totalPrice;
    }
    thisCart.dom.totalNumber.innerText = thisCart.totalNumber;
  }
  sendOrder() {
    const thisCart = this;
    const url = settings.db.url + '/' + settings.db.orders;
    const payload = {};
    payload.address = thisCart.dom.form.address.value;
    payload.phone = thisCart.dom.form.phone.value;
    payload.totalPrice = thisCart.totalPrice;
    payload.subtotalPrice = thisCart.subtotalPrice;
    payload.totalNumber = thisCart.totalNumber;
    payload.deliveryFee = settings.cart.defaultDeliveryFee;
    payload.products = [];
    for (let prod of thisCart.products) {
      payload.products.push(prod.getData());
    }
    // console.log(payload);

    // fetch(url, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(payload)
    // });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    fetch(url, options)
      .then((response) => response.json())
      .then((parsedResponse) => alert('Zamwienie wysłane!'));
  }
}

export default Cart;
