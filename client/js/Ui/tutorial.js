SCWeb.ui.Tutorial = {
    inProgress: false,
    activeElem: undefined,
    tutorialNodeCreated: false,
    tutorialEdgeCreated: false,

    init: function() {
        return new Promise(resolve => {
            const self = this;
            $(document)
                .keydown(function(event) {
                    if (event.shiftKey && event.key === 'H' && self.isInProgress()) {
                        self.toggleInfoVisibility();
                    }
                })
                .ready(() => {
                    $('#abort-tutorial-button').click(() => {
                        self.end()
                    });
                });
            resolve();
        });
    },

    initStages: function() {
        this.tutorialStages = [
            {
                elemID: "#search-panel",
                desc: {
                    rus: {
                        title: 'Поле поиска',
                        text: 'Добро пожаловать в обучение! Здесь Вы узнаете об основном функционале системы. Это окно всегда можно скрыть нажатием комбинации клавиш "Shift + H". Также обучение всегда можно завершить досрочно нажатием кнопки "Abort tutorial" в правом нижнем углу этого окна. Ваше первое задание - поиск сущности в базе знаний по идентификатору. Нажмите на поле поиска.'
                    },
                    eng: {
                        title: '',
                        text: 'a'
                    }
                }
            },
            {
                elemID: "#search-input",
                desc: {
                    rus: {
                        title: 'Поиск по основному идентификатору',
                        text: 'Это - поле поиска сущности по идентификатору. В него можно вводить как стандартные, так и системные идентификаторы. Давайте найдём сущность с основным идентификатором "транзитивное отношение".'
                    },
                    eng: {
                        title: 'a',
                        text: 'a'
                    }
                }
            },
            {
                elemID: "#tutorial-suggestion",
                desc: {
                    rus: {
                        title: 'Выбор сущности из списка',
                        text: 'Выберите сущность с идентификатором "транзитивное отношение" из выпадающего списка.'
                    },
                    eng: {
                        title: 'a',
                        text: 'a'
                    }
                }
            },
            {
                elemID: "#expert_mode_container",
                desc: {
                    rus: {
                        title: 'Экспертный режим',
                        text: 'Это - окно просмотра информации о сущности. Здесь отображаются все сущности, с которыми связана данная сущность, а также отношения, их связывающие. Нажатие левой кнопкой мыши по идентификатору любой сущности откроет подобное окно для выбранной сущности. Однако, по умолчанию, в этом окне опускается информация, которая, вероятнее всего, не будет полезна большинству пользователей. Для отображения всей имеющейся информации о сущности, а также для использования расширенного функционала по просмотру и редактированию базы знаний, используется экспертный режим. Перейдите в экспертный режим.'
                    },
                    eng: {
                        title: 'a',
                        text: 'a'
                    }
                }
            },
            {
                elemID: "#window-type-select-button",
                desc: {
                    rus: {
                        title: 'Элемент управления режимом отображения',
                        text: 'Вы вошли в экспертный режим. В экспертном режиме отображается полная информация о желаемой сущности, а также открыт доступ к дополнительным инструментам просмотра и редактирования базы знаний. В частности, среди доступных инструментов в правой верхней панели можно видеть элемент управления режимом отображения информации. На данный момент таких режимов доступно два - SCn-код (то, что Вы видите сейчас) и SCg-код (графическое представление). Давайте перейдём в режим графического представления информации о сущности. Нажмите на выделенную кнопку.'
                    },
                    eng: {
                        title: 'a',
                        text: 'a'
                    }
                }
            },
            {
                elemID: "#scg-mode-toggle-button",
                desc: {
                    rus: {
                        title: 'Переключение в графический режим отображения',
                        text: 'Нажмите на кнопку с текстом SCg-код.'
                    },
                    eng: {
                        title: 'a',
                        text: 'a'
                    }
                }
            },
            {
                elemID: "#window-container",
                desc: {
                    rus: {
                        title: 'Создание узла',
                        text: 'Вы перешли в графический режим представления информации. Здесь отображены те же самые сущности и отношения, что и ранее, в виде графа. Помимо просмотра, графический режим можно использовать и для редактирования базы знаний. Редактирование базы знаний подразумевает под собой создание, редактирование или удаление узлов или дуг. Давайте создадим новый узел. Создание нового узла доступно в режиме выделения (кнопка с изображением курсора мыши в боковой панели инструментов) путём двойного нажатия левой кнопки мыши по пустому месту на полотне. Создайте новый узел.'
                    },
                    eng: {
                        title: 'a',
                        text: 'a'
                    }
                }
            },
            {
                elemID: "#scg-tool-edge",
                desc: {
                    rus: {
                        title: 'Режим создания дуг',
                        text: 'Вы создали узел в базе знаний. Однако изолированный узел, не связанный ни с какими другими узлами никакими отношениями, несёт мало пользы для БЗ. Давайте создадим дугу, связывающую этот узел и некий другой существующий узел. Перейдите в режим создания дуг.'
                    },
                    eng: {
                        title: 'a',
                        text: 'a'
                    }
                }
            },
            {
                elemID: "#window-container",
                desc: {
                    rus: {
                        title: 'Создание дуги',
                        text: 'Вы перешли в режим создания дуги. Создать дугу можно путём нажатия левой кнопки мыши сначала на узле-источнике, а после - на узле назначения. Создайте дугу, соединяющую два существующих узла.'
                    },
                    eng: {
                        title: 'a',
                        text: 'a'
                    }
                }
            }
        ];
    },

    isInProgress: function() {
        return this.inProgress;
    },

    begin: function() {
        this.inProgress = true;
        this.currentStage = -1;
        this.initStages();
        this.commenceToNextStage();
        this.toggleInfoVisibility();
    },

    end: function() {
        this.inProgress = false;
        this.blurActiveElem();
        this.hideInfo();
    },

    commenceToNextStage: function() {
        if (this.currentStage >= 0) {
            this.blurActiveElem();
        }
        this.currentStage++;
        if (this.currentStage === this.tutorialStages.length) {
            this.end();
            return;
        }
        this.updateInfo();
        this.addStageCompletionListener(this.currentStage);
    },

    setActiveElem: function() {
        this.activeElem = $(this.tutorialStages[this.currentStage].elemID);
    },

    focusActiveElem: function() {
        this.activeElem.addClass('tutorial-focused-elem');
    },

    blurActiveElem: function() {
        this.activeElem.removeClass('tutorial-focused-elem');
    },

    fireTutorialNodeCreatedEvent: function() {
        this.tutorialNodeCreated = true;
    },

    fireTutorialEdgeCreatedEvent: function() {
        this.tutorialEdgeCreated = true;
    },

    toggleInfoVisibility: function() {
        $('#tutorial-info').toggleClass('visible');
    },

    updateInfo: function() {
        const tutorialListContainer = $('#tutorial-info-left');
        tutorialListContainer.empty();
        this.tutorialStages.forEach((stage, index) => tutorialListContainer.append(this.getInfoListpoint(index)));
        this.updateTaskDescription();
    },

    getInfoListpoint: function(stageIndex) {
        const isCurrentStage = stageIndex === this.currentStage;
        const imagePath = `../static/components/images/${stageIndex > this.currentStage - 1 ? 'red-cross' : 'green-tick'}.png`;
        const stageObj = this.tutorialStages[stageIndex];
        const title = stageObj.desc.rus.title;

        const image = document.createElement('img');
        image.setAttribute('src', imagePath);

        const titleContainer = document.createElement(isCurrentStage ? 'b' : 'span');
        titleContainer.append(title);

        const listpoint = document.createElement('div');
        listpoint.setAttribute('class', 'tutorial-listpoint');
        listpoint.appendChild(image);
        listpoint.appendChild(titleContainer);

        return listpoint;
    },

    updateTaskDescription: function() {
        $('#tutorial-point-description')
            .empty()
            .append(this.tutorialStages[this.currentStage].desc.rus.text);
    },

    hideInfo: function() {
        $('#tutorial-info').removeClass('visible');
    },

    clickListener: function() {
        this.setActiveElem();
        this.focusActiveElem();
        this.activeElem.on('click', () => {
            if (this.isInProgress()) {
                this.activeElem.off('click');
                this.commenceToNextStage();
            }
        });
    },

    addStageCompletionListener: function(stageNumber) {
        switch(stageNumber) {
            case 0:
                this.clickListener();
                break;
            case 1:
                this.setActiveElem();
                this.focusActiveElem();
                this.activeElem.on('keyup', event => {
                    if (this.isInProgress() && 'транзитивное'.includes(event.originalEvent.target.value)) {
                        this.activeElem.off('keyup');
                        this.commenceToNextStage();
                    }
                });
                break;
            case 2:
                $("#search-input").on('keyup', () => {
                    if (this.isInProgress()) {
                        const suggestion = $(".tt-suggestion")
                            .toArray()
                            .find(suggestion => suggestion.innerText === 'транзитивное отношение')?.getElementsByTagName('p')[0];
                        if (suggestion) {
                            suggestion.setAttribute('id', 'tutorial-suggestion');
                            this.setActiveElem();
                            this.focusActiveElem();
                            suggestion.addEventListener('click', () => {
                                if (this.isInProgress()) {
                                    $("#search-input").off('keyup');
                                    this.commenceToNextStage();
                                }
                            });
                        }
                    }
                });
                break;
            case 3:
                this.clickListener();
                break;
            case 4:
                $(document).ready(() => {
                    this.clickListener();
                });
                break;
            case 5:
                const scgModeButton = $('#history-item-langs')
                    .find("li")
                    .toArray()
                    .find(listpoint => listpoint.innerText === 'sc.g-текст');
                scgModeButton.setAttribute('id', 'scg-mode-toggle-button');
                this.setActiveElem();
                this.focusActiveElem();
                this.activeElem.on('click', () => {
                    if (this.isInProgress()) {
                        this.activeElem.off('click');
                        this.commenceToNextStage();
                    }
                });
                break;
            case 6:
                this.setActiveElem();
                this.focusActiveElem();
                const nodeInterval = setInterval(() => {
                    if (this.tutorialNodeCreated) {
                        clearInterval(nodeInterval);
                        this.commenceToNextStage();
                    }
                }, 200)
                break;
            case 7:
                this.clickListener();
            case 8:
                this.setActiveElem();
                this.focusActiveElem();
                const edgeInterval = setInterval(() => {
                    if (this.tutorialEdgeCreated) {
                        clearInterval(edgeInterval);
                        this.commenceToNextStage();
                    }
                }, 200)
                break;
        }
    }
}