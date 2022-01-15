import {settings, select, classNames, templates} from '../settings.js';
import {utils} from '../utils.js';
import AmountWidget from './AmountWidget.js';

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
    thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem, settings.amountWidget.defaultValue);
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
    thisProduct.name = thisProduct.data.name;
    thisProduct.amount = thisProduct.amountWidget.value;
    // app.cart.add(thisProduct.prepareCartProduct());
    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct,
      },
    });
    thisProduct.element.dispatchEvent(event);
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

export default Product;
