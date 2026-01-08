// Справочники
const references = [
    'contractors', 'contact-persons', 'projects-list', 'milestones', 'stage-types', 'stages',
    'products-list', 'industries',
    'employees', 'roles', 'grades',
    'users', 'access-profiles'
];

// Навигация между разделами
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupNavigation();
    setupSubsectionNavigation();
    setupCRUD();
    loadAllData();
});

function initializeApp() {
    // Инициализация localStorage для каждого справочника
    references.forEach(ref => {
        if (!localStorage.getItem(ref)) {
            localStorage.setItem(ref, JSON.stringify([]));
        }
    });
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Убираем активный класс у всех ссылок и секций
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            // Добавляем активный класс к выбранной ссылке
            this.classList.add('active');
            
            // Показываем соответствующую секцию
            const targetSection = this.getAttribute('data-section');
            const section = document.getElementById(targetSection);
            if (section) {
                section.classList.add('active');
                // Активируем первый справочник в открытой секции
                const firstSubsection = section.querySelector('.sidebar-link');
                if (firstSubsection) {
                    activateSubsection(firstSubsection);
                }
            }
        });
    });
}

function setupSubsectionNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            activateSubsection(this);
        });
    });
}

function activateSubsection(link) {
    const section = link.closest('.content-section');
    const sidebarLinksInSection = section.querySelectorAll('.sidebar-link');
    const subsections = section.querySelectorAll('.subsection');
    
    // Убираем активный класс у всех ссылок и подсекций в текущей секции
    sidebarLinksInSection.forEach(l => l.classList.remove('active'));
    subsections.forEach(s => s.classList.remove('active'));
    
    // Добавляем активный класс к выбранной ссылке
    link.classList.add('active');
    
    // Показываем соответствующую подсекцию
    const targetSubsection = link.getAttribute('data-subsection');
    const subsection = section.querySelector(`#${targetSubsection}`);
    if (subsection) {
        subsection.classList.add('active');
        // Загружаем данные для активного справочника
        const reference = subsection.querySelector('[data-reference]')?.getAttribute('data-reference');
        if (reference) {
            renderTable(reference);
        }
    }
}

function setupCRUD() {
    // Обработчики для кнопок добавления
    document.querySelectorAll('[data-action="add"]').forEach(btn => {
        btn.addEventListener('click', function() {
            const reference = this.getAttribute('data-reference');
            openModal(reference);
        });
    });

    // Обработчики для модального окна
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.modal-close');
    const cancelBtn = document.getElementById('cancel-btn');
    const form = document.getElementById('item-form');

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        try {
            saveItem();
        } catch (error) {
            console.error('Ошибка при сохранении:', error);
            alert('Произошла ошибка при сохранении. Проверьте консоль для подробностей.');
        }
        return false;
    });
    
    // Также добавляем обработчик на кнопку напрямую на случай, если форма не сработает
    const saveButton = form.querySelector('button[type="submit"]');
    if (saveButton) {
        saveButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            try {
                saveItem();
            } catch (error) {
                console.error('Ошибка при сохранении:', error);
                alert('Произошла ошибка при сохранении. Проверьте консоль для подробностей.');
            }
            return false;
        });
    }

    // Закрытие по клику вне модального окна
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function openModal(reference, itemId = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('item-form');
    const standardForm = document.getElementById('standard-form');
    const contractorForm = document.getElementById('contractor-form');
    const contactPersonForm = document.getElementById('contact-person-form');
    const milestoneForm = document.getElementById('milestone-form');
    const stageForm = document.getElementById('stage-form');
    
    currentReference = reference;
    currentItemId = itemId;
    
    // Показываем нужную форму
    if (reference === 'contractors') {
        standardForm.style.display = 'none';
        contactPersonForm.style.display = 'none';
        milestoneForm.style.display = 'none';
        stageForm.style.display = 'none';
        contractorForm.style.display = 'block';
        setupContractorForm(itemId);
    } else if (reference === 'contact-persons') {
        standardForm.style.display = 'none';
        contractorForm.style.display = 'none';
        milestoneForm.style.display = 'none';
        stageForm.style.display = 'none';
        contactPersonForm.style.display = 'block';
        setupContactPersonForm(itemId);
    } else if (reference === 'milestones') {
        standardForm.style.display = 'none';
        contractorForm.style.display = 'none';
        contactPersonForm.style.display = 'none';
        stageForm.style.display = 'none';
        milestoneForm.style.display = 'block';
        setupMilestoneForm(itemId);
    } else if (reference === 'stages') {
        standardForm.style.display = 'none';
        contractorForm.style.display = 'none';
        contactPersonForm.style.display = 'none';
        milestoneForm.style.display = 'none';
        stageForm.style.display = 'block';
        setupStageForm(itemId);
    } else {
        standardForm.style.display = 'block';
        contractorForm.style.display = 'none';
        contactPersonForm.style.display = 'none';
        milestoneForm.style.display = 'none';
        stageForm.style.display = 'none';
        const nameInput = document.getElementById('item-name');
        
        if (itemId) {
            // Редактирование
            const items = getItems(reference);
            const item = items.find(i => i.id === itemId);
            if (item) {
                nameInput.value = item.name;
                modalTitle.textContent = 'Редактировать элемент';
            }
        } else {
            // Создание
            form.reset();
            modalTitle.textContent = 'Добавить элемент';
        }
        nameInput.focus();
    }
    
    modal.classList.add('active');
}

