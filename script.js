// Справочники
const references = [
    'contractors', 'contact-persons', 'projects-list', 'milestones', 'stage-types', 'stages',
    'products-list', 'industries',
    'employees', 'roles', 'grades',
    'users', 'access-profiles',
    'stage-start', 'stage-completion'
];

// Навигация между разделами
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupNavigation();
    setupSubsectionNavigation();
    setupCRUD();
    setupARMNavigation();
    setupReports();
    loadAllData();
    
    // Инициализация активной подсистемы при загрузке
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection) {
        const firstSublink = activeSection.querySelector('.sidebar-sublink');
        if (firstSublink) {
            const group = firstSublink.closest('.sidebar-group');
            if (group) {
                group.classList.add('active');
                const groupTitle = group.querySelector('.sidebar-group-title');
                if (groupTitle) {
                    groupTitle.classList.add('active');
                }
            }
            activateSubsection(firstSublink);
        }
    }
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
                const firstSublink = section.querySelector('.sidebar-sublink');
                if (firstSublink) {
                    // Активируем группу
                    const group = firstSublink.closest('.sidebar-group');
                    if (group) {
                        group.classList.add('active');
                        const groupTitle = group.querySelector('.sidebar-group-title');
                        if (groupTitle) {
                            groupTitle.classList.add('active');
                        }
                    }
                    activateSubsection(firstSublink);
                } else {
                    // Если нет подссылок, активируем первый раздел
                    const firstLink = section.querySelector('.sidebar-link');
                    if (firstLink) {
                        activateSubsection(firstLink);
                    }
                }
            }
        });
    });
}

function setupSubsectionNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const sidebarSublinks = document.querySelectorAll('.sidebar-sublink');
    
    // Обработчики для основных разделов (Справочники, Документы, АРМы, Отчеты)
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            // Если это группа со справочниками, не переключаем, только раскрываем/сворачиваем
            if (this.classList.contains('sidebar-group-title')) {
                const group = this.closest('.sidebar-group');
                const section = this.closest('.content-section');
                const allGroups = section.querySelectorAll('.sidebar-group');
                
                // Переключаем активность группы
                allGroups.forEach(g => g.classList.remove('active'));
                group.classList.add('active');
                
                // Активируем первую подссылку в группе, если группа активна
                if (group.classList.contains('active')) {
                    const firstSublink = group.querySelector('.sidebar-sublink');
                    if (firstSublink) {
                        activateSubsection(firstSublink);
                    } else {
                        // Если нет подссылок, активируем раздел напрямую
                        activateSubsection(this);
                    }
                }
            } else {
                activateSubsection(this);
            }
        });
    });
    
    // Обработчики для подссылок (справочников внутри групп)
    sidebarSublinks.forEach(sublink => {
        sublink.addEventListener('click', function(e) {
            e.preventDefault();
            activateSubsection(this);
        });
    });
}

