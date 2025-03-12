// Глобальные переменные и корзина
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Проверка и восстановление темы при загрузке страницы
if (localStorage.getItem("dark-theme") === "true") {
  document.body.classList.add("dark-theme");
}

// Функция загрузки товаров из products.json
async function loadProducts() {
  try {
    const response = await fetch('products.json');
    const data = await response.json();
    allProducts = data.products;
    populateCategoryFilter();
    displayProducts(allProducts);
    displayNewProductsCarousel(); // Заполнение карусели новинок
    updateCartUI();
  } catch (error) {
    console.error('Ошибка загрузки товаров:', error);
  }
}

/* Заполнение фильтра по категориям */
function populateCategoryFilter() {
  const categorySelect = document.getElementById('filter-category');
  if (!categorySelect) return;
  // Собираем уникальные категории
  const categories = [...new Set(allProducts.map(p => p.category))];
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
  // Фильтрация автоматически при выборе
  categorySelect.addEventListener('change', applyFilters);
}

/* Фильтрация товаров по категории */
function applyFilters() {
  const category = document.getElementById('filter-category').value;
  const filtered = allProducts.filter(product => {
    return category ? product.category === category : true;
  });
  displayProducts(filtered);
}

/* Сброс фильтра */
function resetFilters() {
  const categorySelect = document.getElementById('filter-category');
  if (categorySelect) categorySelect.value = "";
  displayProducts(allProducts);
}

/* Отображение товаров в каталоге */
function displayProducts(products) {
  const productsContainer = document.getElementById('products-list');
  if (!productsContainer) return;
  productsContainer.innerHTML = products.map(product => `
    <div class="product-card slide-up">
      <img src="${product.images[0]}" alt="${product.name}" class="product-image" />
      <div class="product-content">
        <h3>${product.name}</h3>
        <p class="product-category">${product.category}</p>
        <div class="product-rating">
          ${renderRating(product.rating)} (${product.reviews})
        </div>
        <div class="product-price">${formatPrice(product.price)}</div>
        <button class="btn btn-primary" onclick="addToCart(${product.id})">
          <i class="fas fa-cart-plus"></i> В корзину
        </button>
      </div>
    </div>
  `).join('');
}

/* Отрисовка рейтинга */
function renderRating(rating) {
  return Array(5).fill().map((_, i) => `
    <i class="fas fa-star ${i < rating ? 'active' : ''}"></i>
  `).join('');
}

/* Форматирование цены */
function formatPrice(price) {
  return new Intl.NumberFormat('ru-KZ', {
    style: 'currency',
    currency: 'KZT',
    maximumFractionDigits: 0
  }).format(price);
}

/* Функция для отображения новинок в виде карусели */
function displayNewProductsCarousel() {
  const carouselWrapper = document.getElementById('carousel-wrapper');
  if (!carouselWrapper) return;
  const newItems = allProducts.filter(product => product.category === "Новинки");
  carouselWrapper.innerHTML = newItems.map(product => `
    <div class="product-card slide-up" style="min-width: 250px; margin-right: 0.5rem;">
      <img src="${product.images[0]}" alt="${product.name}" class="product-image" />
      <div class="product-content">
        <h3>${product.name}</h3>
        <p class="product-category">${product.category}</p>
        <div class="product-rating">
          ${renderRating(product.rating)} (${product.reviews})
        </div>
        <div class="product-price">${formatPrice(product.price)}</div>
        <button class="btn btn-primary" onclick="addToCart(${product.id})">
          <i class="fas fa-cart-plus"></i> В корзину
        </button>
      </div>
    </div>
  `).join('');
  currentSlide = 0;
  updateCarousel();
}

let currentSlide = 0;
function updateCarousel() {
  const carouselWrapper = document.getElementById('carousel-wrapper');
  // Используем ширину 260px (с учётом отступа)
  const slideWidth = 260; 
  carouselWrapper.style.transform = `translateX(-${currentSlide * slideWidth}px)`;
}

function nextSlide() {
  const newItems = allProducts.filter(product => product.category === "Новинки");
  if (currentSlide < newItems.length - 1) {
    currentSlide++;
    updateCarousel();
  }
}