function setupMilestoneForm(itemId = null) {
    const nameInput = document.getElementById('milestone-name');
    const projectSelect = document.getElementById('milestone-project');
    const costInput = document.getElementById('milestone-cost');
    const startDateInput = document.getElementById('milestone-start-date');
    const endDateInput = document.getElementById('milestone-end-date');
    const stagesList = document.getElementById('milestone-stages-list');
    const newStageNameInput = document.getElementById('new-stage-name');
    const newStageTypeSelect = document.getElementById('new-stage-type');
    const newStageCostInput = document.getElementById('new-stage-cost');
    const newStageStartDateInput = document.getElementById('new-stage-start-date');
    const newStageEndDateInput = document.getElementById('new-stage-end-date');
    
    // Заполняем выпадающий список проектов
    const projects = getItems('projects-list');
    projectSelect.innerHTML = '<option value="">Выберите проект</option>';
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        projectSelect.appendChild(option);
    });
    
    // Заполняем выпадающий список видов этапов
    const stageTypes = getItems('stage-types');
    newStageTypeSelect.innerHTML = '<option value="">Выберите вид этапа</option>';
    stageTypes.forEach(stageType => {
        const option = document.createElement('option');
        option.value = stageType.id;
        option.textContent = stageType.name;
        newStageTypeSelect.appendChild(option);
    });
    
    // Очищаем список этапов
    stagesList.innerHTML = '';
    currentMilestoneStages = [];
    
    if (itemId) {
        // Редактирование
        const milestones = getItems('milestones');
        const milestone = milestones.find(m => m.id === itemId);
        if (milestone) {
            nameInput.value = milestone.name || '';
            projectSelect.value = milestone.projectId || '';
            costInput.value = milestone.cost !== null && milestone.cost !== undefined ? milestone.cost : '';
            startDateInput.value = milestone.startDate || '';
            endDateInput.value = milestone.endDate || '';
            
            if (milestone.stageIds && milestone.stageIds.length > 0) {
                const stages = getItems('stages');
                milestone.stageIds.forEach(stageId => {
                    const stage = stages.find(s => s.id === stageId);
                    if (stage) {
                        addStageToMilestoneList(stage.id, stage.name, stage.cost, stage.startDate, stage.endDate);
                    }
                });
            }
        }
    } else {
        // Создание
        nameInput.value = '';
        projectSelect.value = '';
        costInput.value = '';
        startDateInput.value = '';
        endDateInput.value = '';
    }
    
    // Обработчик добавления этапа
    document.getElementById('add-stage-to-milestone-btn').onclick = function() {
        const name = newStageNameInput.value.trim();
        const stageTypeId = newStageTypeSelect.value;
        const cost = newStageCostInput.value ? parseFloat(newStageCostInput.value) : null;
        const startDate = newStageStartDateInput.value || null;
        const endDate = newStageEndDateInput.value || null;
        
        if (!name) {
            alert('Введите наименование этапа');
            newStageNameInput.focus();
            return;
        }
        
        // Создаем новый этап
        const newStage = {
            id: Date.now().toString(),
            name: name,
            projectId: projectSelect.value || null,
            milestoneId: itemId || null, // Будет установлено при сохранении вехи
            stageTypeId: stageTypeId || null,
            cost: cost,
            startDate: startDate,
            endDate: endDate
        };
        
        // Сохраняем в справочник этапов
        const stages = getItems('stages');
        stages.push(newStage);
        saveItems('stages', stages);
        
        // Добавляем в список текущей вехи
        addStageToMilestoneList(newStage.id, newStage.name, newStage.cost, newStage.startDate, newStage.endDate);
        
        // Очищаем поля
        newStageNameInput.value = '';
        newStageTypeSelect.value = '';
        newStageCostInput.value = '';
        newStageStartDateInput.value = '';
        newStageEndDateInput.value = '';
    };
    
    // Обработчик кнопки проверки
    document.getElementById('check-milestone-btn').onclick = function() {
        checkMilestone();
    };
}

let currentMilestoneStages = [];

