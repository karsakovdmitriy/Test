// Инициализация данных
const DEFAULT_MASTERS = [
    {
        id: '1',
        name: 'Алексей Иванов',
        bio: 'Профессиональный фитнес-тренер с 10-летним стажем. Специализируюсь на функциональном тренинге и похудении.',
        photo: 'https://images.unsplash.com/photo-1548690312-e3b507d17a4d?w=400&h=400&fit=crop',
        services: [
            { id: 's1', name: 'Персональная тренировка', price: 2500, duration: 60 },
            { id: 's2', name: 'Составление плана питания', price: 1500, duration: 30 }
        ],
        schedule: [1, 2, 3, 4, 5], // Пн-Пт
        rating: 4.9,
        reviews: [
            { clientName: 'Мария', text: 'Отличный тренер! Результат виден уже через месяц.', rating: 5 }
        ]
    },
    {
        id: '2',
        name: 'Елена Смирнова',
        bio: 'Логопед-дефектолог. Помогаю детям и взрослым исправить дефекты речи и поставить звуки.',
        photo: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop',
        services: [
            { id: 's3', name: 'Консультация логопеда', price: 2000, duration: 45 },
            { id: 's4', name: 'Занятие по постановке звуков', price: 1800, duration: 30 }
        ],
        schedule: [1, 3, 5, 6],
        rating: 4.8,
        reviews: [
            { clientName: 'Игорь', text: 'Очень терпеливый и внимательный специалист.', rating: 5 }
        ]
    }
];

let masters = JSON.parse(localStorage.getItem('sf_masters')) || DEFAULT_MASTERS;
let bookings = JSON.parse(localStorage.getItem('sf_bookings')) || [];
let currentRole = 'client';
let currentMasterId = '1'; // Для пилота считаем, что мы зашли под Алексеем

// DOM элементы
const btnClientView = document.getElementById('btn-client-view');
const btnMasterView = document.getElementById('btn-master-view');
const clientView = document.getElementById('client-view');
const masterView = document.getElementById('master-view');
const logo = document.getElementById('logo');

// Переключение ролей
btnClientView.addEventListener('click', () => setRole('client'));
btnMasterView.addEventListener('click', () => setRole('master'));
logo.addEventListener('click', () => setRole('client'));

function setRole(role) {
    currentRole = role;
    if (role === 'client') {
        btnClientView.classList.add('active');
        btnMasterView.classList.remove('active');
        clientView.classList.remove('hidden');
        masterView.classList.add('hidden');
        renderMasterList();
    } else {
        btnClientView.classList.remove('active');
        btnMasterView.classList.add('active');
        clientView.classList.add('hidden');
        masterView.classList.remove('hidden');
        initMasterDashboard();
    }
}

// --- УПРАВЛЕНИЕ МАСТЕРОМ ---

