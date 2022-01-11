/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars
{
  ('use strict');

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };

  class Product {
    constructor(id, data) {
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data;
      thisProduct.price = [];
      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
      console.log('   *** stworzono obiekt: ', id, ' ***');
    }
    renderInMenu() {
      const thisProduct = this;
      // generate HTML based on template
      const generatedHTML = templates.menuProduct(thisProduct.data);
      // create element using utils.createElementFromHTML
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      // find menu container
      const menuContainer = document.querySelector(select.containerOf.menu);
      // add element to menu
      menuContainer.appendChild(thisProduct.element);
    }

    getElements() {
      const thisProduct = this;
      thisProduct.dom = {};
      thisProduct.dom.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.dom.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.dom.formInputs = thisProduct.dom.form.querySelectorAll(select.all.formInputs);
      thisProduct.dom.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.dom.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.dom.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.dom.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }

    initAccordion() {
      const thisProduct = this;
      /* find the clickable trigger (the element that should react to clicking) */
      // const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      /* START: add event listener to clickable trigger on event click */
      thisProduct.dom.accordionTrigger.addEventListener('click', function (event) {
        /* prevent default action for event */
        event.preventDefault();
        /* find active product (product that has active class) */
        const menuActiveProduct = document.querySelector(select.all.menuProductsActive);
        /* if there is active product and it's not thisProduct.element, remove class active from it */
        // console.log('aktywny: ', menuActiveProduct);
        // console.log('klikniety: ', thisProduct.element);
        if (menuActiveProduct && thisProduct.element !== menuActiveProduct) {
          menuActiveProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }
        /* toggle active class on thisProduct.element */
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
      });
    }

    initOrderForm() {
      const thisProduct = this;
      thisProduct.dom.form.addEventListener('submit', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
      });

      for (let input of thisProduct.dom.formInputs) {
        input.addEventListener('change', function () {
          thisProduct.processOrder();
        });
      }

      thisProduct.dom.cartButton.addEventListener('click', function (event) {
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }

    initAmountWidget() {
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem);
      thisProduct.dom.amountWidgetElem.addEventListener('updated', () => thisProduct.processOrder());
    }

    processOrder() {
      const thisProduct = this;

      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.dom.form);
      // console.log('formData', formData);

      // set price to default price
      let price = thisProduct.data.price;

      // for every category (param)...
      for (let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        // console.log(paramId, param);
        // for every option in this category
        for (let optionId in param.options) {
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];
          // console.log(optionId, option);
          if (formData[paramId].includes(optionId) && !option.default) {
            //  jezeli wybrany produkt nie jest opcją domyślną to cena rośnie
            // console.log(optionId, 'WYBRANE - NIE DOMYSLNE');
            price += option.price;
          } else if (!formData[paramId].includes(optionId) && option.default) {
            //  jezeli nie wybrał produktu a był opcją domyślną to cena maleje
            // console.log(optionId, 'NIE WYBRANE - DOMYSLNE');
            price -= option.price;
          }

          //  Znalezienie obrazka o klasie .paramId-optionId w divie z obrazkami.
          const optionImage = thisProduct.dom.imageWrapper.querySelector(`.${paramId}-${optionId}`);
          //  czy obrazek istnieje i jest wybrany
          if (optionImage && formData[paramId].includes(optionId)) {
            //  jezeli tak to dodajemy klase Acrtive dla obrazka
            optionImage.classList.add(classNames.menuProduct.imageVisible);
            //  czy obrazek istnieje i jest niewybrany
          } else if (optionImage && !formData[paramId].includes(optionId)) {
            //  jezeli tak to zdejmujemy klase active z obrazka
            optionImage.classList.remove(classNames.menuProduct.imageVisible);
          }
        }
      }

      // update calculated price in the HTML
      thisProduct.priceSingle = price;
      price *= thisProduct.amountWidget.value;
      thisProduct.price = price;
      thisProduct.dom.priceElem.innerHTML = price;
    }

    addToCart() {
      const thisProduct = this;
      app.cart.add(thisProduct.prepareCartProduct());
    }

    prepareCartProductParams() {
      const thisProduct = this;
      const productParams = {};
      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.dom.form);
      // for every category (param)...
      for (let paramId in thisProduct.data.params) {
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        productParams[paramId] = {};
        productParams[paramId].label = param.label;
        productParams[paramId].options = {};
        // for every option in this category
        for (let optionId in param.options) {
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];
          if (formData[paramId].includes(optionId)) {
            productParams[paramId].options[optionId] = option.label;
          }
        }
      }
      return productParams;
    }

    prepareCartProduct() {
      const thisProduct = this;
      thisProduct.prepareCartProductParams();
      const productSummary = {
        id: thisProduct.id,
        name: thisProduct.data.name,
        amount: thisProduct.amountWidget.value,
        priceSingle: thisProduct.priceSingle,
        price: thisProduct.price,
        params: thisProduct.prepareCartProductParams(),
      };
      return productSummary;
    }
  }

  class AmountWidget {
    constructor(element) {
      const thisWidget = this;
      // thisWidget.element = element;
      // console.log('AmountWidget: ', thisWidget);
      // console.log('constructor arguments (element): ', element);
      thisWidget.getElements(element);
      thisWidget.setValue(settings.amountWidget.defaultValue);
      thisWidget.initActions();
    }
    getElements(element) {
      const thisWidget = this;
      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }
    setValue(value) {
      const thisWidget = this;
      const newValue = parseInt(value);
      // [TO DO] Add validation
      if (newValue !== thisWidget.value && !isNaN(newValue) && !(newValue < settings.amountWidget.defaultMin) && !(newValue > settings.amountWidget.defaultMax)) {
        thisWidget.value = newValue;
      }
      thisWidget.announce();
      thisWidget.input.value = thisWidget.value;
    }
    initActions() {
      const thisWidget = this;
      thisWidget.input.addEventListener('change', () => thisWidget.setValue(thisWidget.input.value));
      thisWidget.linkDecrease.addEventListener('click', () => thisWidget.setValue(thisWidget.value - 1));
      thisWidget.linkIncrease.addEventListener('click', () => thisWidget.setValue(thisWidget.value + 1));
    }
    announce() {
      const thisWidget = this;
      // const event = new Event('updated');
      const event = new CustomEvent('updated', {
        bubbles: true,
      });
      thisWidget.element.dispatchEvent(event);
    }
  }

  class Cart {
    constructor(element) {
      const thisCart = this;
      thisCart.products = [];
      thisCart.getElements(element);
      thisCart.initActions();
      console.log('   *** Stworzono koszk: ', thisCart, ' ***');
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
    }
    initActions() {
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click', () => thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive));
      thisCart.dom.productList.addEventListener('updated', () => thisCart.update());
      thisCart.dom.productList.addEventListener('remove', (event) => thisCart.remove(event.detail.cartProduct));
    }
    add(menuProduct) {
      // const thisCart = this;
      const thisCart = this;
      // console.log('adding product: ', menuProduct);
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
    ///////////////////////// [TO DO]
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
      let totalNumber = 0;
      //zsumowanej cenie za wszystko (chociaż bez kosztu dostawy)
      let subtotalPrice = 0;
      for (let cartProduct of thisCart.products) {
        totalNumber = totalNumber + cartProduct.amount;
        subtotalPrice = subtotalPrice + cartProduct.price;
      }
      if (subtotalPrice) {
        thisCart.totalPrice = subtotalPrice + deliveryFee;
      } else thisCart.totalPrice = subtotalPrice;

      thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;
      thisCart.dom.deliveryFee.innerHTML = deliveryFee;
      for (let totalPrice of thisCart.dom.totalPrice) {
        totalPrice.innerHTML = thisCart.totalPrice;
      }
      thisCart.dom.totalNumber.innerText = totalNumber;
    }
  }

  class CartProduct {
    constructor(menuProduct, element) {
      const thisCartProduct = this;
      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.params = menuProduct.params;
      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
      // console.log(thisCartProduct);
    }
    getElements(element) {
      const thisCartProduct = this;
      thisCartProduct.dom = {};
      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }
    initAmountWidget() {
      const thisCartProduct = this;
      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
      thisCartProduct.dom.amountWidget.addEventListener('updated', () => {
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.amount * thisCartProduct.priceSingle;
        thisCartProduct.dom.price.innerText = thisCartProduct.price;
      });
    }
    initActions() {
      const thisCartProduct = this;
      thisCartProduct.dom.edit.addEventListener('click', (event) => {
        event.preventDefault();
      });
      thisCartProduct.dom.remove.addEventListener('click', (event) => {
        event.preventDefault();
        thisCartProduct.remove();
      });
    }
    remove() {
      console.log('USUWANIE');
      const thisCartProduct = this;
      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });
      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }
  }

  const app = {
    initData: function () {
      const thisApp = this;
      thisApp.data = dataSource;
    },
    initCart: function () {
      const thisApp = this;
      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },
    initMenu: function () {
      const thisApp = this;
      for (let productData in thisApp.data.products) {
        new Product(productData, thisApp.data.products[productData]);
      }
    },
    init: function () {
      const thisApp = this;
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);
      thisApp.initData();
      thisApp.initMenu();
      thisApp.initCart();
    },
  };

  app.init();
}