function addStageToMilestoneList(id, name, cost, startDate, endDate) {
    if (currentMilestoneStages.find(s => s.id === id)) {
        return; // Уже добавлено
    }
    
    currentMilestoneStages.push({ id, name, cost, startDate, endDate });
    
    const stagesList = document.getElementById('milestone-stages-list');
    const item = document.createElement('div');
    item.className = 'contact-person-item';
    
    const costText = cost !== null ? ` | Стоимость: ${cost.toFixed(2)}` : '';
    const startDateText = startDate ? ` | Начало: ${formatDate(startDate)}` : '';
    const endDateText = endDate ? ` | Окончание: ${formatDate(endDate)}` : '';
    
    item.innerHTML = `
        <div class="contact-person-info">
            <strong>${escapeHtml(name)}</strong>
            ${costText}${startDateText}${endDateText}
        </div>
        <button type="button" class="btn-remove" onclick="removeStageFromMilestone('${id}')">&times;</button>
    `;
    stagesList.appendChild(item);
}

function removeStageFromMilestone(id) {
    currentMilestoneStages = currentMilestoneStages.filter(s => s.id !== id);
    const stagesList = document.getElementById('milestone-stages-list');
    stagesList.innerHTML = '';
    currentMilestoneStages.forEach(s => {
        addStageToMilestoneList(s.id, s.name, s.cost, s.startDate, s.endDate);
    });
}

window.removeStageFromMilestone = removeStageFromMilestone;

function checkMilestone() {
    const costInput = document.getElementById('milestone-cost');
    const startDateInput = document.getElementById('milestone-start-date');
    const endDateInput = document.getElementById('milestone-end-date');
    
    const milestoneCost = costInput.value ? parseFloat(costInput.value) : 0;
    const milestoneStartDate = startDateInput.value || null;
    const milestoneEndDate = endDateInput.value || null;
    
    // Проверяем сумму стоимостей этапов
    const stagesCost = currentMilestoneStages.reduce((sum, stage) => {
        return sum + (stage.cost || 0);
    }, 0);
    
    // Проверяем даты
    let earliestStartDate = null;
    let latestEndDate = null;
    
    currentMilestoneStages.forEach(stage => {
        if (stage.startDate) {
            if (!earliestStartDate || stage.startDate < earliestStartDate) {
                earliestStartDate = stage.startDate;
            }
        }
        if (stage.endDate) {
            if (!latestEndDate || stage.endDate > latestEndDate) {
                latestEndDate = stage.endDate;
            }
        }
    });
    
    let errors = [];
    let warnings = [];
    
    // Проверка стоимости
    if (Math.abs(stagesCost - milestoneCost) > 0.01) {
        errors.push(`Сумма стоимостей этапов (${stagesCost.toFixed(2)}) не равна стоимости вехи (${milestoneCost.toFixed(2)})`);
    }
    
    // Проверка даты начала
    if (milestoneStartDate && earliestStartDate) {
        if (milestoneStartDate !== earliestStartDate) {
            errors.push(`Дата начала вехи (${formatDate(milestoneStartDate)}) не равна самой ранней дате начала этапов (${formatDate(earliestStartDate)})`);
        }
    } else if (milestoneStartDate && !earliestStartDate) {
        warnings.push('У вехи указана дата начала, но у этапов нет дат начала');
    } else if (!milestoneStartDate && earliestStartDate) {
        warnings.push('У этапов указаны даты начала, но у вехи нет даты начала');
    }
    
    // Проверка даты окончания
    if (milestoneEndDate && latestEndDate) {
        if (milestoneEndDate !== latestEndDate) {
            errors.push(`Дата окончания вехи (${formatDate(milestoneEndDate)}) не равна самой поздней дате окончания этапов (${formatDate(latestEndDate)})`);
        }
    } else if (milestoneEndDate && !latestEndDate) {
        warnings.push('У вехи указана дата окончания, но у этапов нет дат окончания');
    } else if (!milestoneEndDate && latestEndDate) {
        warnings.push('У этапов указаны даты окончания, но у вехи нет даты окончания');
    }
    
    // Выводим результаты
    if (errors.length === 0 && warnings.length === 0) {
        alert('Проверка пройдена успешно! Все данные согласованы.');
    } else {
        let message = '';
        if (errors.length > 0) {
            message += 'Ошибки:\n' + errors.join('\n') + '\n\n';
        }
        if (warnings.length > 0) {
            message += 'Предупреждения:\n' + warnings.join('\n');
        }
        alert(message);
    }
}