function initMasterDashboard() {
    renderSidebar();
    showDashSection('dash-bookings');
    
    // Навигация дашборда
    document.querySelectorAll('.dash-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            showDashSection(e.target.dataset.dash);
            document.querySelectorAll('.dash-nav-link').forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    initProfileForm();
    renderMasterServices();
    renderSchedule();
    renderBookings();
}

function showDashSection(sectionId) {
    document.querySelectorAll('.dash-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');
}

function renderSidebar() {
    const master = masters.find(m => m.id === currentMasterId);
    if (master) {
        document.getElementById('sidebar-name').textContent = master.name;
        const avatar = document.getElementById('sidebar-avatar');
        if (master.photo) {
            avatar.style.backgroundImage = `url(${master.photo})`;
            avatar.style.backgroundSize = 'cover';
            avatar.textContent = '';
        } else {
            avatar.textContent = master.name.charAt(0);
        }
    }
}

function initProfileForm() {
    const master = masters.find(m => m.id === currentMasterId);
    const form = document.getElementById('master-profile-form');
    if (master && form) {
        form.elements['profile-name'].value = master.name;
        form.elements['profile-bio'].value = master.bio;
        form.elements['profile-photo'].value = master.photo;

        form.onsubmit = (e) => {
            e.preventDefault();
            master.name = form.elements['profile-name'].value;
            master.bio = form.elements['profile-bio'].value;
            master.photo = form.elements['profile-photo'].value;
            saveData();
            renderSidebar();
            alert('Профиль сохранен!');
        };
    }
}

function renderMasterServices() {
    const master = masters.find(m => m.id === currentMasterId);
    const list = document.getElementById('dash-services-list');
    if (master && list) {
        list.innerHTML = '';
        master.services.forEach(service => {
            const div = document.createElement('div');
            div.className = 'service-item';
            div.innerHTML = `
                <div class="service-info">
                    <h4>${escapeHtml(service.name)}</h4>
                    <div class="service-meta">${service.duration} мин • ${service.price} ₽</div>
                </div>
                <button class="btn-secondary" onclick="deleteService('${service.id}')">Удалить</button>
            `;
            list.appendChild(div);
        });
    }
}

window.deleteService = (id) => {
    const master = masters.find(m => m.id === currentMasterId);
    master.services = master.services.filter(s => s.id !== id);
    saveData();
    renderMasterServices();
};

document.getElementById('btn-add-service').addEventListener('click', () => {
    showModal('Добавить услугу', `
        <form id="add-service-form">
            <div class="form-group">
                <label>Название услуги</label>
                <input type="text" name="name" required>
            </div>
            <div class="form-group">
                <label>Длительность (мин)</label>
                <input type="number" name="duration" required>
            </div>
            <div class="form-group">
                <label>Стоимость (₽)</label>
                <input type="number" name="price" required>
            </div>
            <button type="submit" class="btn-primary">Добавить</button>
        </form>
    `);

    document.getElementById('add-service-form').onsubmit = (e) => {
        e.preventDefault();
        const master = masters.find(m => m.id === currentMasterId);
        const newService = {
            id: 's' + Date.now(),
            name: e.target.name.value,
            duration: parseInt(e.target.duration.value),
            price: parseInt(e.target.price.value)
        };
        master.services.push(newService);
        saveData();
        renderMasterServices();
        hideModal();
    };
});

// --- ГРАФИК РАБОТЫ ---

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function renderSchedule() {
    const master = masters.find(m => m.id === currentMasterId);
    const grid = document.getElementById('schedule-grid');
    if (master && grid) {
        grid.innerHTML = '';
        DAYS.forEach((day, index) => {
            const currentDayVal = index === 6 ? 0 : index + 1;
            const isDayActive = master.schedule.includes(currentDayVal);

            const div = document.createElement('div');
            div.className = `schedule-day ${isDayActive ? 'active' : ''}`;
            div.textContent = day;
            div.onclick = () => {
                div.classList.toggle('active');
            };
            grid.appendChild(div);
        });
    }
}

document.getElementById('btn-save-schedule').addEventListener('click', () => {
    const master = masters.find(m => m.id === currentMasterId);
    const newSchedule = [];
    document.querySelectorAll('.schedule-day').forEach((div, index) => {
        if (div.classList.contains('active')) {
            const val = index === 6 ? 0 : index + 1;
            newSchedule.push(val);
        }
    });
    master.schedule = newSchedule;
    saveData();
    alert('График сохранен!');
});

// --- ЗАПИСИ ---

function renderBookings() {
    const list = document.getElementById('bookings-list');
    const masterBookings = bookings.filter(b => b.masterId === currentMasterId);
    if (list) {
        list.innerHTML = '';
        if (masterBookings.length === 0) {
            list.innerHTML = '<p class="subtitle">Пока нет новых записей.</p>';
            return;
        }

        masterBookings.forEach(booking => {
            const master = masters.find(m => m.id === booking.masterId);
            const service = master.services.find(s => s.id === booking.serviceId);
            const div = document.createElement('div');
            div.className = 'booking-card';
            div.innerHTML = `
                <div>
                    <h4>${escapeHtml(booking.clientName)}</h4>
                    <div class="service-meta">${service ? escapeHtml(service.name) : 'Удаленная услуга'} • ${escapeHtml(booking.time)}</div>
                    <span class="booking-status status-${booking.status}">${booking.status === 'pending' ? 'Ожидает' : 'Подтверждено'}</span>
                </div>
                ${booking.status === 'pending' ? `
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-primary" style="background: var(--success);" onclick="updateBookingStatus('${booking.id}', 'confirmed')">Принять</button>
                        <button class="btn-secondary" style="color: var(--danger);" onclick="updateBookingStatus('${booking.id}', 'declined')">Отклонить</button>
                    </div>
                ` : ''}
            `;
            list.appendChild(div);
        });
    }
}

window.updateBookingStatus = (id, status) => {
    const booking = bookings.find(b => b.id === id);
    if (booking) {
        booking.status = status;
        saveData();
        renderBookings();
    }
};

// --- КЛИЕНТСКАЯ ЧАСТЬ ---

function renderMasterList() {
    const grid = document.getElementById('masters-grid');
    const searchVal = document.getElementById('master-search').value.toLowerCase();
    
    if (grid) {
        grid.innerHTML = '';
        const filtered = masters.filter(m =>
            m.name.toLowerCase().includes(searchVal) ||
            m.services.some(s => s.name.toLowerCase().includes(searchVal))
        );

        filtered.forEach(master => {
            const card = document.createElement('div');
            card.className = 'master-card';
            card.onclick = () => showMasterDetail(master.id);
            card.innerHTML = `
                <img src="${master.photo || 'https://via.placeholder.com/400'}" class="master-card-img" alt="${escapeHtml(master.name)}">
                <div class="master-card-name">${escapeHtml(master.name)}</div>
                <div class="master-card-services">
                    ${master.services.slice(0, 2).map(s => escapeHtml(s.name)).join(', ')}${master.services.length > 2 ? '...' : ''}
                </div>
                <div class="master-card-footer">
                    <div class="rating">★ ${master.rating}</div>
                    <div style="font-weight: 700;">от ${Math.min(...master.services.map(s => s.price))} ₽</div>
                </div>
            `;
            grid.appendChild(card);
        });
    }
}

document.getElementById('master-search').addEventListener('input', renderMasterList);

function showMasterDetail(id) {
    const master = masters.find(m => m.id === id);
    const detailView = document.getElementById('master-profile-detail');
    const listView = document.getElementById('master-list-container');
    const content = document.getElementById('master-detail-content');

    if (master && content) {
        listView.classList.add('hidden');
        detailView.classList.remove('hidden');

        content.innerHTML = `
            <div class="master-detail-header">
                <img src="${master.photo || 'https://via.placeholder.com/400'}" class="master-detail-img">
                <div class="master-detail-info">
                    <h1>${escapeHtml(master.name)}</h1>
                    <div class="rating" style="font-size: 1.25rem; margin-bottom: 1rem;">★ ${master.rating}</div>
                    <p class="subtitle" style="text-align: left;">${escapeHtml(master.bio)}</p>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <div>
                    <h3>Услуги</h3>
                    <div style="margin-top: 1rem;">
                        ${master.services.map(s => `
                            <div class="service-item">
                                <div class="service-info">
                                    <h4>${escapeHtml(s.name)}</h4>
                                    <div class="service-meta">${s.duration} мин • ${s.price} ₽</div>
                                </div>
                                <button class="btn-primary" onclick="openBookingModal('${master.id}', '${s.id}')">Записаться</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3>Отзывы</h3>
                        <button class="btn-secondary" onclick="openReviewModal('${master.id}')">Оставить отзыв</button>
                    </div>
                    <div style="margin-top: 1rem;">
                        ${master.reviews.length > 0 ? master.reviews.map(r => `
                            <div style="padding: 1rem; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 1rem;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                    <strong>${escapeHtml(r.clientName)}</strong>
                                    <span style="color: #F59E0B;">★ ${r.rating}</span>
                                </div>
                                <p style="font-size: 0.875rem;">${escapeHtml(r.text)}</p>
                            </div>
                        `).join('') : '<p class="subtitle">Отзывов пока нет.</p>'}
                    </div>
                </div>
            </div>
        `;
    }
}

window.openReviewModal = (masterId) => {
    showModal('Оставить отзыв', `
        <form id="review-form">
            <div class="form-group">
                <label>Ваше имя</label>
                <input type="text" name="clientName" required>
            </div>
            <div class="form-group">
                <label>Оценка</label>
                <select name="rating" required>
                    <option value="5">5 звезд</option>
                    <option value="4">4 звезды</option>
                    <option value="3">3 звезды</option>
                    <option value="2">2 звезды</option>
                    <option value="1">1 звезда</option>
                </select>
            </div>
            <div class="form-group">
                <label>Ваш отзыв</label>
                <textarea name="text" rows="3" required></textarea>
            </div>
            <button type="submit" class="btn-primary" style="width: 100%;">Отправить</button>
        </form>
    `);

    document.getElementById('review-form').onsubmit = (e) => {
        e.preventDefault();
        const master = masters.find(m => m.id === masterId);
        const newReview = {
            clientName: e.target.clientName.value,
            rating: parseInt(e.target.rating.value),
            text: e.target.text.value
        };
        master.reviews.push(newReview);
        
        // Пересчет среднего рейтинга
        const totalRating = master.reviews.reduce((sum, r) => sum + r.rating, 0);
        master.rating = (totalRating / master.reviews.length).toFixed(1);
        
        saveData();
        hideModal();
        showMasterDetail(masterId); // Обновляем вид
    };
};

document.getElementById('btn-back-to-list').addEventListener('click', () => {
    document.getElementById('master-profile-detail').classList.add('hidden');
    document.getElementById('master-list-container').classList.remove('hidden');
});

window.openBookingModal = (masterId, serviceId) => {
    const master = masters.find(m => m.id === masterId);
    const service = master.services.find(s => s.id === serviceId);
    
    showModal('Запись на услугу', `
        <div style="margin-bottom: 1.5rem;">
            <strong>${escapeHtml(service.name)}</strong><br>
            <span class="subtitle">${service.duration} мин • ${service.price} ₽</span>
        </div>
        <form id="booking-form">
            <div class="form-group">
                <label>Ваше имя</label>
                <input type="text" name="clientName" required>
            </div>
            <div class="form-group">
                <label>Выберите дату и время</label>
                <select name="time" required>
                    <option value="Завтра, 10:00">Завтра, 10:00</option>
                    <option value="Завтра, 12:00">Завтра, 12:00</option>
                    <option value="Завтра, 15:00">Завтра, 15:00</option>
                    <option value="Послезавтра, 11:00">Послезавтра, 11:00</option>
                </select>
            </div>
            <button type="submit" class="btn-primary" style="width: 100%;">Забронировать</button>
        </form>
    `);

    document.getElementById('booking-form').onsubmit = (e) => {
        e.preventDefault();
        const newBooking = {
            id: 'b' + Date.now(),
            masterId: masterId,
            serviceId: serviceId,
            clientName: e.target.clientName.value,
            time: e.target.time.value,
            status: 'pending'
        };
        bookings.push(newBooking);
        saveData();
        hideModal();
        alert('Заявка отправлена! Мастер подтвердит запись в ближайшее время.');
    };
};

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showModal(title, content) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = content;
    document.getElementById('modal-container').classList.remove('hidden');
}

function hideModal() {
    document.getElementById('modal-container').classList.add('hidden');
}

document.querySelector('.modal-close').addEventListener('click', hideModal);
window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-container')) hideModal();
});

function saveData() {
    localStorage.setItem('sf_masters', JSON.stringify(masters));
    localStorage.setItem('sf_bookings', JSON.stringify(bookings));
}

// Инициализация при загрузке
setRole('client');