function activateSubsection(link) {
    const section = link.closest('.content-section');
    const sidebarLinksInSection = section.querySelectorAll('.sidebar-link');
    const sidebarSublinksInSection = section.querySelectorAll('.sidebar-sublink');
    const subsections = section.querySelectorAll('.subsection');
    
    // Убираем активный класс у всех ссылок и подсекций в текущей секции
    sidebarLinksInSection.forEach(l => l.classList.remove('active'));
    sidebarSublinksInSection.forEach(s => s.classList.remove('active'));
    subsections.forEach(s => s.classList.remove('active'));
    
    // Если это подссылка, активируем родительскую группу
    if (link.classList.contains('sidebar-sublink')) {
        const group = link.closest('.sidebar-group');
        if (group) {
            const groupTitle = group.querySelector('.sidebar-group-title');
            if (groupTitle) {
                groupTitle.classList.add('active');
                group.classList.add('active');
            }
        }
    }
    
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
    const projectForm = document.getElementById('project-form');
    const milestoneForm = document.getElementById('milestone-form');
    const stageForm = document.getElementById('stage-form');
    const stageTypeForm = document.getElementById('stage-type-form');
    const stageStartForm = document.getElementById('stage-start-form');
    const stageCompletionForm = document.getElementById('stage-completion-form');
    
    currentReference = reference;
    currentItemId = itemId;
    
    // Скрываем все формы сначала
    standardForm.style.display = 'none';
    contractorForm.style.display = 'none';
    contactPersonForm.style.display = 'none';
    projectForm.style.display = 'none';
    milestoneForm.style.display = 'none';
    stageForm.style.display = 'none';
    if (stageTypeForm) stageTypeForm.style.display = 'none';
    if (stageStartForm) stageStartForm.style.display = 'none';
    if (stageCompletionForm) stageCompletionForm.style.display = 'none';
    
    // Показываем нужную форму
    if (reference === 'contractors') {
        contractorForm.style.display = 'block';
        setupContractorForm(itemId);
    } else if (reference === 'contact-persons') {
        contactPersonForm.style.display = 'block';
        setupContactPersonForm(itemId);
    } else if (reference === 'projects-list') {
        projectForm.style.display = 'block';
        setupProjectForm(itemId);
    } else if (reference === 'milestones') {
        milestoneForm.style.display = 'block';
        setupMilestoneForm(itemId);
    } else if (reference === 'stages') {
        stageForm.style.display = 'block';
        setupStageForm(itemId);
    } else if (reference === 'stage-types') {
        if (stageTypeForm) {
            stageTypeForm.style.display = 'block';
            setupStageTypeForm(itemId);
        }
    } else if (reference === 'stage-start') {
        if (stageStartForm) {
            stageStartForm.style.display = 'block';
            setupStageStartForm(itemId);
        }
    } else if (reference === 'stage-completion') {
        if (stageCompletionForm) {
            stageCompletionForm.style.display = 'block';
            setupStageCompletionForm(itemId);
        }
    } else {
        standardForm.style.display = 'block';
        contractorForm.style.display = 'none';
        contactPersonForm.style.display = 'none';
        projectForm.style.display = 'none';
        milestoneForm.style.display = 'none';
        stageForm.style.display = 'none';
        if (stageTypeForm) stageTypeForm.style.display = 'none';
        const nameInput = document.getElementById('item-name');
        
        if (itemId) {
            // Редактирование
            const items = getItems(reference);
            const item = items.find(i => i.id === itemId);
            if (item) {
                nameInput.value = item.name || item.name || '';
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

function setupProjectForm(itemId = null) {
    const nameInput = document.getElementById('project-name');
    const contractorSelect = document.getElementById('project-contractor');
    const costInput = document.getElementById('project-cost');
    const startDateInput = document.getElementById('project-start-date');
    const endDateInput = document.getElementById('project-end-date');
    const milestonesList = document.getElementById('project-milestones-list');
    const newMilestoneNameInput = document.getElementById('new-milestone-name');
    const newMilestoneCostInput = document.getElementById('new-milestone-cost');
    const newMilestoneStartDateInput = document.getElementById('new-milestone-start-date');
    const newMilestoneEndDateInput = document.getElementById('new-milestone-end-date');
    
    // Заполняем выпадающий список контрагентов
    const contractors = getItems('contractors');
    contractorSelect.innerHTML = '<option value="">Выберите контрагента</option>';
    contractors.forEach(contractor => {
        const option = document.createElement('option');
        option.value = contractor.id;
        option.textContent = contractor.name;
        contractorSelect.appendChild(option);
    });
    
    // Очищаем список вех
    milestonesList.innerHTML = '';
    currentProjectMilestones = [];
    
    if (itemId) {
        // Редактирование
        const projects = getItems('projects-list');
        const project = projects.find(p => p.id === itemId);
        if (project) {
            nameInput.value = project.name || '';
            contractorSelect.value = project.contractorId || '';
            costInput.value = project.cost !== null && project.cost !== undefined ? project.cost : '';
            startDateInput.value = project.startDate || '';
            endDateInput.value = project.endDate || '';
            
            if (project.milestoneIds && project.milestoneIds.length > 0) {
                const milestones = getItems('milestones');
                project.milestoneIds.forEach(milestoneId => {
                    const milestone = milestones.find(m => m.id === milestoneId);
                    if (milestone) {
                        addMilestoneToProjectList(milestone.id, milestone.name, milestone.cost, milestone.startDate, milestone.endDate);
                    }
                });
            }
        }
    } else {
        // Создание
        nameInput.value = '';
        contractorSelect.value = '';
        costInput.value = '';
        startDateInput.value = '';
        endDateInput.value = '';
    }
    
    // Обработчик добавления вехи
    document.getElementById('add-milestone-to-project-btn').onclick = function() {
        const name = newMilestoneNameInput.value.trim();
        const cost = newMilestoneCostInput.value ? parseFloat(newMilestoneCostInput.value) : null;
        const startDate = newMilestoneStartDateInput.value || null;
        const endDate = newMilestoneEndDateInput.value || null;
        
        if (!name) {
            alert('Введите наименование вехи');
            newMilestoneNameInput.focus();
            return;
        }
        
        // Создаем новую веху
        const newMilestone = {
            id: Date.now().toString(),
            name: name,
            projectId: itemId || null, // Будет установлено при сохранении проекта
            cost: cost,
            startDate: startDate,
            endDate: endDate,
            stageIds: []
        };
        
        // Сохраняем в справочник вех
        const milestones = getItems('milestones');
        milestones.push(newMilestone);
        saveItems('milestones', milestones);
        
        // Добавляем в список текущего проекта
        addMilestoneToProjectList(newMilestone.id, newMilestone.name, newMilestone.cost, newMilestone.startDate, newMilestone.endDate);
        
        // Очищаем поля
        newMilestoneNameInput.value = '';
        newMilestoneCostInput.value = '';
        newMilestoneStartDateInput.value = '';
        newMilestoneEndDateInput.value = '';
    };
    
    // Инициализация вкладок
    const tabButtons = document.querySelectorAll('#project-form .tab-btn');
    const tabContents = document.querySelectorAll('#project-form .tab-content');
    
    // Сначала сбрасываем все вкладки
    tabButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    // Активируем первую вкладку
    if (tabButtons.length > 0 && tabContents.length > 0) {
        tabButtons[0].classList.add('active');
        tabContents[0].classList.add('active');
    }
    
    // Добавляем обработчики переключения вкладок
    tabButtons.forEach(btn => {
        // Удаляем старые обработчики, если они есть
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Добавляем обработчик на новый элемент
        newBtn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Получаем актуальные элементы после возможных изменений
            const allTabButtons = document.querySelectorAll('#project-form .tab-btn');
            const allTabContents = document.querySelectorAll('#project-form .tab-content');
            
            // Убираем активный класс у всех кнопок и контента
            allTabButtons.forEach(b => b.classList.remove('active'));
            allTabContents.forEach(c => c.classList.remove('active'));
            
            // Добавляем активный класс к выбранной кнопке и контенту
            this.classList.add('active');
            const targetContent = document.getElementById(targetTab + '-tab');
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

let currentProjectMilestones = [];

function addMilestoneToProjectList(id, name, cost, startDate, endDate) {
    if (currentProjectMilestones.find(m => m.id === id)) {
        return; // Уже добавлено
    }
    
    currentProjectMilestones.push({ id, name, cost, startDate, endDate });
    
    const milestonesList = document.getElementById('project-milestones-list');
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
        <button type="button" class="btn-remove" onclick="removeMilestoneFromProject('${id}')">&times;</button>
    `;
    milestonesList.appendChild(item);
}

function removeMilestoneFromProject(id) {
    currentProjectMilestones = currentProjectMilestones.filter(m => m.id !== id);
    const milestonesList = document.getElementById('project-milestones-list');
    milestonesList.innerHTML = '';
    currentProjectMilestones.forEach(m => {
        addMilestoneToProjectList(m.id, m.name, m.cost, m.startDate, m.endDate);
    });
}

window.removeMilestoneFromProject = removeMilestoneFromProject;

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
    
    // Инициализация вкладок
    const tabButtons = document.querySelectorAll('#milestone-form .tab-btn');
    const tabContents = document.querySelectorAll('#milestone-form .tab-content');
    
    // Сначала сбрасываем все вкладки
    tabButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    // Активируем первую вкладку
    if (tabButtons.length > 0 && tabContents.length > 0) {
        tabButtons[0].classList.add('active');
        tabContents[0].classList.add('active');
    }
    
    // Добавляем обработчики переключения вкладок
    tabButtons.forEach(btn => {
        // Удаляем старые обработчики, если они есть
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Добавляем обработчик на новый элемент
        newBtn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Получаем актуальные элементы после возможных изменений
            const allTabButtons = document.querySelectorAll('#milestone-form .tab-btn');
            const allTabContents = document.querySelectorAll('#milestone-form .tab-content');
            
            // Убираем активный класс у всех кнопок и контента
            allTabButtons.forEach(b => b.classList.remove('active'));
            allTabContents.forEach(c => c.classList.remove('active'));
            
            // Добавляем активный класс к выбранной кнопке и контенту
            this.classList.add('active');
            const targetContent = document.getElementById(targetTab + '-tab');
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
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

function setupStageTypeForm(itemId = null) {
    const nameInput = document.getElementById('stage-type-name');
    const requiredRolesSelect = document.getElementById('stage-type-required-roles');
    
    // Заполняем выпадающий список ролей
    const roles = getItems('roles');
    requiredRolesSelect.innerHTML = '<option value="">Выберите роли</option>';
    roles.forEach(role => {
        const option = document.createElement('option');
        option.value = role.id;
        option.textContent = role.name;
        requiredRolesSelect.appendChild(option);
    });
    
    if (itemId) {
        // Редактирование
        const stageTypes = getItems('stage-types');
        const stageType = stageTypes.find(st => st.id === itemId);
        if (stageType) {
            nameInput.value = stageType.name || '';
            // Устанавливаем выбранные роли
            if (stageType.requiredRoleIds && stageType.requiredRoleIds.length > 0) {
                Array.from(requiredRolesSelect.options).forEach(option => {
                    if (stageType.requiredRoleIds.includes(option.value)) {
                        option.selected = true;
                    }
                });
            }
        }
    } else {
        // Создание
        nameInput.value = '';
        requiredRolesSelect.selectedIndex = -1;
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
    const projectForm = document.getElementById('project-form');
    const milestoneForm = document.getElementById('milestone-form');
    const stageForm = document.getElementById('stage-form');
    const stageStartForm = document.getElementById('stage-start-form');
    const stageCompletionForm = document.getElementById('stage-completion-form');
    
    modal.classList.remove('active');
    form.reset();
    
    // Скрываем все формы
    if (standardForm) standardForm.style.display = 'none';
    if (contractorForm) contractorForm.style.display = 'none';
    if (contactPersonForm) contactPersonForm.style.display = 'none';
    if (projectForm) projectForm.style.display = 'none';
    if (milestoneForm) milestoneForm.style.display = 'none';
    if (stageForm) stageForm.style.display = 'none';
    if (stageStartForm) stageStartForm.style.display = 'none';
    if (stageCompletionForm) stageCompletionForm.style.display = 'none';
    
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
    if (document.getElementById('project-name')) {
        document.getElementById('project-name').value = '';
        document.getElementById('project-contractor').value = '';
        document.getElementById('project-cost').value = '';
        document.getElementById('project-start-date').value = '';
        document.getElementById('project-end-date').value = '';
        document.getElementById('project-milestones-list').innerHTML = '';
        document.getElementById('new-milestone-name').value = '';
        document.getElementById('new-milestone-cost').value = '';
        document.getElementById('new-milestone-start-date').value = '';
        document.getElementById('new-milestone-end-date').value = '';
    }
    document.getElementById('milestone-name').value = '';
    document.getElementById('milestone-project').value = '';
    document.getElementById('milestone-cost').value = '';
    document.getElementById('milestone-start-date').value = '';
    document.getElementById('milestone-end-date').value = '';
    document.getElementById('milestone-stages-list').innerHTML = '';
    document.getElementById('new-stage-name').value = '';
    
    // Очищаем поля документов
    if (document.getElementById('stage-start-project')) {
        document.getElementById('stage-start-project').value = '';
        document.getElementById('stage-start-milestone').value = '';
        document.getElementById('stage-start-stage').value = '';
        document.getElementById('stage-start-actual-date').value = '';
        document.getElementById('stage-start-team-list').innerHTML = '';
        document.getElementById('stage-start-role').value = '';
        document.getElementById('stage-start-employee').value = '';
    }
    if (document.getElementById('stage-completion-project')) {
        document.getElementById('stage-completion-project').value = '';
        document.getElementById('stage-completion-milestone').value = '';
        document.getElementById('stage-completion-stage').value = '';
        document.getElementById('stage-completion-actual-date').value = '';
        document.getElementById('stage-completion-team-list').innerHTML = '';
        document.getElementById('stage-completion-role').value = '';
        document.getElementById('stage-completion-employee').value = '';
    }
    currentTeamMembers = [];
    document.getElementById('new-stage-type').value = '';
    document.getElementById('new-stage-cost').value = '';
    document.getElementById('new-stage-start-date').value = '';
    document.getElementById('new-stage-end-date').value = '';
    
    // Сбрасываем отображение форм
    standardForm.style.display = 'block';
    contractorForm.style.display = 'none';
    contactPersonForm.style.display = 'none';
    if (projectForm) projectForm.style.display = 'none';
    if (milestoneForm) milestoneForm.style.display = 'none';
    stageForm.style.display = 'none';
    
    currentReference = null;
    currentItemId = null;
    currentContactPersons = [];
    currentProjectMilestones = [];
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
    } else if (currentReference === 'projects-list') {
        // Специальная обработка для проектов
        const nameInput = document.getElementById('project-name');
        const contractorSelect = document.getElementById('project-contractor');
        const costInput = document.getElementById('project-cost');
        const startDateInput = document.getElementById('project-start-date');
        const endDateInput = document.getElementById('project-end-date');
        
        if (!nameInput) {
            console.error('Поле project-name не найдено');
            return;
        }
        
        const name = nameInput.value.trim();
        const contractorId = contractorSelect.value || null;
        const cost = costInput.value ? parseFloat(costInput.value) : null;
        const startDate = startDateInput.value || null;
        const endDate = endDateInput.value || null;
        
        if (!name) {
            alert('Пожалуйста, введите наименование');
            nameInput.focus();
            return;
        }
        
        // Обновляем projectId для всех вех
        const milestones = getItems('milestones');
        currentProjectMilestones.forEach(pm => {
            const milestoneIndex = milestones.findIndex(m => m.id === pm.id);
            if (milestoneIndex !== -1) {
                milestones[milestoneIndex].projectId = currentItemId || Date.now().toString();
            }
        });
        saveItems('milestones', milestones);
        
        const projectData = {
            id: currentItemId || Date.now().toString(),
            name: name,
            contractorId: contractorId,
            cost: cost,
            startDate: startDate,
            endDate: endDate,
            milestoneIds: currentProjectMilestones.map(m => m.id)
        };
        
        if (currentItemId) {
            // Редактирование
            const itemIndex = items.findIndex(i => i.id === currentItemId);
            if (itemIndex !== -1) {
                items[itemIndex] = projectData;
            }
        } else {
            // Создание
            items.push(projectData);
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
    } else if (currentReference === 'stage-types') {
        // Специальная обработка для видов этапов
        const nameInput = document.getElementById('stage-type-name');
        const requiredRolesSelect = document.getElementById('stage-type-required-roles');
        
        if (!nameInput) {
            console.error('Поле stage-type-name не найдено');
            return;
        }
        
        const name = nameInput.value.trim();
        const requiredRoleIds = Array.from(requiredRolesSelect.selectedOptions)
            .map(option => option.value)
            .filter(id => id !== '');
        
        if (!name) {
            alert('Пожалуйста, введите наименование');
            nameInput.focus();
            return;
        }
        
        const stageTypeData = {
            id: currentItemId || Date.now().toString(),
            name: name,
            requiredRoleIds: requiredRoleIds
        };
        
        if (currentItemId) {
            // Редактирование
            const itemIndex = items.findIndex(i => i.id === currentItemId);
            if (itemIndex !== -1) {
                items[itemIndex] = stageTypeData;
            }
        } else {
            // Создание
            items.push(stageTypeData);
        }
        
        saveItems(currentReference, items);
        renderTable(currentReference);
        closeModal();
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
        
        saveItems(currentReference, items);
        renderTable(currentReference);
        closeModal();
    } else if (currentReference === 'stage-start') {
        // Специальная обработка для документа "Старт этапа"
        const projectSelect = document.getElementById('stage-start-project');
        const milestoneSelect = document.getElementById('stage-start-milestone');
        const stageSelect = document.getElementById('stage-start-stage');
        const actualDateInput = document.getElementById('stage-start-actual-date');
        
        const projectId = projectSelect.value || null;
        const milestoneId = milestoneSelect.value || null;
        const stageId = stageSelect.value || null;
        const actualDate = actualDateInput.value || null;
        
        if (!projectId || !milestoneId || !stageId || !actualDate) {
            alert('Пожалуйста, заполните все обязательные поля');
            return;
        }
        
        // Проверяем обязательные роли
        const stages = getItems('stages');
        const stage = stages.find(s => s.id === stageId);
        if (stage && stage.stageTypeId) {
            const stageTypes = getItems('stage-types');
            const stageType = stageTypes.find(st => st.id === stage.stageTypeId);
            if (stageType && stageType.requiredRoleIds && stageType.requiredRoleIds.length > 0) {
                const teamRoleIds = currentTeamMembers.map(m => m.roleId);
                const missingRoleIds = stageType.requiredRoleIds.filter(roleId => !teamRoleIds.includes(roleId));
                
                if (missingRoleIds.length > 0) {
                    const roles = getItems('roles');
                    const missingRoleNames = missingRoleIds.map(roleId => {
                        const role = roles.find(r => r.id === roleId);
                        return role ? role.name : '';
                    }).filter(name => name !== '');
                    
                    alert(`Необходимо указать следующие обязательные роли для данного вида этапа: ${missingRoleNames.join(', ')}`);
                    return;
                }
            }
        }
        
        const documentData = {
            id: currentItemId || Date.now().toString(),
            projectId: projectId,
            milestoneId: milestoneId,
            stageId: stageId,
            actualDate: actualDate,
            teamMembers: currentTeamMembers.map(m => ({
                roleId: m.roleId,
                roleName: m.roleName,
                employeeId: m.employeeId,
                employeeName: m.employeeName
            }))
        };
        
        if (currentItemId) {
            const itemIndex = items.findIndex(i => i.id === currentItemId);
            if (itemIndex !== -1) {
                items[itemIndex] = documentData;
            }
        } else {
            items.push(documentData);
        }
        
        saveItems(currentReference, items);
        renderTable(currentReference);
        closeModal();
    } else if (currentReference === 'stage-completion') {
        // Специальная обработка для документа "Завершение этапа"
        const projectSelect = document.getElementById('stage-completion-project');
        const milestoneSelect = document.getElementById('stage-completion-milestone');
        const stageSelect = document.getElementById('stage-completion-stage');
        const actualDateInput = document.getElementById('stage-completion-actual-date');
        
        const projectId = projectSelect.value || null;
        const milestoneId = milestoneSelect.value || null;
        const stageId = stageSelect.value || null;
        const actualDate = actualDateInput.value || null;
        
        if (!projectId || !milestoneId || !stageId || !actualDate) {
            alert('Пожалуйста, заполните все обязательные поля');
            return;
        }
        
        const documentData = {
            id: currentItemId || Date.now().toString(),
            projectId: projectId,
            milestoneId: milestoneId,
            stageId: stageId,
            actualDate: actualDate,
            teamMembers: currentTeamMembers.map(m => ({
                roleId: m.roleId,
                roleName: m.roleName,
                employeeId: m.employeeId,
                employeeName: m.employeeName
            }))
        };
        
        if (currentItemId) {
            const itemIndex = items.findIndex(i => i.id === currentItemId);
            if (itemIndex !== -1) {
                items[itemIndex] = documentData;
            }
        } else {
            items.push(documentData);
        }
        
        saveItems(currentReference, items);
        renderTable(currentReference);
        closeModal();
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
        } else if (reference === 'projects-list') {
            colCount = 6;
        } else if (reference === 'milestones') {
            colCount = 6;
        } else if (reference === 'stages') {
            colCount = 7;
        } else if (reference === 'stage-types') {
            colCount = 3;
        } else if (reference === 'stage-start' || reference === 'stage-completion') {
            colCount = 6;
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
    } else if (reference === 'projects-list') {
        // Специальный рендеринг для проектов
        const contractors = getItems('contractors');
        tbody.innerHTML = items.map(item => {
            const contractor = item.contractorId ? contractors.find(c => c.id === item.contractorId) : null;
            const contractorName = contractor ? contractor.name : '-';
            const cost = item.cost !== null && item.cost !== undefined ? item.cost.toFixed(2) : '-';
            const startDate = item.startDate ? formatDate(item.startDate) : '-';
            const endDate = item.endDate ? formatDate(item.endDate) : '-';
            return `
                <tr>
                    <td>${escapeHtml(item.name)}</td>
                    <td>${escapeHtml(contractorName)}</td>
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
    } else if (reference === 'stage-types') {
        // Специальный рендеринг для видов этапов
        const roles = getItems('roles');
        tbody.innerHTML = items.map(item => {
            // Формируем список обязательных ролей
            let requiredRolesList = '-';
            if (item.requiredRoleIds && item.requiredRoleIds.length > 0) {
                const roleNames = item.requiredRoleIds.map(roleId => {
                    const role = roles.find(r => r.id === roleId);
                    return role ? role.name : null;
                }).filter(name => name !== null);
                requiredRolesList = roleNames.length > 0 ? roleNames.join(', ') : '-';
            }
            
            return `
                <tr>
                    <td>${escapeHtml(item.name)}</td>
                    <td>${escapeHtml(requiredRolesList)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-edit" onclick="editItem('${reference}', '${item.id}')">Редактировать</button>
                            <button class="btn-delete" onclick="deleteItem('${reference}', '${item.id}')">Удалить</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } else if (reference === 'stage-start') {
        // Специальный рендеринг для документа "Старт этапа"
        const projects = getItems('projects-list');
        const milestones = getItems('milestones');
        const stages = getItems('stages');
        tbody.innerHTML = items.map(item => {
            const project = item.projectId ? projects.find(p => p.id === item.projectId) : null;
            const projectName = project ? project.name : '-';
            const milestone = item.milestoneId ? milestones.find(m => m.id === item.milestoneId) : null;
            const milestoneName = milestone ? milestone.name : '-';
            const stage = item.stageId ? stages.find(s => s.id === item.stageId) : null;
            const stageName = stage ? stage.name : '-';
            const actualDate = item.actualDate ? formatDate(item.actualDate) : '-';
            
            // Формируем список команды
            let teamList = '-';
            if (item.teamMembers && item.teamMembers.length > 0) {
                teamList = item.teamMembers.map(m => `${m.roleName}: ${m.employeeName}`).join(', ');
            }
            
            return `
                <tr>
                    <td>${escapeHtml(projectName)}</td>
                    <td>${escapeHtml(milestoneName)}</td>
                    <td>${escapeHtml(stageName)}</td>
                    <td>${escapeHtml(teamList)}</td>
                    <td>${escapeHtml(actualDate)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-edit" onclick="editItem('${reference}', '${item.id}')">Редактировать</button>
                            <button class="btn-delete" onclick="deleteItem('${reference}', '${item.id}')">Удалить</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } else if (reference === 'stage-completion') {
        // Специальный рендеринг для документа "Завершение этапа"
        const projects = getItems('projects-list');
        const milestones = getItems('milestones');
        const stages = getItems('stages');
        tbody.innerHTML = items.map(item => {
            const project = item.projectId ? projects.find(p => p.id === item.projectId) : null;
            const projectName = project ? project.name : '-';
            const milestone = item.milestoneId ? milestones.find(m => m.id === item.milestoneId) : null;
            const milestoneName = milestone ? milestone.name : '-';
            const stage = item.stageId ? stages.find(s => s.id === item.stageId) : null;
            const stageName = stage ? stage.name : '-';
            const actualDate = item.actualDate ? formatDate(item.actualDate) : '-';
            
            // Формируем список команды
            let teamList = '-';
            if (item.teamMembers && item.teamMembers.length > 0) {
                teamList = item.teamMembers.map(m => `${m.roleName}: ${m.employeeName}`).join(', ');
            }
            
            return `
                <tr>
                    <td>${escapeHtml(projectName)}</td>
                    <td>${escapeHtml(milestoneName)}</td>
                    <td>${escapeHtml(stageName)}</td>
                    <td>${escapeHtml(teamList)}</td>
                    <td>${escapeHtml(actualDate)}</td>
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

// Переменные для хранения состава команды в документах
let currentTeamMembers = [];

// Функция настройки формы "Старт этапа"
function setupStageStartForm(itemId = null) {
    const modalTitle = document.getElementById('modal-title');
    modalTitle.textContent = itemId ? 'Редактировать документ "Старт этапа"' : 'Новый документ "Старт этапа"';
    
    // Заполняем выпадающие списки
    const projectSelect = document.getElementById('stage-start-project');
    const milestoneSelect = document.getElementById('stage-start-milestone');
    const stageSelect = document.getElementById('stage-start-stage');
    const roleSelect = document.getElementById('stage-start-role');
    const employeeSelect = document.getElementById('stage-start-employee');
    const actualDateInput = document.getElementById('stage-start-actual-date');
    const teamList = document.getElementById('stage-start-team-list');
    
    // Заполняем проекты
    const projects = getItems('projects-list');
    projectSelect.innerHTML = '<option value="">Выберите проект</option>';
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        projectSelect.appendChild(option);
    });
    
    // Заполняем роли
    const roles = getItems('roles');
    roleSelect.innerHTML = '<option value="">Выберите роль</option>';
    roles.forEach(role => {
        const option = document.createElement('option');
        option.value = role.id;
        option.textContent = role.name;
        roleSelect.appendChild(option);
    });
    
    // Заполняем сотрудников
    const employees = getItems('employees');
    employeeSelect.innerHTML = '<option value="">Выберите сотрудника</option>';
    employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.name;
        employeeSelect.appendChild(option);
    });
    
    // Очищаем список команды
    currentTeamMembers = [];
    teamList.innerHTML = '';
    
    // Обработчик изменения проекта
    projectSelect.addEventListener('change', function() {
        const projectId = this.value;
        updateMilestonesForDocument(milestoneSelect, projectId);
        milestoneSelect.value = '';
        stageSelect.innerHTML = '<option value="">Выберите этап</option>';
    });
    
    // Обработчик изменения вехи
    milestoneSelect.addEventListener('change', function() {
        const milestoneId = this.value;
        updateStagesForDocument(stageSelect, milestoneId);
        stageSelect.value = '';
        checkRequiredRoles();
    });
    
    // Обработчик изменения этапа - проверяем обязательные роли
    stageSelect.addEventListener('change', function() {
        checkRequiredRoles();
    });
    
    // Функция проверки обязательных ролей
    function checkRequiredRoles() {
        const stageId = stageSelect.value;
        if (!stageId) {
            // Очищаем предупреждение, если этап не выбран
            const warningDiv = document.getElementById('stage-start-required-roles-warning');
            if (warningDiv) {
                warningDiv.remove();
            }
            return;
        }
        
        const stages = getItems('stages');
        const stage = stages.find(s => s.id === stageId);
        if (!stage || !stage.stageTypeId) {
            return;
        }
        
        const stageTypes = getItems('stage-types');
        const stageType = stageTypes.find(st => st.id === stage.stageTypeId);
        if (!stageType || !stageType.requiredRoleIds || stageType.requiredRoleIds.length === 0) {
            // Нет обязательных ролей
            const warningDiv = document.getElementById('stage-start-required-roles-warning');
            if (warningDiv) {
                warningDiv.remove();
            }
            return;
        }
        
        // Получаем роли из команды
        const teamRoleIds = currentTeamMembers.map(m => m.roleId);
        
        // Проверяем, какие обязательные роли отсутствуют
        const missingRoleIds = stageType.requiredRoleIds.filter(roleId => !teamRoleIds.includes(roleId));
        
        // Удаляем старое предупреждение, если есть
        const oldWarning = document.getElementById('stage-start-required-roles-warning');
        if (oldWarning) {
            oldWarning.remove();
        }
        
        if (missingRoleIds.length > 0) {
            // Показываем предупреждение
            const roles = getItems('roles');
            const missingRoleNames = missingRoleIds.map(roleId => {
                const role = roles.find(r => r.id === roleId);
                return role ? role.name : '';
            }).filter(name => name !== '');
            
            const warningDiv = document.createElement('div');
            warningDiv.id = 'stage-start-required-roles-warning';
            warningDiv.style.cssText = 'background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 1rem; margin-top: 1rem; color: #856404;';
            warningDiv.innerHTML = `<strong>Внимание!</strong> Для данного вида этапа необходимо указать следующие обязательные роли: <strong>${escapeHtml(missingRoleNames.join(', '))}</strong>`;
            
            // Вставляем предупреждение после поля "Состав команды"
            const teamListContainer = document.getElementById('stage-start-team-list').parentElement;
            teamListContainer.appendChild(warningDiv);
        }
    }
    
    // Обработчик добавления участника команды
    const addTeamMemberBtn = document.getElementById('add-team-member-start-btn');
    if (addTeamMemberBtn) {
        addTeamMemberBtn.onclick = function() {
            const roleId = roleSelect.value;
            const employeeId = employeeSelect.value;
            
            if (!roleId || !employeeId) {
                alert('Пожалуйста, выберите роль и сотрудника');
                return;
            }
            
            const role = roles.find(r => r.id === roleId);
            const employee = employees.find(e => e.id === employeeId);
            
            if (role && employee) {
                addTeamMemberToList(roleId, role.name, employeeId, employee.name, 'stage-start-team-list');
                roleSelect.value = '';
                employeeSelect.value = '';
                // Проверяем обязательные роли после добавления участника
                checkRequiredRoles();
            }
        };
    }
    
    // Если редактирование, заполняем поля
    if (itemId) {
        const items = getItems('stage-start');
        const item = items.find(i => i.id === itemId);
        if (item) {
            projectSelect.value = item.projectId || '';
            if (item.projectId) {
                updateMilestonesForDocument(milestoneSelect, item.projectId);
                setTimeout(() => {
                    milestoneSelect.value = item.milestoneId || '';
                    if (item.milestoneId) {
                        updateStagesForDocument(stageSelect, item.milestoneId);
                        setTimeout(() => {
                            stageSelect.value = item.stageId || '';
                            // Проверяем обязательные роли после загрузки этапа
                            setTimeout(() => {
                                checkRequiredRoles();
                            }, 200);
                        }, 100);
                    }
                }, 100);
            }
            actualDateInput.value = item.actualDate || '';
            
            // Восстанавливаем состав команды
            if (item.teamMembers && item.teamMembers.length > 0) {
                currentTeamMembers = item.teamMembers;
                renderTeamList('stage-start-team-list', currentTeamMembers);
                // Проверяем обязательные роли после восстановления команды
                setTimeout(() => {
                    checkRequiredRoles();
                }, 300);
            }
        }
    }
}

// Функция настройки формы "Завершение этапа"
function setupStageCompletionForm(itemId = null) {
    const modalTitle = document.getElementById('modal-title');
    modalTitle.textContent = itemId ? 'Редактировать документ "Завершение этапа"' : 'Новый документ "Завершение этапа"';
    
    // Заполняем выпадающие списки
    const projectSelect = document.getElementById('stage-completion-project');
    const milestoneSelect = document.getElementById('stage-completion-milestone');
    const stageSelect = document.getElementById('stage-completion-stage');
    const roleSelect = document.getElementById('stage-completion-role');
    const employeeSelect = document.getElementById('stage-completion-employee');
    const actualDateInput = document.getElementById('stage-completion-actual-date');
    const teamList = document.getElementById('stage-completion-team-list');
    
    // Заполняем проекты
    const projects = getItems('projects-list');
    projectSelect.innerHTML = '<option value="">Выберите проект</option>';
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        projectSelect.appendChild(option);
    });
    
    // Заполняем роли
    const roles = getItems('roles');
    roleSelect.innerHTML = '<option value="">Выберите роль</option>';
    roles.forEach(role => {
        const option = document.createElement('option');
        option.value = role.id;
        option.textContent = role.name;
        roleSelect.appendChild(option);
    });
    
    // Заполняем сотрудников
    const employees = getItems('employees');
    employeeSelect.innerHTML = '<option value="">Выберите сотрудника</option>';
    employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.name;
        employeeSelect.appendChild(option);
    });
    
    // Очищаем список команды
    currentTeamMembers = [];
    teamList.innerHTML = '';
    
    // Обработчик изменения проекта
    projectSelect.addEventListener('change', function() {
        const projectId = this.value;
        updateMilestonesForDocument(milestoneSelect, projectId);
        milestoneSelect.value = '';
        stageSelect.innerHTML = '<option value="">Выберите этап</option>';
    });
    
    // Обработчик изменения вехи
    milestoneSelect.addEventListener('change', function() {
        const milestoneId = this.value;
        updateStagesForDocument(stageSelect, milestoneId);
        stageSelect.value = '';
        checkRequiredRoles();
    });
    
    // Обработчик изменения этапа - проверяем обязательные роли
    stageSelect.addEventListener('change', function() {
        checkRequiredRoles();
    });
    
    // Функция проверки обязательных ролей
    function checkRequiredRoles() {
        const stageId = stageSelect.value;
        if (!stageId) {
            // Очищаем предупреждение, если этап не выбран
            const warningDiv = document.getElementById('stage-start-required-roles-warning');
            if (warningDiv) {
                warningDiv.remove();
            }
            return;
        }
        
        const stages = getItems('stages');
        const stage = stages.find(s => s.id === stageId);
        if (!stage || !stage.stageTypeId) {
            return;
        }
        
        const stageTypes = getItems('stage-types');
        const stageType = stageTypes.find(st => st.id === stage.stageTypeId);
        if (!stageType || !stageType.requiredRoleIds || stageType.requiredRoleIds.length === 0) {
            // Нет обязательных ролей
            const warningDiv = document.getElementById('stage-start-required-roles-warning');
            if (warningDiv) {
                warningDiv.remove();
            }
            return;
        }
        
        // Получаем роли из команды
        const teamRoleIds = currentTeamMembers.map(m => m.roleId);
        
        // Проверяем, какие обязательные роли отсутствуют
        const missingRoleIds = stageType.requiredRoleIds.filter(roleId => !teamRoleIds.includes(roleId));
        
        // Удаляем старое предупреждение, если есть
        const oldWarning = document.getElementById('stage-start-required-roles-warning');
        if (oldWarning) {
            oldWarning.remove();
        }
        
        if (missingRoleIds.length > 0) {
            // Показываем предупреждение
            const roles = getItems('roles');
            const missingRoleNames = missingRoleIds.map(roleId => {
                const role = roles.find(r => r.id === roleId);
                return role ? role.name : '';
            }).filter(name => name !== '');
            
            const warningDiv = document.createElement('div');
            warningDiv.id = 'stage-start-required-roles-warning';
            warningDiv.style.cssText = 'background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 1rem; margin-top: 1rem; color: #856404;';
            warningDiv.innerHTML = `<strong>Внимание!</strong> Для данного вида этапа необходимо указать следующие обязательные роли: <strong>${escapeHtml(missingRoleNames.join(', '))}</strong>`;
            
            // Вставляем предупреждение после поля "Состав команды"
            const teamListContainer = document.getElementById('stage-start-team-list').parentElement;
            teamListContainer.appendChild(warningDiv);
        }
    }
    
    // Обработчик добавления участника команды
    const addTeamMemberBtn = document.getElementById('add-team-member-completion-btn');
    if (addTeamMemberBtn) {
        addTeamMemberBtn.onclick = function() {
            const roleId = roleSelect.value;
            const employeeId = employeeSelect.value;
            
            if (!roleId || !employeeId) {
                alert('Пожалуйста, выберите роль и сотрудника');
                return;
            }
            
            const role = roles.find(r => r.id === roleId);
            const employee = employees.find(e => e.id === employeeId);
            
            if (role && employee) {
                addTeamMemberToList(roleId, role.name, employeeId, employee.name, 'stage-completion-team-list');
                roleSelect.value = '';
                employeeSelect.value = '';
            }
        };
    }
    
    // Если редактирование, заполняем поля
    if (itemId) {
        const items = getItems('stage-completion');
        const item = items.find(i => i.id === itemId);
        if (item) {
            projectSelect.value = item.projectId || '';
            if (item.projectId) {
                updateMilestonesForDocument(milestoneSelect, item.projectId);
                setTimeout(() => {
                    milestoneSelect.value = item.milestoneId || '';
                    if (item.milestoneId) {
                        updateStagesForDocument(stageSelect, item.milestoneId);
                        setTimeout(() => {
                            stageSelect.value = item.stageId || '';
                        }, 100);
                    }
                }, 100);
            }
            actualDateInput.value = item.actualDate || '';
            
            // Восстанавливаем состав команды
            if (item.teamMembers && item.teamMembers.length > 0) {
                currentTeamMembers = item.teamMembers;
                renderTeamList('stage-completion-team-list', currentTeamMembers);
            }
        }
    }
}

// Функция обновления списка вех для документов
function updateMilestonesForDocument(selectElement, projectId) {
    selectElement.innerHTML = '<option value="">Выберите веху</option>';
    if (!projectId) return;
    
    const milestones = getItems('milestones');
    const projectMilestones = milestones.filter(m => m.projectId === projectId);
    projectMilestones.forEach(milestone => {
        const option = document.createElement('option');
        option.value = milestone.id;
        option.textContent = milestone.name;
        selectElement.appendChild(option);
    });
}

// Функция обновления списка этапов для документов
function updateStagesForDocument(selectElement, milestoneId) {
    selectElement.innerHTML = '<option value="">Выберите этап</option>';
    if (!milestoneId) return;
    
    const stages = getItems('stages');
    const milestoneStages = stages.filter(s => s.milestoneId === milestoneId);
    milestoneStages.forEach(stage => {
        const option = document.createElement('option');
        option.value = stage.id;
        option.textContent = stage.name;
        selectElement.appendChild(option);
    });
}

// Функция добавления участника команды в список
function addTeamMemberToList(roleId, roleName, employeeId, employeeName, listId) {
    const teamMember = {
        id: Date.now().toString(),
        roleId: roleId,
        roleName: roleName,
        employeeId: employeeId,
        employeeName: employeeName
    };
    
    currentTeamMembers.push(teamMember);
    renderTeamList(listId, currentTeamMembers);
}

// Функция отображения списка команды
function renderTeamList(listId, teamMembers) {
    const list = document.getElementById(listId);
    if (!list) return;
    
    if (teamMembers.length === 0) {
        list.innerHTML = '<div class="empty-message">Состав команды не указан</div>';
        return;
    }
    
    list.innerHTML = teamMembers.map(member => `
        <div class="contact-person-item">
            <span><strong>${escapeHtml(member.roleName)}</strong>: ${escapeHtml(member.employeeName)}</span>
            <button type="button" class="btn-remove" onclick="removeTeamMember('${member.id}', '${listId}')">×</button>
        </div>
    `).join('');
}

// Функция удаления участника команды
function removeTeamMember(memberId, listId) {
    currentTeamMembers = currentTeamMembers.filter(m => m.id !== memberId);
    renderTeamList(listId, currentTeamMembers);
    
    // Проверяем обязательные роли после удаления участника (если это форма "Старт этапа")
    if (listId === 'stage-start-team-list') {
        const stageSelect = document.getElementById('stage-start-stage');
        if (stageSelect && stageSelect.value) {
            // Вызываем проверку обязательных ролей через небольшую задержку
            setTimeout(() => {
                const checkFunction = window.checkRequiredRolesForStageStart;
                if (checkFunction && typeof checkFunction === 'function') {
                    checkFunction();
                }
            }, 100);
        }
    }
}

// Делаем функцию доступной глобально
window.removeTeamMember = removeTeamMember;

// ========== АРМ "Создание проекта" ==========

// Переменные для хранения данных АРМа
let armMilestones = []; // Массив вех для АРМа
let armFirstStageTeamMembers = []; // Состав команды первого этапа

// Инициализация навигации для АРМов
function setupARMNavigation() {
    // Обработчик клика на карточку АРМа "Создание проекта"
    const armLink = document.querySelector('[data-arm="project-creation"]');
    if (armLink) {
        armLink.addEventListener('click', function(e) {
            e.preventDefault();
            showProjectCreationARM();
        });
    }
    
    // Обработчик кнопки "Назад к АРМам"
    const backBtn = document.getElementById('back-to-arms-btn');
    if (backBtn) {
        backBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showARMsList();
        });
    }
    
    // Обработчик кнопки "Отмена" в форме создания проекта
    const cancelBtn = document.getElementById('cancel-project-creation-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showARMsList();
        });
    }
    
    // Инициализация формы создания проекта
    initializeProjectCreationForm();
    
    // Обработчик отправки формы создания проекта
    const form = document.getElementById('project-creation-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProjectFromARM();
        });
    }
}

// Показать список АРМов
function showARMsList() {
    const armsList = document.getElementById('projects-arms');
    const armForm = document.getElementById('project-creation-arm');
    
    if (armsList) armsList.classList.add('active');
    if (armForm) {
        armForm.classList.remove('active');
        armForm.style.display = 'none'; // Явно скрываем форму
    }
}

// Показать форму создания проекта
function showProjectCreationARM() {
    const armsList = document.getElementById('projects-arms');
    const armForm = document.getElementById('project-creation-arm');
    
    if (armsList) armsList.classList.remove('active');
    if (armForm) {
        armForm.classList.add('active');
        armForm.style.display = 'block'; // Явно показываем форму
        initializeProjectCreationForm();
    }
}

// Инициализация формы создания проекта
function initializeProjectCreationForm() {
    // Заполняем выпадающий список контрагентов
    const contractorSelect = document.getElementById('arm-project-contractor');
    if (contractorSelect) {
        const contractors = getItems('contractors');
        contractorSelect.innerHTML = '<option value="">Выберите контрагента</option>';
        contractors.forEach(contractor => {
            const option = document.createElement('option');
            option.value = contractor.id;
            option.textContent = contractor.name;
            contractorSelect.appendChild(option);
        });
    }
    
    // Заполняем выпадающий список ролей для команды первого этапа
    const roleSelect = document.getElementById('arm-first-stage-role');
    if (roleSelect) {
        const roles = getItems('roles');
        roleSelect.innerHTML = '<option value="">Выберите роль</option>';
        roles.forEach(role => {
            const option = document.createElement('option');
            option.value = role.id;
            option.textContent = role.name;
            roleSelect.appendChild(option);
        });
    }
    
    // Заполняем выпадающий список сотрудников для команды первого этапа
    const employeeSelect = document.getElementById('arm-first-stage-employee');
    if (employeeSelect) {
        const employees = getItems('employees');
        employeeSelect.innerHTML = '<option value="">Выберите сотрудника</option>';
        employees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee.id;
            option.textContent = employee.name;
            employeeSelect.appendChild(option);
        });
    }
    
    // Очищаем данные
    armMilestones = [];
    armFirstStageTeamMembers = [];
    
    // Очищаем список вех
    const milestonesList = document.getElementById('arm-milestones-list');
    if (milestonesList) milestonesList.innerHTML = '';
    
    // Очищаем список команды
    const teamList = document.getElementById('arm-first-stage-team-list');
    if (teamList) teamList.innerHTML = '';
    
    // Обработчик кнопки добавления вехи
    const addMilestoneBtn = document.getElementById('add-milestone-arm-btn');
    if (addMilestoneBtn) {
        addMilestoneBtn.onclick = function() {
            addMilestoneToARM();
        };
    }
    
    // Обработчик кнопки добавления участника команды первого этапа
    const addTeamMemberBtn = document.getElementById('add-first-stage-team-member-btn');
    if (addTeamMemberBtn) {
        addTeamMemberBtn.onclick = function() {
            addFirstStageTeamMember();
        };
    }
}

// Добавить веху в АРМ
function addMilestoneToARM() {
    const milestoneId = Date.now().toString();
    const milestone = {
        id: milestoneId,
        name: '',
        cost: null,
        startDate: null,
        endDate: null,
        stages: []
    };
    
    armMilestones.push(milestone);
    renderMilestonesInARM();
}

// Отрисовать вехи в АРМе
function renderMilestonesInARM() {
    const milestonesList = document.getElementById('arm-milestones-list');
    if (!milestonesList) return;
    
    milestonesList.innerHTML = '';
    
    armMilestones.forEach((milestone, index) => {
        const milestoneDiv = document.createElement('div');
        milestoneDiv.className = 'milestone-item-arm';
        milestoneDiv.innerHTML = `
            <div class="milestone-header-arm">
                <h5>Веха ${index + 1}</h5>
                <button type="button" class="btn btn-small btn-secondary" onclick="removeMilestoneFromARM('${milestone.id}')">Удалить</button>
            </div>
            <div class="milestone-fields-arm">
                <div class="form-group">
                    <label>Наименование: <span class="required">*</span></label>
                    <input type="text" class="form-input" data-milestone-id="${milestone.id}" data-field="name" placeholder="Введите наименование вехи" value="${escapeHtml(milestone.name || '')}">
                </div>
                <div class="form-group">
                    <label>Стоимость:</label>
                    <input type="number" class="form-input" data-milestone-id="${milestone.id}" data-field="cost" placeholder="Стоимость" step="0.01" min="0" value="${milestone.cost !== null ? milestone.cost : ''}">
                </div>
                <div class="form-group">
                    <label>Плановая дата начала:</label>
                    <input type="date" class="form-input" data-milestone-id="${milestone.id}" data-field="startDate" value="${milestone.startDate || ''}">
                </div>
                <div class="form-group">
                    <label>Плановая дата окончания:</label>
                    <input type="date" class="form-input" data-milestone-id="${milestone.id}" data-field="endDate" value="${milestone.endDate || ''}">
                </div>
            </div>
            <div class="stages-container-arm">
                <h6 style="margin-bottom: 1rem; font-weight: 600; color: #333;">Этапы вехи:</h6>
                <div id="arm-stages-list-${milestone.id}" class="stages-list-arm"></div>
                <button type="button" class="btn btn-primary btn-small" onclick="addStageToARM('${milestone.id}')">+ Добавить этап</button>
            </div>
        `;
        
        milestonesList.appendChild(milestoneDiv);
        
        // Добавляем обработчики изменения полей вехи
        milestoneDiv.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', function() {
                updateMilestoneField(milestone.id, this.getAttribute('data-field'), this.value);
            });
        });
        
        // Отрисовываем этапы вехи
        renderStagesInARM(milestone.id);
    });
}

// Обновить поле вехи
function updateMilestoneField(milestoneId, field, value) {
    const milestone = armMilestones.find(m => m.id === milestoneId);
    if (milestone) {
        if (field === 'cost') {
            milestone[field] = value ? parseFloat(value) : null;
        } else {
            milestone[field] = value || null;
        }
    }
}

// Удалить веху из АРМа
function removeMilestoneFromARM(milestoneId) {
    armMilestones = armMilestones.filter(m => m.id !== milestoneId);
    renderMilestonesInARM();
}

// Добавить этап к вехе в АРМе
function addStageToARM(milestoneId) {
    const milestone = armMilestones.find(m => m.id === milestoneId);
    if (!milestone) return;
    
    const stageId = Date.now().toString();
    const stage = {
        id: stageId,
        name: '',
        stageTypeId: null,
        cost: null,
        startDate: null,
        endDate: null
    };
    
    milestone.stages.push(stage);
    renderStagesInARM(milestoneId);
}

// Отрисовать этапы вехи в АРМе
function renderStagesInARM(milestoneId) {
    const milestone = armMilestones.find(m => m.id === milestoneId);
    if (!milestone) return;
    
    const stagesList = document.getElementById(`arm-stages-list-${milestoneId}`);
    if (!stagesList) return;
    
    stagesList.innerHTML = '';
    
    const stageTypes = getItems('stage-types');
    
    milestone.stages.forEach((stage, index) => {
        const stageDiv = document.createElement('div');
        stageDiv.className = 'stage-item-arm';
        stageDiv.innerHTML = `
            <div class="stage-header-arm">
                <strong>Этап ${index + 1}</strong>
                <button type="button" class="btn-remove" onclick="removeStageFromARM('${milestoneId}', '${stage.id}')">&times;</button>
            </div>
            <div class="stage-fields-arm">
                <div class="form-group">
                    <label>Наименование:</label>
                    <input type="text" class="form-input" data-milestone-id="${milestoneId}" data-stage-id="${stage.id}" data-field="name" placeholder="Наименование этапа" value="${escapeHtml(stage.name || '')}">
                </div>
                <div class="form-group">
                    <label>Вид этапа:</label>
                    <select class="form-select" data-milestone-id="${milestoneId}" data-stage-id="${stage.id}" data-field="stageTypeId">
                        <option value="">Выберите вид этапа</option>
                        ${stageTypes.map(st => `<option value="${st.id}" ${stage.stageTypeId === st.id ? 'selected' : ''}>${escapeHtml(st.name)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Стоимость:</label>
                    <input type="number" class="form-input" data-milestone-id="${milestoneId}" data-stage-id="${stage.id}" data-field="cost" placeholder="Стоимость" step="0.01" min="0" value="${stage.cost !== null ? stage.cost : ''}">
                </div>
                <div class="form-group">
                    <label>Плановая дата начала:</label>
                    <input type="date" class="form-input" data-milestone-id="${milestoneId}" data-stage-id="${stage.id}" data-field="startDate" value="${stage.startDate || ''}">
                </div>
                <div class="form-group">
                    <label>Плановая дата завершения:</label>
                    <input type="date" class="form-input" data-milestone-id="${milestoneId}" data-stage-id="${stage.id}" data-field="endDate" value="${stage.endDate || ''}">
                </div>
            </div>
        `;
        
        stagesList.appendChild(stageDiv);
        
        // Добавляем обработчики изменения полей этапа
        stageDiv.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', function() {
                updateStageField(milestoneId, stage.id, this.getAttribute('data-field'), this.value);
            });
        });
    });
}

// Обновить поле этапа
function updateStageField(milestoneId, stageId, field, value) {
    const milestone = armMilestones.find(m => m.id === milestoneId);
    if (!milestone) return;
    
    const stage = milestone.stages.find(s => s.id === stageId);
    if (stage) {
        if (field === 'cost') {
            stage[field] = value ? parseFloat(value) : null;
        } else {
            stage[field] = value || null;
        }
    }
}

// Удалить этап из вехи в АРМе
function removeStageFromARM(milestoneId, stageId) {
    const milestone = armMilestones.find(m => m.id === milestoneId);
    if (milestone) {
        milestone.stages = milestone.stages.filter(s => s.id !== stageId);
        renderStagesInARM(milestoneId);
    }
}

// Добавить участника команды первого этапа
function addFirstStageTeamMember() {
    const roleSelect = document.getElementById('arm-first-stage-role');
    const employeeSelect = document.getElementById('arm-first-stage-employee');
    
    if (!roleSelect || !employeeSelect) return;
    
    const roleId = roleSelect.value;
    const employeeId = employeeSelect.value;
    
    if (!roleId || !employeeId) {
        alert('Пожалуйста, выберите роль и сотрудника');
        return;
    }
    
    const roles = getItems('roles');
    const employees = getItems('employees');
    
    const role = roles.find(r => r.id === roleId);
    const employee = employees.find(e => e.id === employeeId);
    
    if (!role || !employee) return;
    
    // Проверяем, не добавлен ли уже этот участник
    if (armFirstStageTeamMembers.find(m => m.roleId === roleId && m.employeeId === employeeId)) {
        alert('Этот участник уже добавлен в команду');
        return;
    }
    
    const memberId = Date.now().toString();
    armFirstStageTeamMembers.push({
        id: memberId,
        roleId: roleId,
        roleName: role.name,
        employeeId: employeeId,
        employeeName: employee.name
    });
    
    renderFirstStageTeamList();
    
    // Очищаем поля
    roleSelect.value = '';
    employeeSelect.value = '';
}

// Отрисовать список команды первого этапа
function renderFirstStageTeamList() {
    const teamList = document.getElementById('arm-first-stage-team-list');
    if (!teamList) return;
    
    teamList.innerHTML = '';
    
    if (armFirstStageTeamMembers.length === 0) {
        teamList.innerHTML = '<div style="padding: 1rem; text-align: center; color: #888;">Команда не добавлена</div>';
        return;
    }
    
    armFirstStageTeamMembers.forEach(member => {
        const item = document.createElement('div');
        item.className = 'contact-person-item';
        item.innerHTML = `
            <div class="contact-person-info">
                <strong>${escapeHtml(member.roleName)}</strong>: ${escapeHtml(member.employeeName)}
            </div>
            <button type="button" class="btn-remove" onclick="removeFirstStageTeamMember('${member.id}')">&times;</button>
        `;
        teamList.appendChild(item);
    });
}

// Удалить участника команды первого этапа
function removeFirstStageTeamMember(memberId) {
    armFirstStageTeamMembers = armFirstStageTeamMembers.filter(m => m.id !== memberId);
    renderFirstStageTeamList();
}

// Сохранить проект из АРМа
function saveProjectFromARM() {
    // Валидация основных полей проекта
    const nameInput = document.getElementById('arm-project-name');
    const contractorSelect = document.getElementById('arm-project-contractor');
    
    if (!nameInput || !contractorSelect) return;
    
    const name = nameInput.value.trim();
    const contractorId = contractorSelect.value;
    
    if (!name) {
        alert('Пожалуйста, введите наименование проекта');
        nameInput.focus();
        return;
    }
    
    if (!contractorId) {
        alert('Пожалуйста, выберите контрагента');
        contractorSelect.focus();
        return;
    }
    
    // Валидация вех
    for (let i = 0; i < armMilestones.length; i++) {
        const milestone = armMilestones[i];
        if (!milestone.name || milestone.name.trim() === '') {
            alert(`Пожалуйста, введите наименование для вехи ${i + 1}`);
            return;
        }
    }
    
    // Получаем остальные поля проекта
    const costInput = document.getElementById('arm-project-cost');
    const startDateInput = document.getElementById('arm-project-start-date');
    const endDateInput = document.getElementById('arm-project-end-date');
    
    const cost = costInput && costInput.value ? parseFloat(costInput.value) : null;
    const startDate = startDateInput && startDateInput.value ? startDateInput.value : null;
    const endDate = endDateInput && endDateInput.value ? endDateInput.value : null;
    
    // Создаем проект
    const projectId = Date.now().toString();
    const project = {
        id: projectId,
        name: name,
        contractorId: contractorId,
        cost: cost,
        startDate: startDate,
        endDate: endDate,
        milestoneIds: []
    };
    
    const projects = getItems('projects-list');
    projects.push(project);
    saveItems('projects-list', projects);
    
    // Создаем вехи
    const milestones = getItems('milestones');
    const milestoneIds = [];
    
    armMilestones.forEach((milestoneData, index) => {
        const milestoneId = Date.now().toString() + '-' + index + '-' + Math.random().toString(36).substring(2, 11);
        const milestone = {
            id: milestoneId,
            name: milestoneData.name,
            projectId: projectId,
            cost: milestoneData.cost,
            startDate: milestoneData.startDate,
            endDate: milestoneData.endDate,
            stageIds: []
        };
        
        milestones.push(milestone);
        milestoneIds.push(milestoneId);
        
        // Создаем этапы вехи
        const stages = getItems('stages');
        const stageIds = [];
        
        milestoneData.stages.forEach((stageData, stageIndex) => {
            const stageId = Date.now().toString() + '-' + index + '-' + stageIndex + '-' + Math.random().toString(36).substring(2, 11);
            const stage = {
                id: stageId,
                name: stageData.name || `${project.name} ${milestoneData.name} ${stageData.stageTypeId ? (getItems('stage-types').find(st => st.id === stageData.stageTypeId)?.name || '') : ''}`.trim(),
                projectId: projectId,
                milestoneId: milestoneId,
                stageTypeId: stageData.stageTypeId,
                cost: stageData.cost,
                startDate: stageData.startDate,
                endDate: stageData.endDate
            };
            
            stages.push(stage);
            stageIds.push(stageId);
        });
        
        milestone.stageIds = stageIds;
        saveItems('stages', stages);
    });
    
    project.milestoneIds = milestoneIds;
    saveItems('milestones', milestones);
    saveItems('projects-list', projects);
    
    // Создаем документ "Старт этапа" для первого этапа первого проекта
    if (armMilestones.length > 0 && armMilestones[0].stages.length > 0) {
        const firstMilestoneId = milestoneIds[0];
        const firstMilestone = milestones.find(m => m.id === firstMilestoneId);
        if (firstMilestone && firstMilestone.stageIds.length > 0) {
            const firstStageId = firstMilestone.stageIds[0];
            const actualDateInput = document.getElementById('arm-first-stage-actual-date');
            const actualDate = actualDateInput && actualDateInput.value ? actualDateInput.value : null;
            
            if (actualDate || armFirstStageTeamMembers.length > 0) {
                const stageStartDoc = {
                    id: Date.now().toString(),
                    projectId: projectId,
                    milestoneId: firstMilestoneId,
                    stageId: firstStageId,
                    actualDate: actualDate || new Date().toISOString().split('T')[0],
                    teamMembers: armFirstStageTeamMembers.map(m => ({
                        roleId: m.roleId,
                        roleName: m.roleName,
                        employeeId: m.employeeId,
                        employeeName: m.employeeName
                    }))
                };
                
                const stageStartDocs = getItems('stage-start');
                stageStartDocs.push(stageStartDoc);
                saveItems('stage-start', stageStartDocs);
            }
        }
    }
    
    alert('Проект успешно создан!');
    showARMsList();
}

// Делаем функции доступными глобально
window.removeMilestoneFromARM = removeMilestoneFromARM;
window.addStageToARM = addStageToARM;
window.removeStageFromARM = removeStageFromARM;
window.removeFirstStageTeamMember = removeFirstStageTeamMember;

// ========== Отчеты ==========

// Переменная для хранения экземпляра диаграммы
let revenueChart = null;

// Инициализация отчетов
function setupReports() {
    // Обработчик кнопки "Сформировать отчет" для плановой выручки
    const generateReportBtn = document.getElementById('generate-revenue-report-btn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', function() {
            generateRevenueReport();
        });
    }
    
    // Обработчики переключения периода диаграммы
    const periodRadios = document.querySelectorAll('input[name="chart-period"]');
    periodRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (revenueChart) {
                generateRevenueReport();
            }
        });
    });
}

// Генерация отчета "Плановая выручка"
function generateRevenueReport() {
    const startDateInput = document.getElementById('revenue-report-start-date');
    const endDateInput = document.getElementById('revenue-report-end-date');
    const tableBody = document.getElementById('revenue-report-table-body');
    const summaryDiv = document.getElementById('revenue-report-summary');
    const totalSpan = document.getElementById('revenue-report-total');
    
    if (!startDateInput || !endDateInput || !tableBody) {
        return;
    }
    
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    
    // Валидация периода
    if (!startDate || !endDate) {
        alert('Пожалуйста, укажите период (дата начала и дата окончания)');
        return;
    }
    
    if (startDate > endDate) {
        alert('Дата начала не может быть больше даты окончания');
        return;
    }
    
    // Получаем все этапы
    const stages = getItems('stages');
    const projects = getItems('projects-list');
    const milestones = getItems('milestones');
    
    // Фильтруем этапы по периоду (плановые даты завершения попадают в период)
    const filteredStages = stages.filter(stage => {
        if (!stage.endDate) return false;
        return stage.endDate >= startDate && stage.endDate <= endDate;
    });
    
    // Рассчитываем общую плановую выручку
    let totalRevenue = 0;
    
    // Формируем данные для таблицы
    const reportData = filteredStages.map(stage => {
        const cost = stage.cost !== null && stage.cost !== undefined ? parseFloat(stage.cost) : 0;
        totalRevenue += cost;
        
        // Находим проект
        const project = stage.projectId ? projects.find(p => p.id === stage.projectId) : null;
        const projectName = project ? project.name : '-';
        
        // Находим веху
        const milestone = stage.milestoneId ? milestones.find(m => m.id === stage.milestoneId) : null;
        const milestoneName = milestone ? milestone.name : '-';
        
        return {
            projectName: projectName,
            milestoneName: milestoneName,
            stageName: stage.name || '-',
            cost: cost,
            endDate: stage.endDate
        };
    });
    
    // Сортируем по дате завершения
    reportData.sort((a, b) => {
        if (a.endDate < b.endDate) return -1;
        if (a.endDate > b.endDate) return 1;
        return 0;
    });
    
    // Отображаем результаты
    if (reportData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: #888;">
                    Нет данных за выбранный период
                </td>
            </tr>
        `;
        summaryDiv.style.display = 'none';
        const chartSection = document.getElementById('revenue-chart-section');
        if (chartSection) chartSection.style.display = 'none';
    } else {
        tableBody.innerHTML = reportData.map(item => `
            <tr>
                <td>${escapeHtml(item.projectName)}</td>
                <td>${escapeHtml(item.milestoneName)}</td>
                <td>${escapeHtml(item.stageName)}</td>
                <td>${item.cost.toFixed(2)}</td>
                <td>${formatDate(item.endDate)}</td>
            </tr>
        `).join('');
        
        // Показываем итоговую сумму
        if (totalSpan) {
            totalSpan.textContent = totalRevenue.toFixed(2);
        }
        if (summaryDiv) {
            summaryDiv.style.display = 'block';
        }
        
        // Отображаем диаграмму
        renderRevenueChart(reportData, startDate, endDate);
    }
}

// Функция для получения периода в зависимости от типа группировки
function getPeriodKey(dateString, periodType) {
    const date = new Date(dateString + 'T00:00:00');
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const quarter = Math.ceil(month / 3);
    
    if (periodType === 'month') {
        const monthStr = month < 10 ? '0' + month : month.toString();
        return `${year}-${monthStr}`;
    } else if (periodType === 'quarter') {
        return `${year}-Q${quarter}`;
    } else if (periodType === 'year') {
        return year.toString();
    }
    return dateString;
}

// Функция для форматирования метки периода
function formatPeriodLabel(periodKey, periodType) {
    if (periodType === 'month') {
        const [year, month] = periodKey.split('-');
        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                           'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    } else if (periodType === 'quarter') {
        const [year, quarter] = periodKey.split('-Q');
        return `Q${quarter} ${year}`;
    } else if (periodType === 'year') {
        return periodKey;
    }
    return periodKey;
}

// Отрисовка диаграммы выручки
function renderRevenueChart(reportData, startDate, endDate) {
    const chartSection = document.getElementById('revenue-chart-section');
    const chartCanvas = document.getElementById('revenue-chart');
    
    if (!chartSection || !chartCanvas) {
        return;
    }
    
    // Получаем выбранный тип периода
    const periodRadio = document.querySelector('input[name="chart-period"]:checked');
    const periodType = periodRadio ? periodRadio.value : 'month';
    
    // Группируем данные по периодам
    const periodData = {};
    
    reportData.forEach(item => {
        const periodKey = getPeriodKey(item.endDate, periodType);
        if (!periodData[periodKey]) {
            periodData[periodKey] = 0;
        }
        periodData[periodKey] += item.cost;
    });
    
    // Сортируем периоды
    const sortedPeriods = Object.keys(periodData).sort();
    const labels = sortedPeriods.map(key => formatPeriodLabel(key, periodType));
    const data = sortedPeriods.map(key => periodData[key]);
    
    // Показываем секцию с диаграммой
    chartSection.style.display = 'block';
    
    // Уничтожаем предыдущую диаграмму, если она существует
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    // Создаем новую диаграмму
    const ctx = chartCanvas.getContext('2d');
    revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Плановая выручка (руб.)',
                data: data,
                backgroundColor: 'rgba(102, 126, 234, 0.6)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Выручка: ' + context.parsed.y.toFixed(2) + ' руб.';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2) + ' руб.';
                        }
                    }
                }
            }
        }
    });
}