function setupContactPersonForm(itemId = null) {
    const nameInput = document.getElementById('contact-person-name');
    const phoneInput = document.getElementById('contact-person-phone');
    const emailInput = document.getElementById('contact-person-email');
    
    if (itemId) {
        // Редактирование
        const contactPersons = getItems('contact-persons');
        const contactPerson = contactPersons.find(cp => cp.id === itemId);
        if (contactPerson) {
            nameInput.value = contactPerson.name || '';
            phoneInput.value = contactPerson.phone || '';
            emailInput.value = contactPerson.email || '';
        }
    } else {
        // Создание
        nameInput.value = '';
        phoneInput.value = '';
        emailInput.value = '';
    }
}

function setupStageForm(itemId = null) {
    const nameInput = document.getElementById('stage-name');
    const projectSelect = document.getElementById('stage-project');
    const milestoneSelect = document.getElementById('stage-milestone');
    const stageTypeSelect = document.getElementById('stage-type');
    const costInput = document.getElementById('stage-cost');
    const startDateInput = document.getElementById('stage-start-date');
    const endDateInput = document.getElementById('stage-end-date');
    
    // Заполняем выпадающий список проектов
    const projects = getItems('projects-list');
    projectSelect.innerHTML = '<option value="">Выберите проект</option>';
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        projectSelect.appendChild(option);
    });
    
    // Заполняем выпадающий список видов этапов
    const stageTypes = getItems('stage-types');
    stageTypeSelect.innerHTML = '<option value="">Выберите вид этапа</option>';
    stageTypes.forEach(stageType => {
        const option = document.createElement('option');
        option.value = stageType.id;
        option.textContent = stageType.name;
        stageTypeSelect.appendChild(option);
    });
    
    // Обновляем список вех при изменении проекта
    projectSelect.addEventListener('change', function() {
        updateMilestonesList(this.value);
    });
    
    if (itemId) {
        // Редактирование
        const stages = getItems('stages');
        const stage = stages.find(s => s.id === itemId);
        if (stage) {
            nameInput.value = stage.name || '';
            projectSelect.value = stage.projectId || '';
            if (stage.projectId) {
                updateMilestonesList(stage.projectId);
                // Устанавливаем значение вехи после обновления списка
                setTimeout(() => {
                    milestoneSelect.value = stage.milestoneId || '';
                }, 100);
            }
            stageTypeSelect.value = stage.stageTypeId || '';
            costInput.value = stage.cost !== null && stage.cost !== undefined ? stage.cost : '';
            startDateInput.value = stage.startDate || '';
            endDateInput.value = stage.endDate || '';
        }
    } else {
        // Создание
        nameInput.value = '';
        projectSelect.value = '';
        milestoneSelect.innerHTML = '<option value="">Выберите веху</option>';
        stageTypeSelect.value = '';
        costInput.value = '';
        startDateInput.value = '';
        endDateInput.value = '';
    }
    
    // Обработчик кнопки автоматического формирования наименования
    document.getElementById('generate-stage-name-btn').onclick = function() {
        generateStageName();
    };
}

function updateMilestonesList(projectId) {
    const milestoneSelect = document.getElementById('stage-milestone');
    milestoneSelect.innerHTML = '<option value="">Выберите веху</option>';
    
    if (!projectId) {
        return;
    }
    
    const milestones = getItems('milestones');
    // Фильтруем вехи по проекту (если у вех есть связь с проектом)
    // Пока показываем все вехи, можно добавить фильтрацию позже
    milestones.forEach(milestone => {
        const option = document.createElement('option');
        option.value = milestone.id;
        option.textContent = milestone.name;
        milestoneSelect.appendChild(option);
    });
}

function generateStageName() {
    const projectSelect = document.getElementById('stage-project');
    const milestoneSelect = document.getElementById('stage-milestone');
    const stageTypeSelect = document.getElementById('stage-type');
    const nameInput = document.getElementById('stage-name');
    
    const projects = getItems('projects-list');
    const milestones = getItems('milestones');
    const stageTypes = getItems('stage-types');
    
    const project = projectSelect.value ? projects.find(p => p.id === projectSelect.value) : null;
    const milestone = milestoneSelect.value ? milestones.find(m => m.id === milestoneSelect.value) : null;
    const stageType = stageTypeSelect.value ? stageTypes.find(st => st.id === stageTypeSelect.value) : null;
    
    const parts = [];
    if (project) parts.push(project.name);
    if (milestone) parts.push(milestone.name);
    if (stageType) parts.push(stageType.name);
    
    if (parts.length > 0) {
        nameInput.value = parts.join(' ');
    } else {
        alert('Выберите проект, веху и вид этапа для автоматического формирования наименования');
    }
}