function prevSlide() {
  if (currentSlide > 0) {
    currentSlide--;
    updateCarousel();
  }
}

/* Добавление товара в корзину без alert */
function addToCart(id) {
  const product = allProducts.find(p => p.id === id);
  console.log('Добавляем товар:', product); // Debug
  if (!product) return;
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveCart();
  updateCartUI();
}

/* Сохранение корзины в localStorage */
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

/* Обновление UI корзины */
function updateCartUI() {
  // Обновление счётчика корзины
  const cartCount = document.getElementById('cart-count');
  if (cartCount) {
    const count = cart.reduce((acc, cur) => acc + cur.quantity, 0);
    cartCount.textContent = count;
  }
  
  // Если боковая панель корзины открыта
  const cartItemsContainer = document.getElementById('cart-items');
  if (cartItemsContainer) {
    cartItemsContainer.innerHTML = cart.map(item => `
      <div class="cart-item">
        <img src="${item.images[0]}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <p>Цена: ${formatPrice(item.price)}</p>
          <div class="quantity-control">
            <button onclick="changeQuantity(${item.id}, -1)">-</button>
            <span>${item.quantity}</span>
            <button onclick="changeQuantity(${item.id}, 1)">+</button>
          </div>
          <button class="remove-btn" onclick="removeFromCart(${item.id})">Убрать</button>
        </div>
      </div>
    `).join('');
    
    const cartTotalEl = document.getElementById('cart-total');
    const total = cart.reduce((acc, cur) => acc + cur.price * cur.quantity, 0);
    if (cartTotalEl) cartTotalEl.textContent = formatPrice(total);
  }
}

/* Изменение количества товара */
function changeQuantity(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity < 1) {
    cart = cart.filter(i => i.id !== id);
  }
  saveCart();
  updateCartUI();
}

/* Удаление товара из корзины */
function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  updateCartUI();
}

/* Боковая панель корзины */
function toggleCart() {
  const cartSidebar = document.getElementById('cart-sidebar');
  cartSidebar.classList.toggle('open');
}

/* Модальное окно оформления заказа */
function openCheckoutForm() {
  if (cart.length === 0) {
    alert('Корзина пуста!');
    return;
  }
  document.body.classList.add('no-scroll');
  document.getElementById('checkout-modal').classList.add('show');
}
function closeCheckoutForm() {
  document.body.classList.remove('no-scroll');
  document.getElementById('checkout-modal').classList.remove('show');
}

/* Отправка заказа через WhatsApp */
document.getElementById('checkout-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('customerName').value;
  const phone = document.getElementById('customerPhone').value;
  const payment = document.getElementById('paymentMethod').value;
  
  const itemsText = cart.map(item => 
    `- ${item.name}, кол-во: ${item.quantity}, цена: ${formatPrice(item.price)}`
  ).join('\n');
  
  const total = cart.reduce((acc, cur) => acc + cur.price * cur.quantity, 0);
  
  let message = `Здравствуйте! Хочу оформить заказ:
Имя: ${name}
Телефон: ${phone}
Оплата: ${payment}

Товары:
${itemsText}
Итого: ${formatPrice(total)}`;
  
  const encoded = encodeURIComponent(message);
  const whatsappURL = `https://wa.me/77001234567?text=${encoded}`;
  window.open(whatsappURL, '_blank');
  closeCheckoutForm();
});

/* Переключение темы с сохранением в localStorage */
const themeToggleBtn = document.getElementById('theme-toggle');
themeToggleBtn?.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  if (document.body.classList.contains('dark-theme')) {
    localStorage.setItem("dark-theme", "true");
    themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    localStorage.setItem("dark-theme", "false");
    themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
  }
});

/* Бургер-меню */
const burgerBtn = document.getElementById('burger-menu');
const navLinks = document.getElementById('nav-links');
burgerBtn?.addEventListener('click', () => {
  const expanded = burgerBtn.getAttribute('aria-expanded') === 'true';
  burgerBtn.setAttribute('aria-expanded', !expanded);
  navLinks.classList.toggle('nav-open');
});

/* Запуск загрузки товаров */
loadProducts();