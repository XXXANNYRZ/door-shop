document.addEventListener('DOMContentLoaded', function () {
    console.log('Скрипт загружен!'); // Проверка загрузки скрипта

    // Прокрутка для всех ссылок с хэшем
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            console.log('Клик по ссылке:', this.getAttribute('href')); // Проверка клика
            e.preventDefault(); // Отменяем стандартное поведение
            const targetId = this.getAttribute('href').substring(1); // Получаем id секции
            const targetSection = document.getElementById(targetId); // Находим секцию

            if (targetSection) {
                console.log(`Секция найдена: ${targetId}`);
                const headerHeight = document.querySelector('header').offsetHeight; // Высота header
                const offsetTop = targetSection.offsetTop - headerHeight; // Позиция с учетом header
                console.log(`Прокрутка до: ${offsetTop}`);

                // Прокрутка
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // Закрываем бургерное меню после клика на ссылку
                const burgerMenu = document.querySelector('.burger-menu');
                const menuToggle = document.querySelector('.menu-toggle');
                const body = document.body;

                if (burgerMenu.classList.contains('active')) {
                    burgerMenu.classList.remove('active');
                    menuToggle.classList.remove('active');
                    body.classList.remove('menu-open');
                }
            } else {
                console.error(`Секция с id "${targetId}" не найдена.`);
            }
        });
    });

    // Управление бургерным меню
    const menuToggle = document.querySelector('.menu-toggle');
    const burgerMenu = document.querySelector('.burger-menu');
    const body = document.body;

    menuToggle.addEventListener('click', function () {
        burgerMenu.classList.toggle('active');
        menuToggle.classList.toggle('active');
        body.classList.toggle('menu-open');
    });

    // Закрытие меню при клике вне его области
    document.addEventListener('click', function (e) {
        if (!burgerMenu.contains(e.target) && !menuToggle.contains(e.target)) {
            burgerMenu.classList.remove('active');
            menuToggle.classList.remove('active');
            body.classList.remove('menu-open');
        }
    });

    // Логика для модальных окон
    const modals = {
        'modal-call': '#call-button',
        'modal-consult': '#consult-button',
        'modal-order': '.order-button',
        'modal-order-service': '.order-service-button',
        'modal-more': '.more-button'
    };

    for (const [modalId, selector] of Object.entries(modals)) {
        const modal = document.getElementById(modalId);
        const closeBtn = modal.querySelector('.close');

        document.querySelectorAll(selector).forEach(button => {
            button.addEventListener('click', () => {
                modal.style.display = 'block';
            });
        });

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Логика для успешной отправки
    const successModal = document.getElementById('modal-success');
    const closeSuccessModal = successModal.querySelector('.close');
    const successMessage = document.getElementById('success-message');

    // Закрытие модального окна успешной отправки
    closeSuccessModal.addEventListener('click', () => {
        successModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === successModal) {
            successModal.style.display = 'none';
        }
    });

    // Обработка форм
    const forms = {
        'call-form': 'запрос на звонок',
        'consult-form': 'запрос на консультацию',
        'order-form': 'заказ товара',
        'order-service-form': 'заказ услуги',
        'contact-form': 'комментарий' // Добавлена форма "Связь с нами"
    };

    // Обработчик формы (новый вариант)
// Улучшенный обработчик форм
async function handleFormSubmit(form, formId, message) {
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    submitButton.disabled = true;
    submitButton.textContent = 'Отправка...';

    try {
        const formData = new FormData(form);
        
        // Добавляем тип формы
        formData.append('form_type', formId);
        
        // Важная проверка - что отправляем
        console.log('Отправляемые данные:', Object.fromEntries(formData.entries()));

        const response = await fetch('send_email.php', {
            method: 'POST', // Важно!
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const result = await response.json();
        console.log('Ответ сервера:', result);

        if (result.error) {
            throw new Error(result.error);
        }

        // Показываем успех
        successMessage.textContent = `Успешно отправлено: ${message}`;
        successModal.style.display = 'block';
        form.reset();

        // Закрываем модальное окно, если форма в модалке
        const modal = form.closest('.modal');
        if (modal) modal.style.display = 'none';

    } catch (error) {
        console.error('Ошибка:', error);
        alert(`Ошибка отправки: ${error.message}`);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

// Инициализация всех форм
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formId = this.id;
        if (forms[formId]) {
            handleFormSubmit(this, formId, forms[formId]);
        }
    });
});

    // Инициализация слайдеров
    const swiperOptions = {
        loop: false, // Отключаем бесконечную прокрутку
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        spaceBetween: 20, // Расстояние между слайдами
        centeredSlides: false, // Не центрировать слайды
        breakpoints: {
            320: { // Настройки для экранов меньше 320px
                slidesPerView: 1,
            },
            769: { // Настройки для экранов меньше 768px
                slidesPerView: 2,
            },
            1000: { // Настройки для экранов меньше 1024px
                slidesPerView: 3,
            },
        },
    };

    // Инициализация слайдеров для каждой секции
    new Swiper('#metal-doors .swiper-container', swiperOptions);
    new Swiper('#steel-doors .swiper-container', swiperOptions);
    new Swiper('#services .swiper-container', swiperOptions);
});
console.log("Скрипт загружен!");