function setupContractorForm(itemId = null) {
    const nameInput = document.getElementById('contractor-name');
    const industrySelect = document.getElementById('contractor-industry');
    const contactPersonsList = document.getElementById('contact-persons-list');
    const newContactPersonNameInput = document.getElementById('new-contact-person-name');
    const newContactPersonPhoneInput = document.getElementById('new-contact-person-phone');
    const newContactPersonEmailInput = document.getElementById('new-contact-person-email');
    
    // Заполняем выпадающий список отраслей
    const industries = getItems('industries');
    industrySelect.innerHTML = '<option value="">Выберите отрасль</option>';
    industries.forEach(industry => {
        const option = document.createElement('option');
        option.value = industry.id;
        option.textContent = industry.name;
        industrySelect.appendChild(option);
    });
    
    // Очищаем список контактных лиц
    contactPersonsList.innerHTML = '';
    currentContactPersons = [];
    
    if (itemId) {
        // Редактирование
        const contractors = getItems('contractors');
        const contractor = contractors.find(c => c.id === itemId);
        if (contractor) {
            nameInput.value = contractor.name || '';
            industrySelect.value = contractor.industryId || '';
            
            if (contractor.contactPersonIds && contractor.contactPersonIds.length > 0) {
                const contactPersons = getItems('contact-persons');
                contractor.contactPersonIds.forEach(cpId => {
                    const cp = contactPersons.find(c => c.id === cpId);
                    if (cp) {
                        addContactPersonToList(cp.id, cp.name || '', cp.phone || null, cp.email || null);
                    }
                });
            }
        }
    } else {
        // Создание
        nameInput.value = '';
        industrySelect.value = '';
    }
    
    // Обработчик добавления контактного лица
    document.getElementById('add-contact-person-btn').onclick = function() {
        const name = newContactPersonNameInput.value.trim();
        const phone = newContactPersonPhoneInput.value.trim();
        const email = newContactPersonEmailInput.value.trim();
        
        if (!name) {
            alert('Введите ФИО контактного лица');
            newContactPersonNameInput.focus();
            return;
        }
        
        // Создаем новое контактное лицо
        const newContactPerson = {
            id: Date.now().toString(),
            name: name,
            phone: phone || null,
            email: email || null
        };
        
        // Сохраняем в справочник контактных лиц
        const contactPersons = getItems('contact-persons');
        contactPersons.push(newContactPerson);
        saveItems('contact-persons', contactPersons);
        
        // Добавляем в список текущего контрагента
        addContactPersonToList(newContactPerson.id, newContactPerson.name, newContactPerson.phone, newContactPerson.email);
        
        // Очищаем поля
        newContactPersonNameInput.value = '';
        newContactPersonPhoneInput.value = '';
        newContactPersonEmailInput.value = '';
    };
}

let currentContactPersons = [];

function addContactPersonToList(id, name, phone = null, email = null) {
    if (currentContactPersons.find(cp => cp.id === id)) {
        return; // Уже добавлено
    }
    
    currentContactPersons.push({ id, name, phone, email });
    
    const contactPersonsList = document.getElementById('contact-persons-list');
    const item = document.createElement('div');
    item.className = 'contact-person-item';
    
    const phoneText = phone ? ` | Тел: ${escapeHtml(phone)}` : '';
    const emailText = email ? ` | Email: ${escapeHtml(email)}` : '';
    
    item.innerHTML = `
        <div class="contact-person-info">
            <strong>${escapeHtml(name)}</strong>
            ${phoneText}${emailText}
        </div>
        <button type="button" class="btn-remove" onclick="removeContactPerson('${id}')">&times;</button>
    `;
    contactPersonsList.appendChild(item);
}

function removeContactPerson(id) {
    const cp = currentContactPersons.find(c => c.id === id);
    currentContactPersons = currentContactPersons.filter(cp => cp.id !== id);
    const contactPersonsList = document.getElementById('contact-persons-list');
    contactPersonsList.innerHTML = '';
    currentContactPersons.forEach(cp => {
        addContactPersonToList(cp.id, cp.name, cp.phone, cp.email);
    });
}

window.removeContactPerson = removeContactPerson;

function closeModal() {
    const modal = document.getElementById('modal');
    const form = document.getElementById('item-form');
    const standardForm = document.getElementById('standard-form');
    const contractorForm = document.getElementById('contractor-form');
    const contactPersonForm = document.getElementById('contact-person-form');
    const milestoneForm = document.getElementById('milestone-form');
    const stageForm = document.getElementById('stage-form');
    
    modal.classList.remove('active');
    form.reset();
    
    // Очищаем все поля
    document.getElementById('item-name').value = '';
    document.getElementById('contractor-name').value = '';
    document.getElementById('contractor-industry').value = '';
    document.getElementById('new-contact-person-name').value = '';
    document.getElementById('new-contact-person-phone').value = '';
    document.getElementById('new-contact-person-email').value = '';
    document.getElementById('contact-persons-list').innerHTML = '';
    document.getElementById('contact-person-name').value = '';
    document.getElementById('contact-person-phone').value = '';
    document.getElementById('contact-person-email').value = '';
    document.getElementById('stage-name').value = '';
    document.getElementById('stage-project').value = '';
    document.getElementById('stage-milestone').value = '';
    document.getElementById('stage-type').value = '';
    document.getElementById('stage-cost').value = '';
    document.getElementById('stage-start-date').value = '';
    document.getElementById('stage-end-date').value = '';
    document.getElementById('milestone-name').value = '';
    document.getElementById('milestone-project').value = '';
    document.getElementById('milestone-cost').value = '';
    document.getElementById('milestone-start-date').value = '';
    document.getElementById('milestone-end-date').value = '';
    document.getElementById('milestone-stages-list').innerHTML = '';
    document.getElementById('new-stage-name').value = '';
    document.getElementById('new-stage-type').value = '';
    document.getElementById('new-stage-cost').value = '';
    document.getElementById('new-stage-start-date').value = '';
    document.getElementById('new-stage-end-date').value = '';
    
    // Сбрасываем отображение форм
    standardForm.style.display = 'block';
    contractorForm.style.display = 'none';
    contactPersonForm.style.display = 'none';
    milestoneForm.style.display = 'none';
    stageForm.style.display = 'none';
    
    currentReference = null;
    currentItemId = null;
    currentContactPersons = [];
    currentMilestoneStages = [];
}

let currentReference = null;
let currentItemId = null;

function saveItem() {
    if (!currentReference) {
        console.error('currentReference не установлен');
        return;
    }
    
    let items = getItems(currentReference);
    
    if (currentReference === 'contact-persons') {
        // Специальная обработка для контактных лиц
        const nameInput = document.getElementById('contact-person-name');
        const phoneInput = document.getElementById('contact-person-phone');
        const emailInput = document.getElementById('contact-person-email');
        
        if (!nameInput) {
            console.error('Поле contact-person-name не найдено');
            return;
        }
        
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const email = emailInput.value.trim();
        
        if (!name) {
            alert('Пожалуйста, введите ФИО');
            nameInput.focus();
            return;
        }
        
        const contactPersonData = {
            id: currentItemId || Date.now().toString(),
            name: name,
            phone: phone || null,
            email: email || null
        };
        
        if (currentItemId) {
            // Редактирование
            const itemIndex = items.findIndex(i => i.id === currentItemId);
            if (itemIndex !== -1) {
                items[itemIndex] = contactPersonData;
            }
        } else {
            // Создание
            items.push(contactPersonData);
        }
    } else if (currentReference === 'milestones') {
        // Специальная обработка для вех
        const nameInput = document.getElementById('milestone-name');
        const projectSelect = document.getElementById('milestone-project');
        const costInput = document.getElementById('milestone-cost');
        const startDateInput = document.getElementById('milestone-start-date');
        const endDateInput = document.getElementById('milestone-end-date');
        
        if (!nameInput) {
            console.error('Поле milestone-name не найдено');
            return;
        }
        
        const name = nameInput.value.trim();
        const projectId = projectSelect.value || null;
        const cost = costInput.value ? parseFloat(costInput.value) : null;
        const startDate = startDateInput.value || null;
        const endDate = endDateInput.value || null;
        
        if (!name) {
            alert('Пожалуйста, введите наименование');
            nameInput.focus();
            return;
        }
        
        // Обновляем milestoneId для всех этапов
        const stages = getItems('stages');
        currentMilestoneStages.forEach(ms => {
            const stageIndex = stages.findIndex(s => s.id === ms.id);
            if (stageIndex !== -1) {
                stages[stageIndex].milestoneId = currentItemId || Date.now().toString();
                stages[stageIndex].projectId = projectId;
            }
        });
        saveItems('stages', stages);
        
        const milestoneData = {
            id: currentItemId || Date.now().toString(),
            name: name,
            projectId: projectId,
            cost: cost,
            startDate: startDate,
            endDate: endDate,
            stageIds: currentMilestoneStages.map(s => s.id)
        };
        
        if (currentItemId) {
            // Редактирование
            const itemIndex = items.findIndex(i => i.id === currentItemId);
            if (itemIndex !== -1) {
                items[itemIndex] = milestoneData;
            }
        } else {
            // Создание
            items.push(milestoneData);
        }
    } else if (currentReference === 'contractors') {
        // Специальная обработка для контрагентов
        const nameInput = document.getElementById('contractor-name');
        if (!nameInput) {
            console.error('Поле contractor-name не найдено');
            return;
        }
        const industrySelect = document.getElementById('contractor-industry');
        const name = nameInput.value.trim();
        
        if (!name) {
            alert('Пожалуйста, введите наименование');
            nameInput.focus();
            return;
        }
        
        const contractorData = {
            id: currentItemId || Date.now().toString(),
            name: name,
            industryId: industrySelect.value || null,
            contactPersonIds: currentContactPersons.map(cp => cp.id)
        };
        
        if (currentItemId) {
            // Редактирование
            const itemIndex = items.findIndex(i => i.id === currentItemId);
            if (itemIndex !== -1) {
                items[itemIndex] = contractorData;
            }
        } else {
            // Создание
            items.push(contractorData);
        }
    } else if (currentReference === 'stages') {
        // Специальная обработка для этапов
        const nameInput = document.getElementById('stage-name');
        const projectSelect = document.getElementById('stage-project');
        const milestoneSelect = document.getElementById('stage-milestone');
        const stageTypeSelect = document.getElementById('stage-type');
        const costInput = document.getElementById('stage-cost');
        const startDateInput = document.getElementById('stage-start-date');
        const endDateInput = document.getElementById('stage-end-date');
        
        if (!nameInput) {
            console.error('Поле stage-name не найдено');
            return;
        }
        
        const name = nameInput.value.trim();
        const projectId = projectSelect.value || null;
        const milestoneId = milestoneSelect.value || null;
        const stageTypeId = stageTypeSelect.value || null;
        const cost = costInput.value ? parseFloat(costInput.value) : null;
        const startDate = startDateInput.value || null;
        const endDate = endDateInput.value || null;
        
        if (!name) {
            alert('Пожалуйста, введите наименование');
            nameInput.focus();
            return;
        }
        
        const stageData = {
            id: currentItemId || Date.now().toString(),
            name: name,
            projectId: projectId,
            milestoneId: milestoneId,
            stageTypeId: stageTypeId,
            cost: cost,
            startDate: startDate,
            endDate: endDate
        };
        
        if (currentItemId) {
            // Редактирование
            const itemIndex = items.findIndex(i => i.id === currentItemId);
            if (itemIndex !== -1) {
                items[itemIndex] = stageData;
            }
        } else {
            // Создание
            items.push(stageData);
        }
    } else {
        // Стандартная обработка для остальных справочников
        const nameInput = document.getElementById('item-name');
        if (!nameInput) {
            console.error('Поле item-name не найдено');
            return;
        }
        const name = nameInput.value.trim();
        
        if (!name) {
            alert('Пожалуйста, введите наименование');
            nameInput.focus();
            return;
        }
        
        if (currentItemId) {
            // Редактирование
            const itemIndex = items.findIndex(i => i.id === currentItemId);
            if (itemIndex !== -1) {
                items[itemIndex].name = name;
            }
        } else {
            // Создание
            const newItem = {
                id: Date.now().toString(),
                name: name
            };
            items.push(newItem);
        }
    }
    
    try {
        saveItems(currentReference, items);
        renderTable(currentReference);
        
        // Если сохраняли контрагента, обновляем таблицу контактных лиц, если она видна
        if (currentReference === 'contractors') {
            const contactPersonsSubsection = document.getElementById('contact-persons');
            if (contactPersonsSubsection && contactPersonsSubsection.classList.contains('active')) {
                renderTable('contact-persons');
            }
        }
        
        closeModal();
    } catch (error) {
        console.error('Ошибка при сохранении данных:', error);
        alert('Произошла ошибка при сохранении данных. Проверьте консоль для подробностей.');
    }
}

function deleteItem(reference, itemId) {
    if (!confirm('Вы уверены, что хотите удалить этот элемент?')) {
        return;
    }
    
    let items = getItems(reference);
    items = items.filter(i => i.id !== itemId);
    saveItems(reference, items);
    renderTable(reference);
}

function getItems(reference) {
    const data = localStorage.getItem(reference);
    return data ? JSON.parse(data) : [];
}

function saveItems(reference, items) {
    localStorage.setItem(reference, JSON.stringify(items));
}

function renderTable(reference) {
    const items = getItems(reference);
    const tbodyId = `${reference}-table-body`;
    const tbody = document.getElementById(tbodyId);
    
    if (!tbody) {
        return;
    }
    
    if (items.length === 0) {
        let colCount = 2;
        if (reference === 'contractors') {
            colCount = 4;
        } else if (reference === 'contact-persons') {
            colCount = 4;
        } else if (reference === 'milestones') {
            colCount = 6;
        } else if (reference === 'stages') {
            colCount = 7;
        }
        tbody.innerHTML = `
            <tr>
                <td colspan="${colCount}" class="empty-message">Список пуст. Добавьте первый элемент.</td>
            </tr>
        `;
        return;
    }
    
    if (reference === 'contractors') {
        // Специальный рендеринг для контрагентов
        const industries = getItems('industries');
        const contactPersons = getItems('contact-persons');
        tbody.innerHTML = items.map(item => {
            const industry = item.industryId ? industries.find(i => i.id === item.industryId) : null;
            const industryName = industry ? industry.name : '-';
            
            // Получаем контактные лица для этого контрагента
            let contactPersonsList = '-';
            if (item.contactPersonIds && item.contactPersonIds.length > 0) {
                const cps = item.contactPersonIds.map(cpId => {
                    const cp = contactPersons.find(c => c.id === cpId);
                    return cp ? cp.name : null;
                }).filter(cp => cp !== null);
                contactPersonsList = cps.length > 0 ? cps.join(', ') : '-';
            }
            
            return `
                <tr>
                    <td>${escapeHtml(item.name)}</td>
                    <td>${escapeHtml(industryName)}</td>
                    <td>${escapeHtml(contactPersonsList)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-edit" onclick="editItem('${reference}', '${item.id}')">Редактировать</button>
                            <button class="btn-delete" onclick="deleteItem('${reference}', '${item.id}')">Удалить</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } else if (reference === 'contact-persons') {
        // Специальный рендеринг для контактных лиц
        tbody.innerHTML = items.map(item => {
            const phone = item.phone || '-';
            const email = item.email || '-';
            return `
                <tr>
                    <td>${escapeHtml(item.name)}</td>
                    <td>${escapeHtml(phone)}</td>
                    <td>${escapeHtml(email)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-edit" onclick="editItem('${reference}', '${item.id}')">Редактировать</button>
                            <button class="btn-delete" onclick="deleteItem('${reference}', '${item.id}')">Удалить</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } else if (reference === 'milestones') {
        // Специальный рендеринг для вех
        const projects = getItems('projects-list');
        tbody.innerHTML = items.map(item => {
            const project = item.projectId ? projects.find(p => p.id === item.projectId) : null;
            const projectName = project ? project.name : '-';
            const cost = item.cost !== null && item.cost !== undefined ? item.cost.toFixed(2) : '-';
            const startDate = item.startDate ? formatDate(item.startDate) : '-';
            const endDate = item.endDate ? formatDate(item.endDate) : '-';
            return `
                <tr>
                    <td>${escapeHtml(item.name)}</td>
                    <td>${escapeHtml(projectName)}</td>
                    <td>${escapeHtml(cost)}</td>
                    <td>${escapeHtml(startDate)}</td>
                    <td>${escapeHtml(endDate)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-edit" onclick="editItem('${reference}', '${item.id}')">Редактировать</button>
                            <button class="btn-delete" onclick="deleteItem('${reference}', '${item.id}')">Удалить</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } else if (reference === 'stages') {
        // Специальный рендеринг для этапов
        const milestones = getItems('milestones');
        const stageTypes = getItems('stage-types');
        tbody.innerHTML = items.map(item => {
            const milestone = item.milestoneId ? milestones.find(m => m.id === item.milestoneId) : null;
            const milestoneName = milestone ? milestone.name : '-';
            const stageType = item.stageTypeId ? stageTypes.find(st => st.id === item.stageTypeId) : null;
            const stageTypeName = stageType ? stageType.name : '-';
            const cost = item.cost !== null && item.cost !== undefined ? item.cost.toFixed(2) : '-';
            const startDate = item.startDate ? formatDate(item.startDate) : '-';
            const endDate = item.endDate ? formatDate(item.endDate) : '-';
            return `
                <tr>
                    <td>${escapeHtml(item.name)}</td>
                    <td>${escapeHtml(milestoneName)}</td>
                    <td>${escapeHtml(stageTypeName)}</td>
                    <td>${escapeHtml(cost)}</td>
                    <td>${escapeHtml(startDate)}</td>
                    <td>${escapeHtml(endDate)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-edit" onclick="editItem('${reference}', '${item.id}')">Редактировать</button>
                            <button class="btn-delete" onclick="deleteItem('${reference}', '${item.id}')">Удалить</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } else {
        // Стандартный рендеринг для остальных справочников
        tbody.innerHTML = items.map(item => `
            <tr>
                <td>${escapeHtml(item.name)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editItem('${reference}', '${item.id}')">Редактировать</button>
                        <button class="btn-delete" onclick="deleteItem('${reference}', '${item.id}')">Удалить</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
}

function editItem(reference, itemId) {
    openModal(reference, itemId);
}

// Делаем функции доступными глобально для onclick
window.editItem = editItem;
window.deleteItem = deleteItem;

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

function loadAllData() {
    // Загружаем данные для активного справочника при загрузке страницы
    const activeSubsection = document.querySelector('.subsection.active');
    if (activeSubsection) {
        const reference = activeSubsection.querySelector('[data-reference]')?.getAttribute('data-reference');
        if (reference) {
            renderTable(reference);
        }
    }
}
